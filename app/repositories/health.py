"""Database ping used by /healthz."""

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession


class HealthRepository:
    """Read-only database probe. No business rules live here."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def ping(self) -> bool:
        """Return True when the database answers SELECT 1."""
        try:
            result = await self._session.execute(text("SELECT 1"))
        except SQLAlchemyError:
            return False
        value: object = result.scalar_one()
        return value == 1
