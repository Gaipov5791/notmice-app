"""Account domain records and errors. No I/O."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


class AccountError(Exception):
    """Base error for account use-cases."""


class InvalidMnemonicError(AccountError):
    """The submitted phrase is not a valid BIP-39 mnemonic."""


class InvalidCredentialsError(AccountError):
    """Phrase does not match any stored argon2id hash, or the token is bad."""


class UnauthenticatedError(AccountError):
    """A protected route was called without a usable access token."""


class AccountNotFoundError(AccountError):
    """The authenticated subject no longer exists."""


@dataclass(frozen=True, slots=True)
class UserRecord:
    """Pseudonymous participant as seen by services. Never includes the phrase."""

    id: UUID
    public_id: str
    is_public: bool
    created_at: datetime


@dataclass(frozen=True, slots=True)
class CreatedAccount:
    """Result of registration. The mnemonic is present only here, once."""

    user: UserRecord
    mnemonic: str
    access_token: str


@dataclass(frozen=True, slots=True)
class AuthenticatedSession:
    """Result of login or token refresh of the current user."""

    user: UserRecord
    access_token: str
