"""Shared domain enumerations."""

from enum import StrEnum


class MappingStatus(StrEnum):
    """Whether a biomarker name resolved to a LOINC code."""

    MAPPED = "mapped"
    UNMAPPED = "unmapped"
