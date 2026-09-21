"""PII validator tests."""

import pytest

from app.domain.pii import PIIValidationError, reject_pii


def test_reject_pii_allows_biomarker_payload() -> None:
    """Lab names and LOINC fields are not treated as personal names."""
    reject_pii(
        {
            "lab_name": "Quest Diagnostics",
            "raw_name": "Serum Albumin",
            "loinc_code": "1751-7",
            "value": 46.2,
        }
    )


def test_reject_pii_blocks_date_of_birth() -> None:
    """Date of birth is forbidden at any nesting level."""
    with pytest.raises(PIIValidationError, match="date_of_birth"):
        reject_pii({"patient": {"date_of_birth": "1984-01-01"}})


def test_reject_pii_blocks_patient_number_in_list() -> None:
    """Patient numbers in lists are rejected."""
    with pytest.raises(PIIValidationError, match="patient_number"):
        reject_pii([{"patient_number": "A-1"}])
