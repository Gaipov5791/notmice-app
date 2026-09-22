"""PII rejection helpers. Name, date of birth, and patient numbers must never enter the API."""

from collections.abc import Mapping, Sequence
from typing import Final

FORBIDDEN_PII_KEYS: Final[frozenset[str]] = frozenset(
    {
        "full_name",
        "first_name",
        "last_name",
        "given_name",
        "family_name",
        "fio",
        "date_of_birth",
        "dob",
        "birth_date",
        "birthday",
        "patient_number",
        "patient_id",
        "medical_record_number",
        "mrn",
        "lab_account_number",
    }
)

# Internal identifiers and secrets that must never appear on the public read API.
SENSITIVE_OUTPUT_KEYS: Final[frozenset[str]] = FORBIDDEN_PII_KEYS | frozenset(
    {
        "user_id",
        "lab_result_id",
        "biomarker_id",
        "provenance_id",
        "entered_by_user_id",
        "seed_phrase_hash",
        "document_sha256",
        "mnemonic",
        "access_token",
        "internal_id",
    }
)


class PIIValidationError(ValueError):
    """Raised when a payload contains a forbidden personally identifying key."""


def reject_pii(payload: object, *, _path: str = "$") -> None:
    """Walk a JSON-like object and reject forbidden PII keys.

    Args:
        payload: Mapping, sequence, or scalar to inspect.
        _path: JSON-path used in error messages.

    Raises:
        PIIValidationError: If a forbidden key is present at any depth.
    """
    _reject_keys(payload, FORBIDDEN_PII_KEYS, label="Forbidden PII key", _path=_path)


def reject_sensitive_output(payload: object, *, _path: str = "$") -> None:
    """Reject PII keys and internal identifiers on a public response.

    Args:
        payload: Mapping, sequence, or scalar about to be returned.
        _path: JSON-path used in error messages.

    Raises:
        PIIValidationError: If a forbidden key is present at any depth.
    """
    _reject_keys(payload, SENSITIVE_OUTPUT_KEYS, label="Forbidden sensitive key", _path=_path)


def _reject_keys(
    payload: object,
    forbidden: frozenset[str],
    *,
    label: str,
    _path: str,
) -> None:
    """Walk ``payload`` and raise when a key is in ``forbidden``."""
    if isinstance(payload, Mapping):
        for key, value in payload.items():
            key_text = str(key)
            child_path = f"{_path}.{key_text}"
            if key_text.lower() in forbidden:
                raise PIIValidationError(f"{label} at {child_path}")
            _reject_keys(value, forbidden, label=label, _path=child_path)
        return
    if isinstance(payload, Sequence) and not isinstance(payload, (str, bytes, bytearray)):
        for index, item in enumerate(payload):
            _reject_keys(item, forbidden, label=label, _path=f"{_path}[{index}]")
