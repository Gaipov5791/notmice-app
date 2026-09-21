"""MIME sniffing and SHA-256 for in-memory uploads. No disk I/O."""

from __future__ import annotations

import hashlib

from app.domain.uploads import EmptyPayloadError, UnsupportedMediaTypeError

_PDF = b"%PDF"
_JPEG = b"\xff\xd8\xff"
_PNG = b"\x89PNG\r\n\x1a\n"
_TIFF_LE = b"II*\x00"
_TIFF_BE = b"MM\x00*"
_RIFF = b"RIFF"
_WEBP = b"WEBP"

ALLOWED_MIME_TYPES: frozenset[str] = frozenset(
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/webp",
    }
)


def sha256_hex(payload: bytes) -> str:
    """Return the SHA-256 hex digest of bytes held in RAM.

    Args:
        payload: Complete file bytes.
    """
    return hashlib.sha256(payload).hexdigest()


def sniff_mime_type(payload: bytes) -> str:
    """Return a supported MIME type from magic bytes.

    Args:
        payload: Complete file bytes.

    Raises:
        EmptyPayloadError: No bytes were provided.
        UnsupportedMediaTypeError: Magic does not match PDF/JPEG/PNG/TIFF/WEBP.
    """
    if not payload:
        raise EmptyPayloadError
    if payload.startswith(_PDF):
        return "application/pdf"
    if payload.startswith(_JPEG):
        return "image/jpeg"
    if payload.startswith(_PNG):
        return "image/png"
    if payload.startswith(_TIFF_LE) or payload.startswith(_TIFF_BE):
        return "image/tiff"
    if payload.startswith(_RIFF) and len(payload) >= 12 and payload[8:12] == _WEBP:
        return "image/webp"
    raise UnsupportedMediaTypeError
