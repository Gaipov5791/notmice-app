"""Public dataset use-cases. No FastAPI and no ORM models."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import date
from decimal import Decimal
from typing import Protocol

import structlog

from app.domain.dataset import (
    ProfileNotPublicError,
    PublicBiomarkerRow,
    PublicDatasetPage,
    PublicTimeseries,
    PublicTimeseriesPoint,
)
from app.domain.pii import reject_sensitive_output

logger = structlog.get_logger(__name__)


class DatasetStore(Protocol):
    """Persistence contract for anonymized public reads."""

    async def count_public_biomarkers(self) -> int:
        """Count confirmed analyte rows on opted-in profiles."""

    async def list_public_biomarkers(
        self,
        *,
        limit: int,
        offset: int,
    ) -> tuple[PublicBiomarkerRow, ...]:
        """Return one page of those rows."""

    async def public_profile_exists(self, public_id: str) -> bool:
        """Whether the public id is opted in."""

    async def list_public_profile_biomarkers(
        self,
        public_id: str,
    ) -> tuple[PublicBiomarkerRow, ...]:
        """Confirmed analytes for one opted-in profile."""


def _row_payload(row: PublicBiomarkerRow) -> dict[str, object]:
    """JSON-ready public fields for one analyte. Secrets are not attributes here."""
    return {
        "public_id": row.public_id,
        "collected_at": None if row.collected_at is None else row.collected_at.isoformat(),
        "chronological_age": _number(row.chronological_age),
        "loinc_code": row.loinc_code,
        "canonical_name": row.canonical_name,
        "raw_name": row.raw_name,
        "value": float(row.value),
        "unit": row.unit,
        "mapping_status": row.mapping_status,
    }


def _number(value: Decimal | None) -> float | None:
    """Serialize an optional numeric column as a JSON number."""
    if value is None:
        return None
    return float(value)


def _guard_rows(rows: Sequence[PublicBiomarkerRow]) -> None:
    """Refuse to continue if a public row dict grew a sensitive key."""
    reject_sensitive_output([_row_payload(row) for row in rows])


def group_timeseries(rows: Sequence[PublicBiomarkerRow]) -> tuple[PublicTimeseriesPoint, ...]:
    """Group analyte rows that share a collection date and chronological age.

    Args:
        rows: Rows already restricted to one public profile, in display order.
    """
    order: list[tuple[date | None, Decimal | None]] = []
    grouped: dict[tuple[date | None, Decimal | None], list[PublicBiomarkerRow]] = {}
    for row in rows:
        key = (row.collected_at, row.chronological_age)
        bucket = grouped.get(key)
        if bucket is None:
            grouped[key] = [row]
            order.append(key)
        else:
            bucket.append(row)
    return tuple(
        PublicTimeseriesPoint(
            collected_at=collected_at,
            chronological_age=chronological_age,
            markers=tuple(grouped[(collected_at, chronological_age)]),
        )
        for collected_at, chronological_age in order
    )


class DatasetService:
    """Read the opt-in dataset and one public profile's time series."""

    def __init__(self, store: DatasetStore) -> None:
        self._store = store

    async def read_dataset(self, *, limit: int, offset: int) -> PublicDatasetPage:
        """Return a page of confirmed rows from profiles that opted in.

        Args:
            limit: Page size.
            offset: Rows to skip.
        """
        total = await self._store.count_public_biomarkers()
        rows = await self._store.list_public_biomarkers(limit=limit, offset=offset)
        _guard_rows(rows)
        logger.info("public_dataset_listed", total=total, returned=len(rows))
        return PublicDatasetPage(rows=rows, total=total, limit=limit, offset=offset)

    async def read_timeseries(self, public_id: str) -> PublicTimeseries:
        """Return confirmed history for one opted-in profile.

        Args:
            public_id: Pseudonymous profile id.

        Raises:
            ProfileNotPublicError: The id is unknown or the profile is private.
        """
        if not await self._store.public_profile_exists(public_id):
            raise ProfileNotPublicError
        rows = await self._store.list_public_profile_biomarkers(public_id)
        _guard_rows(rows)
        series = PublicTimeseries(public_id=public_id, points=group_timeseries(rows))
        logger.info("public_timeseries_listed", public_id=public_id, points=len(series.points))
        return series
