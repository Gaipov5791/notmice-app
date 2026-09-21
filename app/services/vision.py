"""Vision LLM providers. Gemini is wired; Claude is a swap-in stub."""

from __future__ import annotations

from typing import Any, Protocol, cast

import structlog
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.domain.uploads import (
    RawLabExtraction,
    VisionExtractionError,
    VisionNotConfiguredError,
)

logger = structlog.get_logger(__name__)

_EXTRACTION_INSTRUCTIONS = (
    "Extract every numeric laboratory analyte from this blood panel. "
    "Return lab_name and collected_at (YYYY-MM-DD) when visible. "
    "Do not extract patient name, date of birth, phone, email, or medical record numbers. "
    "Units must stay as printed on the report. "
    "confidence is 0-1 for each marker."
)


class ExtractionProvider(Protocol):
    """Structured lab extraction. Implementations must not write files to disk."""

    @property
    def name(self) -> str:
        """Provider id used in parser_version, e.g. ``gemini``."""

    @property
    def model_id(self) -> str:
        """Model id used in parser_version."""

    async def extract_from_text(self, text: str) -> RawLabExtraction:
        """Structure already-extracted PDF text into markers."""

    async def extract_from_media(self, payload: bytes, mime_type: str) -> RawLabExtraction:
        """OCR a scan, photo, or image-only PDF from in-memory bytes."""


class ClaudeExtractionProvider:
    """Reserved adapter. Implement this class to switch VISION_PROVIDER=claude."""

    name = "claude"

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self.model_id = model

    async def extract_from_text(self, text: str) -> RawLabExtraction:
        """Claude text structuring is not wired yet."""
        del text
        raise VisionNotConfiguredError(
            "Claude Vision is not implemented yet. Keep VISION_PROVIDER=gemini."
        )

    async def extract_from_media(self, payload: bytes, mime_type: str) -> RawLabExtraction:
        """Claude image/PDF vision is not wired yet."""
        del payload, mime_type
        raise VisionNotConfiguredError(
            "Claude Vision is not implemented yet. Keep VISION_PROVIDER=gemini."
        )


class GeminiExtractionProvider:
    """Gemini structured output over inline bytes. Never uses the Files API."""

    name = "gemini"

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self.model_id = model

    def _require_key(self) -> None:
        """Fail closed when the process has no Gemini key."""
        if not self._api_key.strip():
            raise VisionNotConfiguredError("GEMINI_API_KEY is not set")

    async def extract_from_text(self, text: str) -> RawLabExtraction:
        """Send selectable PDF text to Gemini for structuring."""
        self._require_key()
        return await self._complete([_EXTRACTION_INSTRUCTIONS, text])

    async def extract_from_media(self, payload: bytes, mime_type: str) -> RawLabExtraction:
        """Send PDF or image bytes inline. The payload is not uploaded to Files API."""
        self._require_key()
        from google.genai import types

        part = types.Part.from_bytes(data=payload, mime_type=mime_type)
        resolution = (
            types.MediaResolution.MEDIA_RESOLUTION_MEDIUM
            if mime_type == "application/pdf"
            else types.MediaResolution.MEDIA_RESOLUTION_HIGH
        )
        return await self._complete(
            [_EXTRACTION_INSTRUCTIONS, part],
            media_resolution=resolution,
        )

    async def _complete(
        self,
        contents: list[object],
        media_resolution: object | None = None,
    ) -> RawLabExtraction:
        """Call Gemini with retries and parse a RawLabExtraction.

        Args:
            contents: Prompt plus optional inline media part.
            media_resolution: Optional Gemini media_resolution enum value.
        """
        last_error: Exception | None = None
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
            retry=retry_if_exception_type((VisionExtractionError, TimeoutError, ConnectionError)),
            reraise=True,
        ):
            with attempt:
                try:
                    return await self._once(contents, media_resolution)
                except VisionNotConfiguredError:
                    raise
                except VisionExtractionError:
                    raise
                except Exception as exc:
                    last_error = exc
                    logger.warning("gemini_extract_retry", error=str(exc))
                    raise VisionExtractionError("Gemini extraction failed") from exc
        raise VisionExtractionError("Gemini extraction failed") from last_error

    async def _once(
        self,
        contents: list[object],
        media_resolution: object | None,
    ) -> RawLabExtraction:
        """Single Gemini generate_content call."""
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self._api_key)
        config = types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            response_schema=RawLabExtraction,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            media_resolution=cast(Any, media_resolution),
        )
        response = await client.aio.models.generate_content(
            model=self.model_id,
            contents=cast(Any, contents),
            config=config,
        )
        parsed = response.parsed
        if isinstance(parsed, RawLabExtraction):
            return parsed
        if isinstance(parsed, dict):
            return RawLabExtraction.model_validate(parsed)
        text = response.text
        if text:
            return RawLabExtraction.model_validate_json(text)
        raise VisionExtractionError("Gemini returned an empty extraction")


def build_extraction_provider(
    *,
    provider: str,
    gemini_api_key: str,
    gemini_model: str,
    claude_api_key: str,
    claude_model: str,
) -> ExtractionProvider:
    """Return the configured provider. Claude is intentionally unimplemented.

    Args:
        provider: ``gemini`` or ``claude``.
        gemini_api_key: Gemini API key, empty if unset.
        gemini_model: Gemini model id.
        claude_api_key: Reserved for the Claude adapter.
        claude_model: Reserved Claude model id.
    """
    name = provider.strip().lower()
    if name == "gemini":
        return GeminiExtractionProvider(api_key=gemini_api_key, model=gemini_model)
    if name == "claude":
        return ClaudeExtractionProvider(api_key=claude_api_key, model=claude_model)
    raise VisionNotConfiguredError(f"Unknown VISION_PROVIDER: {provider}")
