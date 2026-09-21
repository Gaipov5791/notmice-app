"""Pydantic schemas shared across API and services."""

from datetime import datetime

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
