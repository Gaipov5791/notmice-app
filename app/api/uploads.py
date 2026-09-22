"""Upload extract/confirm HTTP surface."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.accounts import get_current_user
from app.core.deps import get_upload_service
from app.domain.accounts import UserRecord
from app.domain.pii import PIIValidationError, reject_pii
from app.domain.schemas import (
    ConfirmRequest,
    ConfirmResponse,
    ExtractedMarkerView,
    ExtractResponse,
)
from app.domain.uploads import (
    EmptyPayloadError,
    ExtractSessionNotFoundError,
    NoMarkersError,
    PayloadTooLargeError,
    RawMarker,
    UnsupportedMediaTypeError,
    UploadError,
    VisionExtractionError,
    VisionNotConfiguredError,
)
from app.services.uploads import UploadService

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


def _http_for(exc: UploadError) -> HTTPException:
    """Map domain errors to HTTP responses without leaking file contents."""
    if isinstance(exc, UnsupportedMediaTypeError):
        return HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )
    if isinstance(exc, PayloadTooLargeError):
        return HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large",
        )
    if isinstance(exc, EmptyPayloadError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if isinstance(exc, NoMarkersError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No numeric markers found",
        )
    if isinstance(exc, ExtractSessionNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extract session expired",
        )
    if isinstance(exc, VisionNotConfiguredError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vision provider is not configured",
        )
    if isinstance(exc, VisionExtractionError):
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Extraction failed")
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload request failed")


@router.post("/extract", response_model=ExtractResponse)
async def extract_upload(
    current: Annotated[UserRecord, Depends(get_current_user)],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
    file: Annotated[UploadFile, File()],
) -> ExtractResponse:
    """Parse a PDF or image in RAM and return markers for human review."""
    payload = await file.read()
    try:
        session = await upload_service.extract(current.id, payload)
    except UploadError as exc:
        raise _http_for(exc) from exc
    finally:
        del payload
    panel = session.panel
    chronological_age = (
        float(panel.chronological_age) if panel.chronological_age is not None else None
    )
    return ExtractResponse(
        extract_token=session.token,
        document_sha256=panel.document_sha256,
        parser_version=panel.parser_version,
        lab_name=panel.lab_name,
        collected_at=panel.collected_at,
        chronological_age=chronological_age,
        markers=[
            ExtractedMarkerView(
                raw_name=marker.raw_name,
                canonical_id=marker.canonical_id,
                loinc_code=marker.loinc_code,
                value=float(marker.value),
                unit=marker.unit,
                confidence=marker.confidence,
                mapping_status=marker.mapping_status.value,
                within_range=marker.within_range,
            )
            for marker in panel.markers
        ],
    )


@router.post("/confirm", response_model=ConfirmResponse)
async def confirm_upload(
    payload: ConfirmRequest,
    current: Annotated[UserRecord, Depends(get_current_user)],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
) -> ConfirmResponse:
    """Persist reviewed values. SHA-256 comes from the extract session."""
    try:
        reject_pii(payload.model_dump(mode="json"))
        result = await upload_service.confirm(
            current.id,
            payload.extract_token,
            lab_name=payload.lab_name,
            collected_at=payload.collected_at,
            chronological_age=(
                Decimal(str(payload.chronological_age))
                if payload.chronological_age is not None
                else None
            ),
            markers=tuple(
                RawMarker(raw_name=item.raw_name, value=item.value, unit=item.unit)
                for item in payload.markers
            ),
        )
    except PIIValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forbidden field",
        ) from exc
    except UploadError as exc:
        raise _http_for(exc) from exc
    return ConfirmResponse(
        lab_result_id=result.lab_result_id,
        document_sha256=result.document_sha256,
        parser_version=result.parser_version,
        confirmed_at=result.confirmed_at,
        marker_count=result.marker_count,
    )
