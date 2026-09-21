"""Health-check unit and API tests."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import OperationalError

from app.core.deps import get_health_service
from app.main import create_app
from app.services.health import HealthService


class _OkPinger:
    async def ping(self) -> bool:
        return True


class _DownPinger:
    async def ping(self) -> bool:
        return False


async def test_health_service_reports_ok() -> None:
    """Service maps a successful ping to database_ok=True."""
    result = await HealthService(_OkPinger()).check()
    assert result.database_ok is True


async def test_health_service_reports_unavailable() -> None:
    """Service maps a failed ping to database_ok=False."""
    result = await HealthService(_DownPinger()).check()
    assert result.database_ok is False


async def test_healthz_returns_200_when_database_ok() -> None:
    """GET /healthz is 200 with a healthy database probe."""
    application = create_app()

    async def override() -> HealthService:
        return HealthService(_OkPinger())

    application.dependency_overrides[get_health_service] = override
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


async def test_healthz_returns_503_when_database_down() -> None:
    """GET /healthz is 503 when the database probe fails."""
    application = create_app()

    async def override() -> HealthService:
        return HealthService(_DownPinger())

    application.dependency_overrides[get_health_service] = override
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/healthz")
    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}


async def test_healthz_against_postgres() -> None:
    """Hit /healthz with the real engine when PostgreSQL is reachable."""
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    from app.core.config import get_settings

    engine = create_async_engine(get_settings().database_url)
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except (OSError, OperationalError):
        pytest.skip("PostgreSQL is not available")
    finally:
        await engine.dispose()

    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_schema_contains_required_tables() -> None:
    """Minimum tables from the Phase 2 TZ exist on the ORM metadata."""
    from app.repositories.models import Base

    assert {
        "users",
        "lab_results",
        "biomarkers",
        "provenance",
        "share_settings",
    }.issubset(Base.metadata.tables)
