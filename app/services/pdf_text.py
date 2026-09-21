"""In-memory PDF text extraction. The original bytes never touch disk."""

from __future__ import annotations

from io import BytesIO

import pdfplumber

MIN_SELECTABLE_TEXT_CHARS = 80


def extract_pdf_text(payload: bytes) -> str:
    """Return concatenated selectable text from a PDF held in RAM.

    Args:
        payload: Complete PDF bytes. Must not be written to a path.
    """
    pages: list[str] = []
    with pdfplumber.open(BytesIO(payload)) as document:
        for page in document.pages:
            text = page.extract_text() or ""
            stripped = text.strip()
            if stripped:
                pages.append(stripped)
    return "\n".join(pages)


def has_selectable_text(payload: bytes) -> bool:
    """Return True when the PDF has enough text to skip Vision OCR.

    Args:
        payload: Complete PDF bytes.
    """
    return len(extract_pdf_text(payload)) >= MIN_SELECTABLE_TEXT_CHARS
