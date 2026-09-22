"""Pydantic schemas shared across API and services."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthStatus(BaseModel):
    """Public /healthz payload."""

    model_config = ConfigDict(extra="forbid")

    status: str = Field(description="ok when the process and database are reachable.")
    database: str = Field(description="ok or unavailable.")


class AccountCreateRequest(BaseModel):
    """Empty body for registration. Extra keys (email, phone) are rejected."""

    model_config = ConfigDict(extra="forbid")


class AccountLoginRequest(BaseModel):
    """Login with a BIP-39 recovery phrase. No email or phone."""

    model_config = ConfigDict(extra="forbid")

    mnemonic: str = Field(
        min_length=1,
        max_length=500,
        description="12-word English BIP-39 recovery phrase.",
    )


class ShareSettingsUpdate(BaseModel):
    """Opt-in public sharing flag."""

    model_config = ConfigDict(extra="forbid")

    is_public: bool = Field(description="True when the profile may appear in the public dataset.")


class AccountView(BaseModel):
    """Public representation of a pseudonymous account. No phrase, no hash."""

    model_config = ConfigDict(extra="forbid")

    public_id: str
    is_public: bool
    created_at: datetime


class AccountSessionResponse(AccountView):
    """Account view plus a bearer token. Used after login."""

    access_token: str
    token_type: str = "bearer"


class AccountCreatedResponse(AccountSessionResponse):
    """Registration payload. ``mnemonic`` is included only on this response."""

    mnemonic: str = Field(description="12-word BIP-39 phrase, shown once. Not stored.")


class ExtractedMarkerView(BaseModel):
    """One analyte returned to the review UI."""

    model_config = ConfigDict(extra="forbid")

    raw_name: str
    canonical_id: str | None
    loinc_code: str | None
    value: float
    unit: str
    confidence: float
    mapping_status: str
    within_range: bool | None = Field(
        description="False when a mapped value sits outside the dictionary typo window.",
    )


class ExtractResponse(BaseModel):
    """Extract result. The original file is not included."""

    model_config = ConfigDict(extra="forbid")

    extract_token: str
    document_sha256: str
    parser_version: str
    lab_name: str | None
    collected_at: date | None
    chronological_age: float | None
    markers: list[ExtractedMarkerView]


class ConfirmedMarkerInput(BaseModel):
    """Human-edited analyte row from the review UI."""

    model_config = ConfigDict(extra="forbid")

    raw_name: str = Field(min_length=1, max_length=255)
    value: float
    unit: str = Field(min_length=1, max_length=32)


class ConfirmRequest(BaseModel):
    """Confirm payload. Hash and parser version are taken from the extract session."""

    model_config = ConfigDict(extra="forbid")

    extract_token: str = Field(min_length=8, max_length=128)
    lab_name: str | None = Field(default=None, max_length=255)
    collected_at: date | None = None
    chronological_age: float | None = Field(default=None, ge=0, le=120)
    markers: list[ConfirmedMarkerInput] = Field(min_length=1)


class ConfirmResponse(BaseModel):
    """Persisted lab result after sign-off."""

    model_config = ConfigDict(extra="forbid")

    lab_result_id: UUID
    document_sha256: str
    parser_version: str
    confirmed_at: datetime
    marker_count: int
