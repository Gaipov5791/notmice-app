"""In-process UTC-day Gemini token budget. One API worker does not share counters."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, date, datetime
from uuid import UUID

import structlog

from app.domain.uploads import GeminiBudgetExhaustedError

logger = structlog.get_logger(__name__)

# Matches GeminiExtractionProvider retries in app.services.vision.
GEMINI_MAX_ATTEMPTS = 3


@dataclass
class _Bucket:
    """Token and call counters for one UTC day."""

    tokens: int = 0
    calls: int = 0


@dataclass(frozen=True, slots=True)
class TokenHold:
    """Tokens reserved on the user, IP, and global buckets before a model call."""

    user_id: str
    client_key: str
    day: date
    tokens: int


@dataclass(frozen=True, slots=True)
class PersonalTokenUsage:
    """The caller's own counter. Other buckets stay on the server."""

    tokens_used: int
    tokens_limit: int
    warning: bool


class GeminiTokenBudget:
    """Reserve Gemini spend before the call and replace it with measured usage.

    The reserve is ``call_token_reserve * GEMINI_MAX_ATTEMPTS`` so parallel
    requests cannot all pass a nearly empty bucket. ``commit(None)`` keeps that
    reserve when Gemini omits usage metadata. A known total replaces it, and
    any amount above the reserve is added after the fact.

    Counters reset at UTC midnight and when the process restarts.
    """

    def __init__(
        self,
        *,
        daily_token_budget: int,
        user_daily_token_budget: int,
        ip_daily_token_budget: int,
        call_token_reserve: int,
        user_daily_calls: int,
        ip_daily_calls: int,
        warn_ratio: float,
        now: Callable[[], datetime] | None = None,
    ) -> None:
        if min(daily_token_budget, user_daily_token_budget, ip_daily_token_budget) < 1:
            raise ValueError("token budgets must be positive")
        if min(call_token_reserve, user_daily_calls, ip_daily_calls) < 1:
            raise ValueError("call limits must be positive")
        if not 0 < warn_ratio <= 1:
            raise ValueError("warn_ratio must be in (0, 1]")
        self._daily_token_budget = daily_token_budget
        self._user_daily_token_budget = user_daily_token_budget
        self._ip_daily_token_budget = ip_daily_token_budget
        self._call_token_reserve = call_token_reserve
        self._user_daily_calls = user_daily_calls
        self._ip_daily_calls = ip_daily_calls
        self._warn_ratio = warn_ratio
        self._now = now if now is not None else lambda: datetime.now(UTC)
        self._day: date | None = None
        self._users: dict[str, _Bucket] = {}
        self._ips: dict[str, _Bucket] = {}
        self._global = _Bucket()
        self._warning_logged = False
        self._exhausted_logged = False

    def reserve(self, user_id: UUID, client_key: str) -> TokenHold:
        """Hold the worst-case token estimate or refuse before Gemini is called.

        Args:
            user_id: Authenticated account that will own the extract.
            client_key: Client address from ``resolve_client_key``.

        Returns:
            A hold that ``commit`` or ``release`` must close.

        Raises:
            GeminiBudgetExhaustedError: A user, IP, or global cap cannot fit the hold.
        """
        self._roll()
        hold_tokens = self._call_token_reserve * GEMINI_MAX_ATTEMPTS
        user_key = str(user_id)
        user = self._users.get(user_key, _Bucket())
        ip = self._ips.get(client_key, _Bucket())
        if (
            user.calls >= self._user_daily_calls
            or ip.calls >= self._ip_daily_calls
            or user.tokens + hold_tokens > self._user_daily_token_budget
            or ip.tokens + hold_tokens > self._ip_daily_token_budget
            or self._global.tokens + hold_tokens > self._daily_token_budget
        ):
            self._note_global()
            personal = self._personal(user_key)
            raise GeminiBudgetExhaustedError(
                tokens_used=personal.tokens_used,
                tokens_limit=personal.tokens_limit,
            )
        self._users[user_key] = user
        self._ips[client_key] = ip
        user.calls += 1
        ip.calls += 1
        user.tokens += hold_tokens
        ip.tokens += hold_tokens
        self._global.tokens += hold_tokens
        return TokenHold(
            user_id=user_key,
            client_key=client_key,
            day=self._today(),
            tokens=hold_tokens,
        )

    def commit(self, hold: TokenHold, actual_tokens: int | None) -> PersonalTokenUsage:
        """Replace a hold with measured usage.

        Args:
            hold: Reservation returned by ``reserve``.
            actual_tokens: Prompt, candidate, and thought tokens across retries.
                ``None`` keeps the full hold because the bill is unknown.

        Returns:
            The caller's updated personal counter.
        """
        self._roll()
        if hold.day != self._day:
            return self._personal(hold.user_id)
        if actual_tokens is None:
            charged = hold.tokens
        else:
            charged = max(0, actual_tokens)
        delta = charged - hold.tokens
        if delta > 0:
            logger.warning("gemini_budget_overage", extra_tokens=delta)
        for bucket in self._buckets(hold):
            bucket.tokens = max(0, bucket.tokens + delta)
        self._note_global()
        return self._personal(hold.user_id)

    def release(self, hold: TokenHold) -> None:
        """Return a hold when Gemini was never called.

        Args:
            hold: Reservation returned by ``reserve``.
        """
        self._roll()
        if hold.day != self._day:
            return
        user = self._users.get(hold.user_id)
        ip = self._ips.get(hold.client_key)
        if user is not None:
            user.tokens = max(0, user.tokens - hold.tokens)
            user.calls = max(0, user.calls - 1)
        if ip is not None:
            ip.tokens = max(0, ip.tokens - hold.tokens)
            ip.calls = max(0, ip.calls - 1)
        self._global.tokens = max(0, self._global.tokens - hold.tokens)

    def _personal(self, user_id: str) -> PersonalTokenUsage:
        """Return the user bucket only."""
        used = self._users.get(user_id, _Bucket()).tokens
        limit = self._user_daily_token_budget
        threshold = round(limit * self._warn_ratio)
        return PersonalTokenUsage(
            tokens_used=used,
            tokens_limit=limit,
            warning=used >= threshold,
        )

    def _buckets(self, hold: TokenHold) -> tuple[_Bucket, _Bucket, _Bucket]:
        """Return the user, IP, and global buckets for a hold from today."""
        user = self._users.setdefault(hold.user_id, _Bucket())
        ip = self._ips.setdefault(hold.client_key, _Bucket())
        return user, ip, self._global

    def _note_global(self) -> None:
        """Log each global threshold once per UTC day."""
        limit = self._daily_token_budget
        used = self._global.tokens
        if used >= round(limit * self._warn_ratio) and not self._warning_logged:
            self._warning_logged = True
            logger.warning("gemini_budget_warning", tokens_used=used, tokens_limit=limit)
        if used >= limit and not self._exhausted_logged:
            self._exhausted_logged = True
            logger.error("gemini_budget_exhausted", tokens_used=used, tokens_limit=limit)

    def _roll(self) -> None:
        """Drop yesterday's counters when the UTC date changes."""
        today = self._today()
        if self._day == today:
            return
        self._day = today
        self._users.clear()
        self._ips.clear()
        self._global = _Bucket()
        self._warning_logged = False
        self._exhausted_logged = False

    def _today(self) -> date:
        """Return the UTC calendar day used as the bucket key."""
        current = self._now()
        if current.tzinfo is None:
            current = current.replace(tzinfo=UTC)
        return current.astimezone(UTC).date()
