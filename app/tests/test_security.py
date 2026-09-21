"""BIP-39, argon2id, and JWT unit tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest

from app.core.security import (
    Argon2SeedHasher,
    JwtTokenIssuer,
    TokenError,
    generate_mnemonic,
    is_valid_mnemonic,
    normalize_mnemonic,
)


def test_generate_mnemonic_is_twelve_valid_bip39_words() -> None:
    """Generated phrases are 12 English BIP-39 words with a valid checksum."""
    phrase = generate_mnemonic()
    words = phrase.split(" ")
    assert len(words) == 12
    assert is_valid_mnemonic(phrase) is True


def test_normalize_mnemonic_collapses_whitespace() -> None:
    """User input with extra spaces and mixed case is canonicalized."""
    assert normalize_mnemonic("  Abandon  ABILITY\nable  ") == "abandon ability able"


def test_placeholder_words_are_not_bip39() -> None:
    """The old UI stub phrase must not pass as a real mnemonic."""
    stub = (
        "quantum cellular longevity telomere biomarker hepatic "
        "hazard matrix isolate gompertz cipher sovereign"
    )
    assert is_valid_mnemonic(stub) is False


def test_argon2id_hash_is_deterministic_and_does_not_embed_phrase() -> None:
    """Same phrase + pepper yields the same PHC string; the words are not stored."""
    hasher = Argon2SeedHasher("test-pepper-secret-key-32-bytes!!")
    phrase = generate_mnemonic()
    first = hasher.hash_phrase(phrase)
    second = hasher.hash_phrase(phrase)
    assert first == second
    assert first.startswith("$argon2id$")
    for word in phrase.split(" "):
        assert word not in first


def test_different_phrases_hash_differently() -> None:
    """Two generated phrases must not collide under argon2id."""
    hasher = Argon2SeedHasher("test-pepper-secret-key-32-bytes!!")
    left = hasher.hash_phrase(generate_mnemonic())
    right = hasher.hash_phrase(generate_mnemonic())
    assert left != right


def test_jwt_roundtrip() -> None:
    """Issued tokens parse back to the same user id and public_id."""
    issuer = JwtTokenIssuer("jwt-secret-key-32-bytes-minimum!", ttl_seconds=60)
    user_id = uuid4()
    token = issuer.issue(user_id, "nmdemo01")
    claims = issuer.parse(token)
    assert claims.user_id == user_id
    assert claims.public_id == "nmdemo01"


def test_jwt_rejects_tampered_token() -> None:
    """A token signed with another secret is rejected."""
    issuer = JwtTokenIssuer("jwt-secret-key-32-bytes-minimum!", ttl_seconds=60)
    token = issuer.issue(uuid4(), "nmdemo01")
    other = JwtTokenIssuer("other-secret-key-32-bytes-min!!!", ttl_seconds=60)
    with pytest.raises(TokenError):
        other.parse(token)


def test_jwt_rejects_expired_token() -> None:
    """Expired tokens raise TokenError."""
    issuer = JwtTokenIssuer("jwt-secret-key-32-bytes-minimum!", ttl_seconds=60)
    user_id = uuid4()
    past = datetime.now(UTC) - timedelta(hours=2)
    token = jwt.encode(
        {
            "sub": str(user_id),
            "pid": "nmdemo01",
            "iat": int(past.timestamp()),
            "exp": int((past + timedelta(seconds=1)).timestamp()),
        },
        "jwt-secret-key-32-bytes-minimum!",
        algorithm="HS256",
    )
    with pytest.raises(TokenError):
        issuer.parse(token)
