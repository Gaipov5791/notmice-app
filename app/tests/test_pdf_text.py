"""pdfplumber RAM extraction for selectable PDFs."""

from __future__ import annotations

from app.services.pdf_text import extract_pdf_text, has_selectable_text
from app.tests.test_uploads import _text_pdf


def test_pdfplumber_reads_bytes_from_memory() -> None:
    """A text PDF yields the printed analytes without a filesystem path."""
    payload = _text_pdf(
        "Serum Albumin 46.2 g/L  Creatinine 0.88 mg/dL  Glucose 84 mg/dL extra padding text"
    )
    text = extract_pdf_text(payload)
    assert "Albumin" in text
    assert has_selectable_text(payload) is True


def test_image_like_pdf_without_text_is_not_selectable() -> None:
    """A PDF wrapper with almost no text should fall through to Vision."""
    payload = _text_pdf("x")
    assert has_selectable_text(payload) is False
