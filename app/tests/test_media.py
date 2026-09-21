"""SHA-256 and MIME sniffing for in-memory uploads."""

from __future__ import annotations

import pytest

from app.domain.uploads import EmptyPayloadError, UnsupportedMediaTypeError
from app.services.media import sha256_hex, sniff_mime_type

_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 16
_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 8
_PDF = b"%PDF-1.4\n% rest"


def test_sha256_is_real_hex_digest() -> None:
    """Provenance hash is SHA-256, not a truncated integer hash."""
    digest = sha256_hex(b"notmice-lab-panel")
    assert len(digest) == 64
    assert set(digest) <= set("0123456789abcdef")
    assert digest == sha256_hex(b"notmice-lab-panel")
    assert digest != sha256_hex(b"other")


def test_known_sha256_vector() -> None:
    """Empty bytes match the published SHA-256 of the empty string."""
    assert sha256_hex(b"") == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"


def test_sniff_supported_types() -> None:
    """PDF and common lab-scan images are accepted from magic bytes."""
    assert sniff_mime_type(_PDF) == "application/pdf"
    assert sniff_mime_type(_JPEG) == "image/jpeg"
    assert sniff_mime_type(_PNG) == "image/png"
    assert sniff_mime_type(b"II*\x00rest") == "image/tiff"
    assert sniff_mime_type(b"RIFF....WEBP") == "image/webp"


def test_sniff_rejects_unknown_and_empty() -> None:
    """Executable/text uploads are rejected; empty payload is a distinct error."""
    with pytest.raises(UnsupportedMediaTypeError):
        sniff_mime_type(b"MZ\x90\x00this is not a lab file")
    with pytest.raises(EmptyPayloadError):
        sniff_mime_type(b"")
