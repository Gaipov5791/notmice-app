"""Lab result and provenance persistence. No HTTP, no hashing."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.uploads import ConfirmedLabResult, MappedMarker
from app.repositories.models import Biomarker, LabResult, Provenance


class LabResultRepository:
    """Async inserts into ``lab_results``, ``biomarkers``, and ``provenance``."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save_confirmed(
        self,
        *,
        user_id: UUID,
        collected_at: date | None,
        lab_name: str | None,
        chronological_age: Decimal | None,
        parser_version: str,
        confirmed_at: datetime,
        document_sha256: str,
        markers: tuple[MappedMarker, ...],
    ) -> ConfirmedLabResult:
        """Insert a confirmed panel and its provenance in one flush.

        Args:
            user_id: Owning participant.
            collected_at: Specimen date if known.
            lab_name: Laboratory name if known.
            chronological_age: Age at collection if provided.
            parser_version: Extract pipeline version.
            confirmed_at: Human sign-off timestamp.
            document_sha256: SHA-256 of the original bytes (never the file).
            markers: Confirmed analyte rows.
        """
        lab_result = LabResult(
            id=uuid4(),
            user_id=user_id,
            collected_at=collected_at,
            lab_name=lab_name,
            chronological_age=chronological_age,
            parser_version=parser_version,
            confirmed_at=confirmed_at,
        )
        self._session.add(lab_result)
        for marker in markers:
            self._session.add(
                Biomarker(
                    id=uuid4(),
                    lab_result_id=lab_result.id,
                    loinc_code=marker.loinc_code,
                    raw_name=marker.raw_name,
                    canonical_name=marker.canonical_id,
                    value=marker.value,
                    unit=marker.unit,
                    mapping_status=marker.mapping_status.value,
                )
            )
        self._session.add(
            Provenance(
                id=uuid4(),
                lab_result_id=lab_result.id,
                entered_by_user_id=user_id,
                document_sha256=document_sha256,
                parser_version=parser_version,
                lab_name=lab_name,
                collected_at=collected_at,
                confirmed=True,
            )
        )
        await self._session.flush()
        return ConfirmedLabResult(
            lab_result_id=lab_result.id,
            document_sha256=document_sha256,
            parser_version=parser_version,
            confirmed_at=confirmed_at,
            marker_count=len(markers),
        )
