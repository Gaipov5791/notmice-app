"""Pseudonymous account use-cases. No FastAPI, no ORM models."""

from __future__ import annotations

import secrets
from typing import Protocol
from uuid import UUID

import structlog

from app.core.security import (
    Argon2SeedHasher,
    JwtTokenIssuer,
    TokenError,
    generate_mnemonic,
    is_valid_mnemonic,
    normalize_mnemonic,
)
from app.domain.accounts import (
    AccountNotFoundError,
    AuthenticatedSession,
    CreatedAccount,
    InvalidCredentialsError,
    InvalidMnemonicError,
    UnauthenticatedError,
    UserRecord,
)
from app.domain.pii import reject_pii

logger = structlog.get_logger(__name__)

_PUBLIC_ID_BYTES = 8
_PUBLIC_ID_ATTEMPTS = 8


class UserStore(Protocol):
    """Persistence contract used by AccountService."""

    async def create(self, *, public_id: str, seed_phrase_hash: str) -> UserRecord:
        """Insert a user and default-private share settings."""

    async def get_by_id(self, user_id: UUID) -> UserRecord | None:
        """Load by internal id."""

    async def get_by_public_id(self, public_id: str) -> UserRecord | None:
        """Load by public identifier."""

    async def get_by_seed_phrase_hash(self, seed_phrase_hash: str) -> UserRecord | None:
        """Load by argon2id encoding."""

    async def set_is_public(self, user_id: UUID, is_public: bool) -> UserRecord | None:
        """Update the opt-in sharing flag."""


def new_public_id() -> str:
    """Return a random public identifier such as ``nm`` + 16 hex chars."""
    return f"nm{secrets.token_hex(_PUBLIC_ID_BYTES)}"


class AccountService:
    """Create, authenticate, and update share settings for pseudonymous users."""

    def __init__(
        self,
        users: UserStore,
        hasher: Argon2SeedHasher,
        tokens: JwtTokenIssuer,
    ) -> None:
        self._users = users
        self._hasher = hasher
        self._tokens = tokens

    async def create(self) -> CreatedAccount:
        """Generate a BIP-39 phrase, store only its argon2id hash, return the phrase once."""
        mnemonic = generate_mnemonic()
        seed_phrase_hash = self._hasher.hash_phrase(mnemonic)
        public_id = await self._allocate_public_id()
        user = await self._users.create(public_id=public_id, seed_phrase_hash=seed_phrase_hash)
        access_token = self._tokens.issue(user.id, user.public_id)
        logger.info("account_created", public_id=user.public_id)
        return CreatedAccount(user=user, mnemonic=mnemonic, access_token=access_token)

    async def login(self, mnemonic_raw: str) -> AuthenticatedSession:
        """Authenticate with a recovery phrase.

        Args:
            mnemonic_raw: User-supplied phrase. Normalized and checksum-checked.

        Raises:
            InvalidMnemonicError: Phrase is not valid BIP-39.
            InvalidCredentialsError: Phrase is valid but matches no account.
        """
        reject_pii({"mnemonic": mnemonic_raw})
        mnemonic = normalize_mnemonic(mnemonic_raw)
        if not is_valid_mnemonic(mnemonic):
            raise InvalidMnemonicError
        seed_phrase_hash = self._hasher.hash_phrase(mnemonic)
        user = await self._users.get_by_seed_phrase_hash(seed_phrase_hash)
        if user is None:
            raise InvalidCredentialsError
        access_token = self._tokens.issue(user.id, user.public_id)
        logger.info("account_login", public_id=user.public_id)
        return AuthenticatedSession(user=user, access_token=access_token)

    async def authenticate(self, token: str | None) -> UserRecord:
        """Resolve a bearer token to a user.

        Args:
            token: Raw JWT, or None if the header was missing.

        Raises:
            UnauthenticatedError: Token missing or invalid.
            AccountNotFoundError: Subject was deleted.
        """
        if token is None or token.strip() == "":
            raise UnauthenticatedError
        try:
            claims = self._tokens.parse(token)
        except TokenError as exc:
            raise UnauthenticatedError from exc
        user = await self._users.get_by_id(claims.user_id)
        if user is None:
            raise AccountNotFoundError
        return user

    async def set_public(self, user_id: UUID, is_public: bool) -> UserRecord:
        """Persist the opt-in sharing toggle.

        Args:
            user_id: Authenticated user.
            is_public: New flag value.

        Raises:
            AccountNotFoundError: User no longer exists.
        """
        user = await self._users.set_is_public(user_id, is_public)
        if user is None:
            raise AccountNotFoundError
        logger.info("share_settings_updated", public_id=user.public_id, is_public=is_public)
        return user

    async def _allocate_public_id(self) -> str:
        """Generate a unique public_id, retrying on the vanishingly rare collision."""
        for _ in range(_PUBLIC_ID_ATTEMPTS):
            candidate = new_public_id()
            existing = await self._users.get_by_public_id(candidate)
            if existing is None:
                return candidate
        raise RuntimeError("Unable to allocate a unique public_id")
