"""BIP-39, argon2id, and JWT primitives. No HTTP or database imports."""

from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2.low_level import Type, hash_secret
from mnemonic import Mnemonic

_MNEMONIC = Mnemonic("english")
_JWT_ALGORITHM = "HS256"
_ARGON2_TIME_COST = 2
_ARGON2_MEMORY_COST = 19_456
_ARGON2_PARALLELISM = 1
_ARGON2_HASH_LEN = 32
_SALT_LEN = 16
_MNEMONIC_STRENGTH_BITS = 128


class TokenError(ValueError):
    """Raised when a JWT is missing, malformed, or expired."""


def normalize_mnemonic(phrase: str) -> str:
    """Collapse whitespace and lowercase a recovery phrase.

    Args:
        phrase: Raw user input.

    Returns:
        Canonical BIP-39 spacing (single spaces, lower case).
    """
    return " ".join(phrase.strip().lower().split())


def generate_mnemonic() -> str:
    """Return a new 12-word English BIP-39 phrase."""
    return _MNEMONIC.generate(strength=_MNEMONIC_STRENGTH_BITS)


def is_valid_mnemonic(phrase: str) -> bool:
    """Return True when the phrase is a checksummed BIP-39 English mnemonic.

    Args:
        phrase: Already-normalized recovery phrase.
    """
    return bool(_MNEMONIC.check(phrase))


class Argon2SeedHasher:
    """Deterministic argon2id hasher so a phrase can be looked up by hash."""

    def __init__(self, pepper: str) -> None:
        self._pepper = pepper.encode("utf-8")

    def hash_phrase(self, mnemonic: str) -> str:
        """Return a PHC-encoded argon2id hash of the normalized phrase.

        The salt is HMAC-SHA256(pepper, phrase) truncated to 16 bytes, so the
        same phrase always produces the same encoded hash for a given pepper.
        The phrase itself is never returned.

        Args:
            mnemonic: Normalized BIP-39 phrase.
        """
        secret = mnemonic.encode("utf-8")
        salt = hmac.new(self._pepper, secret, hashlib.sha256).digest()[:_SALT_LEN]
        encoded = hash_secret(
            secret=secret,
            salt=salt,
            time_cost=_ARGON2_TIME_COST,
            memory_cost=_ARGON2_MEMORY_COST,
            parallelism=_ARGON2_PARALLELISM,
            hash_len=_ARGON2_HASH_LEN,
            type=Type.ID,
        )
        return encoded.decode("ascii")


@dataclass(frozen=True, slots=True)
class TokenClaims:
    """Fields extracted from a valid access token."""

    user_id: UUID
    public_id: str


class JwtTokenIssuer:
    """Issue and parse HS256 access tokens."""

    def __init__(self, secret: str, ttl_seconds: int) -> None:
        self._secret = secret
        self._ttl_seconds = ttl_seconds

    def issue(self, user_id: UUID, public_id: str) -> str:
        """Return a signed JWT for the given user.

        Args:
            user_id: Internal user UUID (claim ``sub``).
            public_id: Public pseudonymous identifier (claim ``pid``).
        """
        now = datetime.now(UTC)
        payload = {
            "sub": str(user_id),
            "pid": public_id,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=self._ttl_seconds)).timestamp()),
        }
        return jwt.encode(payload, self._secret, algorithm=_JWT_ALGORITHM)

    def parse(self, token: str) -> TokenClaims:
        """Decode a JWT and return claims.

        Args:
            token: Bearer token value.

        Raises:
            TokenError: If the token is invalid or expired.
        """
        try:
            payload = jwt.decode(token, self._secret, algorithms=[_JWT_ALGORITHM])
        except jwt.InvalidTokenError as exc:
            raise TokenError("Invalid access token") from exc
        sub = payload.get("sub")
        pid = payload.get("pid")
        if not isinstance(sub, str) or not isinstance(pid, str):
            raise TokenError("Invalid access token")
        try:
            user_id = UUID(sub)
        except ValueError as exc:
            raise TokenError("Invalid access token") from exc
        return TokenClaims(user_id=user_id, public_id=pid)
