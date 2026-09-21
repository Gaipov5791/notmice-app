"""Shared pytest fixtures."""

from collections.abc import AsyncIterator

import pytest

from app.core.deps import dispose_engine


@pytest.fixture(autouse=True)
async def reset_database_engine() -> AsyncIterator[None]:
    """Dispose the process engine so tests do not share an event loop."""
    yield
    await dispose_engine()
