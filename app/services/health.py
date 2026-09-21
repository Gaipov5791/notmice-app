"""Health-check application service."""

from dataclasses import dataclass
from typing import Protocol


class HealthPinger(Protocol):
    """Repository contract for a database ping."""

    async def ping(self) -> bool:
        """Return True when the backing store is reachable."""


@dataclass(frozen=True, slots=True)
class HealthCheck:
    """Result of probing process dependencies."""

    database_ok: bool


class HealthService:
    """Translate infrastructure pings into an API-facing health result."""

    def __init__(self, pinger: HealthPinger) -> None:
        self._pinger = pinger

    async def check(self) -> HealthCheck:
        """Run dependency checks."""
        return HealthCheck(database_ok=await self._pinger.ping())
