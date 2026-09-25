"""Assemble the research feed from PubMed and the RSS allowlist."""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol
from urllib.parse import urlsplit

import httpx
import structlog

from app.domain.news import (
    NewsCard,
    NewsFetchError,
    assert_public_https,
    merge_cards,
    parse_esearch_ids,
    parse_pubmed_articles,
    parse_rss,
    pubmed_efetch_url,
    pubmed_esearch_url,
    same_feed_host,
)

logger = structlog.get_logger(__name__)

_TOOL = "notmice"
_MAX_PUBMED = 20
_RSS_PER_FEED = 8
_MAX_ITEMS = 24
_MAX_BYTES = 2_000_000


class TextFetcher(Protocol):
    """Reads the text of one allowlisted HTTPS URL."""

    async def get_text(self, url: str) -> str:
        """Return the response body or raise ``NewsFetchError``."""


@dataclass(frozen=True, slots=True)
class NewsSnapshot:
    """What ``GET /api/v1/news`` returns before the HTTP schema mapping."""

    items: tuple[NewsCard, ...]
    fetched_at: datetime | None
    stale: bool
    error: str | None


@dataclass(slots=True)
class _CacheEntry:
    stored_at: float
    items: tuple[NewsCard, ...]


class NewsMemoryCache:
    """Per-source memory cache. Workers do not share it."""

    def __init__(self, ttl_seconds: int) -> None:
        if ttl_seconds < 1:
            raise ValueError("ttl_seconds must be positive")
        self.ttl_seconds = ttl_seconds
        self._entries: dict[str, _CacheEntry] = {}

    def get(self, key: str) -> _CacheEntry | None:
        """Return the stored entry, fresh or expired."""
        return self._entries.get(key)

    def is_fresh(self, entry: _CacheEntry, now: float) -> bool:
        """True while the entry is still inside the TTL."""
        return now - entry.stored_at < self.ttl_seconds

    def put(self, key: str, items: list[NewsCard], now: float) -> None:
        """Replace one source entry."""
        self._entries[key] = _CacheEntry(stored_at=now, items=tuple(items))

    def clear(self) -> None:
        """Drop every source entry."""
        self._entries.clear()


class HttpxTextFetcher:
    """HTTPS GET with a size cap. Redirects may not leave the original host."""

    def __init__(self, timeout_seconds: float = 12.0) -> None:
        self._timeout = timeout_seconds

    async def get_text(self, url: str) -> str:
        """Fetch one allowlisted URL."""
        assert_public_https(url)
        started = urlsplit(url).hostname
        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                follow_redirects=True,
                headers={"User-Agent": "NotMiceResearch/0.1"},
            ) as client:
                response = await client.get(url)
        except httpx.HTTPError as exc:
            raise NewsFetchError("fetch failed") from exc
        final = str(response.url)
        assert_public_https(final)
        if not same_feed_host(started, urlsplit(final).hostname):
            raise NewsFetchError("redirect left the feed host")
        if response.status_code != 200:
            raise NewsFetchError("status")
        if len(response.content) > _MAX_BYTES:
            raise NewsFetchError("too large")
        return response.text


class NewsService:
    """Load PubMed and RSS sources, serving the last good copy when one fails."""

    def __init__(
        self,
        fetcher: TextFetcher,
        cache: NewsMemoryCache,
        *,
        rss_feeds: list[str],
        pubmed_retmax: int = 12,
        snippet_max_chars: int = 420,
        email: str = "",
        now: Callable[[], float] | None = None,
    ) -> None:
        self._fetcher = fetcher
        self._cache = cache
        self._rss_feeds = rss_feeds
        self._retmax = min(max(pubmed_retmax, 1), _MAX_PUBMED)
        self._snippet_max_chars = snippet_max_chars
        self._email = email
        self._now = now if now is not None else time.monotonic
        self._lock = asyncio.Lock()

    async def read(self) -> NewsSnapshot:
        """Return cards from fresh sources, then expired cache, then an empty error."""
        async with self._lock:
            return await self._read_locked()

    async def _read_locked(self) -> NewsSnapshot:
        collected: list[NewsCard] = []
        saw_success = False
        saw_stale = False

        async def take(key: str, loader: Callable[[], Awaitable[list[NewsCard]]]) -> None:
            nonlocal saw_success, saw_stale
            now = self._now()
            cached = self._cache.get(key)
            if cached is not None and self._cache.is_fresh(cached, now):
                collected.extend(cached.items)
                saw_success = True
                return
            try:
                items = await loader()
            except NewsFetchError:
                logger.info("news_source_failed", source=key)
                if cached is not None:
                    collected.extend(cached.items)
                    saw_stale = True
                return
            self._cache.put(key, items, now)
            collected.extend(items)
            saw_success = True

        await take("pubmed", self._fetch_pubmed)
        for index, feed_url in enumerate(self._rss_feeds):
            await take(f"rss:{index}", self._rss_loader(feed_url))

        if not saw_success and not collected:
            return NewsSnapshot(items=(), fetched_at=None, stale=False, error="unavailable")
        items = tuple(merge_cards(collected, _MAX_ITEMS))
        return NewsSnapshot(
            items=items,
            fetched_at=datetime.now(UTC),
            stale=saw_stale,
            error=None,
        )

    def clear(self) -> None:
        """Drop cached source payloads."""
        self._cache.clear()

    def _rss_loader(self, feed_url: str) -> Callable[[], Awaitable[list[NewsCard]]]:
        async def load() -> list[NewsCard]:
            return await self._fetch_rss(feed_url)

        return load

    async def _fetch_pubmed(self) -> list[NewsCard]:
        search_url = pubmed_esearch_url(
            retmax=self._retmax,
            tool=_TOOL,
            email=self._email,
        )
        raw_ids = await self._fetcher.get_text(search_url)
        pmids = parse_esearch_ids(raw_ids, self._retmax)
        if not pmids:
            return []
        fetch_url = pubmed_efetch_url(pmids, tool=_TOOL, email=self._email)
        raw_xml = await self._fetcher.get_text(fetch_url)
        return parse_pubmed_articles(raw_xml, snippet_max_chars=self._snippet_max_chars)

    async def _fetch_rss(self, feed_url: str) -> list[NewsCard]:
        assert_public_https(feed_url)
        raw = await self._fetcher.get_text(feed_url)
        return parse_rss(
            raw,
            feed_url=feed_url,
            snippet_max_chars=self._snippet_max_chars,
            limit=_RSS_PER_FEED,
        )
