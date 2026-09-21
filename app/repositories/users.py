"""User and share_settings persistence. No HTTP, no hashing."""

from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.accounts import UserRecord
from app.repositories.models import ShareSettings, User


def _to_record(user: User) -> UserRecord:
    """Map an ORM row to a domain record.

    Args:
        user: SQLAlchemy user, optionally with share_settings loaded.
    """
    is_public = user.share_settings.is_public if user.share_settings is not None else False
    return UserRecord(
        id=user.id,
        public_id=user.public_id,
        is_public=is_public,
        created_at=user.created_at,
    )


class UserRepository:
    """Async access to ``users`` and ``share_settings``."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, *, public_id: str, seed_phrase_hash: str) -> UserRecord:
        """Insert a private user. The phrase itself must never be passed here.

        Args:
            public_id: Unique public identifier.
            seed_phrase_hash: PHC-encoded argon2id hash.
        """
        user = User(id=uuid4(), public_id=public_id, seed_phrase_hash=seed_phrase_hash)
        settings = ShareSettings(id=uuid4(), user_id=user.id, is_public=False)
        self._session.add(user)
        self._session.add(settings)
        await self._session.flush()
        await self._session.refresh(user)
        user.share_settings = settings
        return _to_record(user)

    async def get_by_id(self, user_id: UUID) -> UserRecord | None:
        """Return the user with share settings, or None."""
        result = await self._session.execute(
            select(User).options(selectinload(User.share_settings)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        return _to_record(user) if user is not None else None

    async def get_by_public_id(self, public_id: str) -> UserRecord | None:
        """Return the user with this public_id, or None."""
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.share_settings))
            .where(User.public_id == public_id)
        )
        user = result.scalar_one_or_none()
        return _to_record(user) if user is not None else None

    async def get_by_seed_phrase_hash(self, seed_phrase_hash: str) -> UserRecord | None:
        """Look up a user by the stored argon2id encoding, or None."""
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.share_settings))
            .where(User.seed_phrase_hash == seed_phrase_hash)
        )
        user = result.scalar_one_or_none()
        return _to_record(user) if user is not None else None

    async def set_is_public(self, user_id: UUID, is_public: bool) -> UserRecord | None:
        """Upsert share_settings.is_public for the user. Returns None if missing."""
        result = await self._session.execute(
            select(User).options(selectinload(User.share_settings)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None
        if user.share_settings is None:
            user.share_settings = ShareSettings(id=uuid4(), user_id=user.id, is_public=is_public)
            self._session.add(user.share_settings)
        else:
            user.share_settings.is_public = is_public
        await self._session.flush()
        return _to_record(user)
