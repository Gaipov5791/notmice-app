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
    if isinstance(payload, Mapping):
        for key, value in payload.items():
            key_text = str(key)
            child_path = f"{_path}.{key_text}"
            if key_text.lower() in FORBIDDEN_PII_KEYS:
                raise PIIValidationError(f"Forbidden PII key at {child_path}")
            reject_pii(value, _path=child_path)
        return
    if isinstance(payload, Sequence) and not isinstance(payload, (str, bytes, bytearray)):
        for index, item in enumerate(payload):
            reject_pii(item, _path=f"{_path}[{index}]")
