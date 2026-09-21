"""FastAPI dependencies. Wiring only — no business logic."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.core.security import Argon2SeedHasher, JwtTokenIssuer
from app.repositories.health import HealthRepository
from app.repositories.users import UserRepository
from app.services.accounts import AccountService
from app.services.health import HealthService

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Return a process-wide async engine, created on first use."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            get_settings().database_url,
            pool_pre_ping=True,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the session factory bound to the process engine."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


async def get_session() -> AsyncIterator[AsyncSession]:
    """Yield a request-scoped async session and commit on success."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_health_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> HealthService:
    """Build the health service for a request."""
    return HealthService(HealthRepository(session))


async def get_account_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AccountService:
    """Build the account service for a request."""
    settings = get_settings()
    return AccountService(
        users=UserRepository(session),
        hasher=Argon2SeedHasher(settings.secret_key),
        tokens=JwtTokenIssuer(settings.secret_key, settings.access_token_ttl_seconds),
    )


async def dispose_engine() -> None:
    """Dispose the engine on shutdown so connections are not leaked."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
