"""Pydantic schemas shared across API and services."""

from pydantic import BaseModel, ConfigDict, Field


class HealthStatus(BaseModel):
    """Public /healthz payload."""

    model_config = ConfigDict(extra="forbid")

    status: str = Field(description="ok when the process and database are reachable.")
    database: str = Field(description="ok or unavailable.")
