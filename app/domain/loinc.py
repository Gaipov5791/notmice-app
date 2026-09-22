"""Versioned LOINC dictionary records. No file I/O lives here."""

from __future__ import annotations

import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

# The nine Levine PhenoAge codes already verified in phenoAgeData.ts.
PHENOAGE_LOINC: dict[str, str] = {
    "albumin": "1751-7",
    "creatinine": "2160-0",
    "glucose": "2345-7",
    "crp": "30522-7",
    "lymphocyte": "26474-7",
    "mcv": "787-2",
    "rdw": "788-0",
    "alp": "6768-6",
    "wbc": "6690-2",
}

_MIN_MARKERS = 20
_NAME_RE = re.compile(r"[^a-z\u0400-\u04FF0-9%]+", re.IGNORECASE)
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")
_LATIN_RE = re.compile(r"[a-z]")
_UNIT_REPLACEMENTS = (
    ("\u00b5", "u"),  # micro sign
    ("\u03bc", "u"),  # greek mu
    ("\u00b3", "^3"),
    ("\u00d7", "x"),  # multiplication sign
    ("*", "^"),
)


class LoincDictionaryError(Exception):
    """The biomarker dictionary failed validation."""


@dataclass(frozen=True, slots=True)
class ConvertedValue:
    """A numeric result after a unit lookup.

    ``unit_recognized`` is false when the reported unit is not in the dictionary.
    The original number is kept so a typo in the unit label is not dropped.
    """

    value: Decimal
    unit: str
    unit_recognized: bool


@dataclass(frozen=True, slots=True)
class BiomarkerEntry:
    """One LOINC analyte: synonyms, canonical unit, and a typo range."""

    entry_id: str
    loinc: str
    name_en: str
    name_ru: str
    phenoage: bool
    canonical_unit: str
    plausible_min: Decimal
    plausible_max: Decimal
    units: dict[str, tuple[Decimal, Decimal]]

    def convert(self, value: Decimal, unit: str) -> ConvertedValue:
        """Scale ``value`` into the canonical unit when the label is known.

        Args:
            value: Reported number.
            unit: Reported unit label.
        """
        factors = self.units.get(normalize_unit(unit))
        if factors is None:
            return ConvertedValue(value=value, unit=unit.strip(), unit_recognized=False)
        factor, divisor = factors
        return ConvertedValue(
            value=value * factor / divisor,
            unit=self.canonical_unit,
            unit_recognized=True,
        )

    def within_range(self, value: Decimal) -> bool:
        """Return whether ``value`` sits inside the typo-rejection window.

        Args:
            value: Number already expressed in the canonical unit.
        """
        return self.plausible_min <= value <= self.plausible_max


@dataclass(frozen=True, slots=True)
class LoincDictionary:
    """In-memory LOINC catalog keyed by normalized analyte name."""

    dictionary_id: str
    version: str
    license: str
    entries: tuple[BiomarkerEntry, ...]
    by_synonym: dict[str, BiomarkerEntry]

    def find(self, normalized_name: str) -> BiomarkerEntry | None:
        """Return the entry for a normalized analyte name, if any.

        Args:
            normalized_name: Output of ``normalize_analyte_name``.
        """
        return self.by_synonym.get(normalized_name)

    @classmethod
    def from_payload(cls, payload: object) -> LoincDictionary:
        """Validate a decoded dictionary document.

        Args:
            payload: JSON object loaded by the caller.

        Raises:
            LoincDictionaryError: The document is incomplete or inconsistent.
        """
        document = _as_object(payload, "dictionary")
        dictionary_id = _require_str(document, "id")
        version = _require_str(document, "version")
        license_name = _require_str(document, "license")
        standard = _require_str(document, "standard")
        if license_name != "CC-BY-4.0":
            raise LoincDictionaryError("Dictionary license must be CC-BY-4.0")
        if standard != "LOINC":
            raise LoincDictionaryError("Dictionary standard must be LOINC")
        if "snomed" in document:
            raise LoincDictionaryError("SNOMED is not part of the phase 2 dictionary")

        raw_markers = document.get("markers")
        if not isinstance(raw_markers, list) or len(raw_markers) < _MIN_MARKERS:
            raise LoincDictionaryError(f"Dictionary needs at least {_MIN_MARKERS} markers")

        entries: list[BiomarkerEntry] = []
        by_synonym: dict[str, BiomarkerEntry] = {}
        seen_ids: set[str] = set()
        seen_loinc: set[str] = set()
        for index, raw_marker in enumerate(raw_markers):
            entry = _parse_entry(_as_object(raw_marker, f"markers[{index}]"))
            if entry.entry_id in seen_ids:
                raise LoincDictionaryError(f"Duplicate marker id {entry.entry_id}")
            if entry.loinc in seen_loinc:
                raise LoincDictionaryError(f"Duplicate LOINC {entry.loinc}")
            seen_ids.add(entry.entry_id)
            seen_loinc.add(entry.loinc)
            entries.append(entry)
            _index_synonyms(entry, raw_marker, by_synonym)

        missing = [code for marker_id, code in PHENOAGE_LOINC.items() if marker_id not in seen_ids]
        if missing:
            raise LoincDictionaryError("PhenoAge markers are missing from the dictionary")
        for entry in entries:
            expected = PHENOAGE_LOINC.get(entry.entry_id)
            if expected is None:
                continue
            if not entry.phenoage or entry.loinc != expected:
                raise LoincDictionaryError(
                    f"PhenoAge marker {entry.entry_id} drifted from {expected}"
                )

        return cls(
            dictionary_id=dictionary_id,
            version=version,
            license=license_name,
            entries=tuple(entries),
            by_synonym=by_synonym,
        )


