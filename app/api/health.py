"""Liveness and database readiness probe."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.deps import get_health_service
from app.domain.schemas import HealthStatus
from app.services.health import HealthService

router = APIRouter(tags=["health"])


@router.get(
    "/healthz",
    response_model=HealthStatus,
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {"model": HealthStatus},
    },
)
async def healthz(
    health_service: Annotated[HealthService, Depends(get_health_service)],
) -> JSONResponse:
    """Return 200 when PostgreSQL answers, otherwise 503."""
    result = await health_service.check()
    if not result.database_ok:
        payload = HealthStatus(status="error", database="unavailable")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=payload.model_dump(),
        )
    payload = HealthStatus(status="ok", database="ok")
    return JSONResponse(status_code=status.HTTP_200_OK, content=payload.model_dump())
