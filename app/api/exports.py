"""Read-only CC0 exports of the public biomarker dataset."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dataset import enforce_public_rate_limit
from app.core.deps import get_export_service
from app.domain.export import DATASET_LICENSE_ID
from app.domain.pii import PIIValidationError
from app.services.export import ExportService, render_csv, render_datasheet, render_parquet

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["dataset"])


def _attachment(body: bytes, *, media_type: str, filename: str) -> Response:
    """Return a downloadable snapshot stamped with the dataset license."""
    return Response(
        content=body,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Dataset-License": DATASET_LICENSE_ID,
        },
    )


def _blocked() -> HTTPException:
    """Hide the payload when the public column contract is violated."""
    logger.error("public_export_rejected")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Public response blocked",
    )


@router.get(
    "/dataset.csv",
    summary="Download the public biomarker dataset as CSV",
    response_class=Response,
    responses={
        status.HTTP_200_OK: {
            "content": {"text/csv": {}},
            "description": "CC0-1.0 CSV of opted-in confirmed biomarker rows.",
        },
        status.HTTP_429_TOO_MANY_REQUESTS: {"description": "Per-IP rate limit exceeded"},
    },
)
async def download_dataset_csv(
    export_service: Annotated[ExportService, Depends(get_export_service)],
    _: Annotated[None, Depends(enforce_public_rate_limit)],
) -> Response:
    """Return every opted-in confirmed row as UTF-8 CSV.

    The file is built from the public dataset store. Opt-out profiles are absent.
    """
    try:
        body = render_csv(await export_service.load_rows())
    except PIIValidationError as exc:
        raise _blocked() from exc
    logger.info("public_dataset_exported", export_format="csv")
    return _attachment(
        body,
        media_type="text/csv; charset=utf-8",
        filename="notmice-public-biomarkers.csv",
    )


@router.get(
    "/dataset.parquet",
    summary="Download the public biomarker dataset as Parquet",
    response_class=Response,
    responses={
        status.HTTP_200_OK: {
            "content": {"application/vnd.apache.parquet": {}},
            "description": "CC0-1.0 Parquet of opted-in confirmed biomarker rows.",
        },
        status.HTTP_429_TOO_MANY_REQUESTS: {"description": "Per-IP rate limit exceeded"},
    },
)
async def download_dataset_parquet(
    export_service: Annotated[ExportService, Depends(get_export_service)],
    _: Annotated[None, Depends(enforce_public_rate_limit)],
) -> Response:
    """Return every opted-in confirmed row as Apache Parquet.

    File metadata carries the CC0-1.0 license. Opt-out profiles are absent.
    """
    try:
        body = render_parquet(await export_service.load_rows())
    except PIIValidationError as exc:
        raise _blocked() from exc
    logger.info("public_dataset_exported", export_format="parquet")
    return _attachment(
        body,
        media_type="application/vnd.apache.parquet",
        filename="notmice-public-biomarkers.parquet",
    )


@router.get(
    "/dataset/datasheet",
    summary="Download the public biomarker datasheet",
    response_class=Response,
    responses={
        status.HTTP_200_OK: {
            "content": {"text/markdown": {}},
            "description": "Datasheet for the CC0-1.0 public biomarker snapshot.",
        },
        status.HTTP_429_TOO_MANY_REQUESTS: {"description": "Per-IP rate limit exceeded"},
    },
)
async def download_dataset_datasheet(
    export_service: Annotated[ExportService, Depends(get_export_service)],
    _: Annotated[None, Depends(enforce_public_rate_limit)],
) -> Response:
    """Return a Datasheets-for-Datasets description of the current public snapshot.

    Composition counts come from the same opted-in rows as the CSV and Parquet files.
    """
    try:
        text = render_datasheet(
            await export_service.load_rows(),
            generated_at=datetime.now(UTC),
        )
    except PIIValidationError as exc:
        raise _blocked() from exc
    logger.info("public_dataset_exported", export_format="datasheet")
    return _attachment(
        text.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        filename="notmice-dataset-datasheet.md",
    )
