"""Upload/extract domain records, errors, and PhenoAge name mapping."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import MappingStatus

PARSER_NAME = "notmice-extract"
PARSER_RELEASE = "1.0"

# Nine Levine PhenoAge markers. Module 4 will replace this with a versioned YAML dictionary.
_LOINC_TO_CANONICAL: dict[str, str] = {
    "1751-7": "albumin",
    "2160-0": "creatinine",
    "2345-7": "glucose",
    "30522-7": "crp",
    "26474-7": "lymphocyte",
    "787-2": "mcv",
    "788-0": "rdw",
    "6768-6": "alp",
    "6690-2": "wbc",
}

_NAME_TO_CANONICAL: dict[str, str] = {
    "albumin": "albumin",
    "serum albumin": "albumin",
    "alb": "albumin",
    "альбумин": "albumin",
    "creatinine": "creatinine",
    "serum creatinine": "creatinine",
    "creat": "creatinine",
    "креатинин": "creatinine",
    "glucose": "glucose",
    "fasting glucose": "glucose",
    "fasting serum glucose": "glucose",
    "глюкоза": "glucose",
    "crp": "crp",
    "hs crp": "crp",
    "hs-crp": "crp",
    "c reactive protein": "crp",
    "c-reactive protein": "crp",
    "high sensitivity crp": "crp",
    "лимфоциты": "lymphocyte",
    "lymphocyte": "lymphocyte",
    "lymphocyte percentage": "lymphocyte",
    "lymphocytes": "lymphocyte",
    "lym": "lymphocyte",
    "mcv": "mcv",
    "mean corpuscular volume": "mcv",
    "rdw": "rdw",
    "red cell distribution width": "rdw",
    "alp": "alp",
    "alkaline phosphatase": "alp",
    "щелочная фосфатаза": "alp",
    "wbc": "wbc",
    "white blood cell": "wbc",
    "white blood cell count": "wbc",
    "leukocytes": "wbc",
    "лейкоциты": "wbc",
}

_CANONICAL_TO_LOINC: dict[str, str] = {
    canonical: loinc for loinc, canonical in _LOINC_TO_CANONICAL.items()
}

_NORMALIZE_RE = re.compile(r"[^a-z\u0400-\u04FF0-9%]+", re.IGNORECASE)


class UploadError(Exception):
    """Base error for extract and confirm use-cases."""


class UnsupportedMediaTypeError(UploadError):
    """The file is not a PDF or a supported image."""


class PayloadTooLargeError(UploadError):
    """The in-memory file exceeded the configured size limit."""


class EmptyPayloadError(UploadError):
    """The upload contained no bytes."""


class VisionNotConfiguredError(UploadError):
    """The selected Vision provider has no API key or is not implemented."""


class VisionExtractionError(UploadError):
    """The Vision provider failed after retries."""


class ExtractSessionNotFoundError(UploadError):
    """The extract token is missing, expired, or belongs to another user."""


class NoMarkersError(UploadError):
    """Extraction produced no numeric analytes."""


class RawMarker(BaseModel):
    """One analyte as returned by pdfplumber/Vision before persistence."""

    model_config = ConfigDict(extra="forbid")

    raw_name: str = Field(min_length=1, max_length=255)
    value: float
    unit: str = Field(min_length=1, max_length=32)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class RawLabExtraction(BaseModel):
    """Structured lab panel used as the Gemini/Claude response schema."""

    model_config = ConfigDict(extra="forbid")

    lab_name: str | None = Field(default=None, max_length=255)
    collected_at: str | None = Field(default=None, description="ISO date YYYY-MM-DD if present.")
    chronological_age: float | None = Field(default=None, ge=0, le=120)
    markers: list[RawMarker] = Field(default_factory=list)


@dataclass(frozen=True, slots=True)
class MappedMarker:
    """A raw analyte after local LOINC/canonical matching."""

    raw_name: str
    value: Decimal
    unit: str
    confidence: float
    canonical_id: str | None
    loinc_code: str | None
    mapping_status: MappingStatus


@dataclass(frozen=True, slots=True)
class ExtractedPanel:
    """RAM-only extract result. Never includes the original file bytes."""

    document_sha256: str
    parser_version: str
    lab_name: str | None
    collected_at: date | None
    chronological_age: Decimal | None
    markers: tuple[MappedMarker, ...]


@dataclass(frozen=True, slots=True)
class ExtractSession:
    """Temporary extract token payload. File bytes are not stored."""

    token: str
    user_id: UUID
    panel: ExtractedPanel
    created_at: datetime


@dataclass(frozen=True, slots=True)
class ConfirmedLabResult:
    """Persisted panel after human sign-off."""

    lab_result_id: UUID
    document_sha256: str
    parser_version: str
    confirmed_at: datetime
    marker_count: int


def parser_version_for(provider: str, model: str) -> str:
    """Return a provenance parser version string.

    Args:
        provider: ``gemini`` or ``claude``.
        model: Provider model id.
    """
    return f"{PARSER_NAME}/{PARSER_RELEASE}/{provider}/{model}"


def normalize_analyte_name(name: str) -> str:
    """Lowercase and strip punctuation so synonyms can match.

    Args:
        name: Raw label from the document or model.
    """
    collapsed = _NORMALIZE_RE.sub(" ", name.strip().lower())
    return " ".join(collapsed.split())


def map_marker(raw: RawMarker) -> MappedMarker:
    """Attach a PhenoAge canonical id and LOINC when the name is known.

    Unrecognised names stay ``unmapped`` and are not dropped.

    Args:
        raw: Marker as extracted by pdfplumber or Vision.
    """
    canonical = _NAME_TO_CANONICAL.get(normalize_analyte_name(raw.raw_name))
    loinc = _CANONICAL_TO_LOINC.get(canonical) if canonical is not None else None
    status = MappingStatus.MAPPED if canonical is not None else MappingStatus.UNMAPPED
    return MappedMarker(
        raw_name=raw.raw_name.strip(),
        value=Decimal(str(raw.value)),
        unit=raw.unit.strip(),
        confidence=raw.confidence,
        canonical_id=canonical,
        loinc_code=loinc,
        mapping_status=status,
    )


def parse_collected_at(value: str | None) -> date | None:
    """Parse an ISO date from model output, or return None if unusable.

    Args:
        value: YYYY-MM-DD or empty.
    """
    if value is None:
        return None
    text = value.strip()
    if len(text) < 10:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None