def normalize_analyte_name(name: str) -> str:
    """Lowercase and strip punctuation so synonyms can match.

    Args:
        name: Raw label from the document, model, or dictionary.
    """
    folded = name.strip().lower().replace("\u0451", "\u0435")
    collapsed = _NAME_RE.sub(" ", folded)
    return " ".join(collapsed.split())


def normalize_unit(unit: str) -> str:
    """Fold unit spelling differences (µ/μ, superscripts, spaces).

    Args:
        unit: Reported or dictionary unit label.
    """
    text = unit.strip().lower()
    for source, target in _UNIT_REPLACEMENTS:
        text = text.replace(source, target)
    return "".join(text.split())


def _parse_entry(raw: dict[str, object]) -> BiomarkerEntry:
    entry_id = _require_str(raw, "id")
    loinc = _require_str(raw, "loinc")
    canonical_unit = _require_str(raw, "canonical_unit")
    plausible_min = _require_decimal(raw, "plausible_min")
    plausible_max = _require_decimal(raw, "plausible_max")
    if plausible_min >= plausible_max:
        raise LoincDictionaryError(f"{entry_id} plausible range is empty")
    if "snomed" in raw:
        raise LoincDictionaryError(f"{entry_id} must not carry a SNOMED code")
    units = _parse_units(entry_id, canonical_unit, raw.get("units"))
    phenoage = raw.get("phenoage")
    if not isinstance(phenoage, bool):
        raise LoincDictionaryError(f"{entry_id} phenoage flag must be a boolean")
    return BiomarkerEntry(
        entry_id=entry_id,
        loinc=loinc,
        name_en=_require_str(raw, "name_en"),
        name_ru=_require_str(raw, "name_ru"),
        phenoage=phenoage,
        canonical_unit=canonical_unit,
        plausible_min=plausible_min,
        plausible_max=plausible_max,
        units=units,
    )


def _parse_units(
    entry_id: str,
    canonical_unit: str,
    raw_units: object,
) -> dict[str, tuple[Decimal, Decimal]]:
    if not isinstance(raw_units, list) or not raw_units:
        raise LoincDictionaryError(f"{entry_id} needs at least one unit")
    units: dict[str, tuple[Decimal, Decimal]] = {}
    canonical_key = normalize_unit(canonical_unit)
    canonical_seen = False
    for index, raw_unit in enumerate(raw_units):
        unit = _as_object(raw_unit, f"{entry_id}.units[{index}]")
        factor = _require_decimal(unit, "factor")
        divisor = _require_decimal(unit, "divisor")
        if factor <= 0 or divisor <= 0:
            raise LoincDictionaryError(f"{entry_id} unit factor must be positive")
        labels = [_require_str(unit, "label")]
        aliases = unit.get("aliases", [])
        if not isinstance(aliases, list):
            raise LoincDictionaryError(f"{entry_id} unit aliases must be a list")
        labels.extend(_require_str_item(alias, entry_id) for alias in aliases)
        for label in labels:
            key = normalize_unit(label)
            factors = (factor, divisor)
            existing = units.get(key)
            if existing is not None and existing != factors:
                raise LoincDictionaryError(f"{entry_id} repeats unit {label} with another factor")
            units[key] = factors
            if key == canonical_key and factor == 1 and divisor == 1:
                canonical_seen = True
    if not canonical_seen:
        raise LoincDictionaryError(f"{entry_id} canonical unit {canonical_unit} has no 1:1 entry")
    return units


def _index_synonyms(
    entry: BiomarkerEntry,
    raw: object,
    by_synonym: dict[str, BiomarkerEntry],
) -> None:
    document = _as_object(raw, entry.entry_id)
    raw_synonyms = document.get("synonyms")
    if not isinstance(raw_synonyms, list) or not raw_synonyms:
        raise LoincDictionaryError(f"{entry.entry_id} needs synonyms")
    names = [_require_str_item(item, entry.entry_id) for item in raw_synonyms]
    names.extend((entry.name_en, entry.name_ru))
    normalized = [normalize_analyte_name(name) for name in names]
    if not any(_LATIN_RE.search(name) for name in normalized):
        raise LoincDictionaryError(f"{entry.entry_id} needs an English synonym")
    if not any(_CYRILLIC_RE.search(name) for name in normalized):
        raise LoincDictionaryError(f"{entry.entry_id} needs a Russian synonym")
    for name in normalized:
        if not name:
            raise LoincDictionaryError(f"{entry.entry_id} has an empty synonym")
        previous = by_synonym.get(name)
        if previous is not None and previous.entry_id != entry.entry_id:
            raise LoincDictionaryError(f"Synonym {name!r} is shared by two markers")
        by_synonym[name] = entry


def _as_object(value: object, label: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise LoincDictionaryError(f"{label} must be an object")
    return {str(key): item for key, item in value.items()}


def _require_str(payload: dict[str, object], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise LoincDictionaryError(f"{key} must be a non-empty string")
    return value.strip()


def _require_str_item(value: object, entry_id: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise LoincDictionaryError(f"{entry_id} synonym must be a non-empty string")
    return value.strip()


def _require_decimal(payload: dict[str, object], key: str) -> Decimal:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, str):
        raise LoincDictionaryError(f"{key} must be a decimal string")
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise LoincDictionaryError(f"{key} is not a decimal") from exc
