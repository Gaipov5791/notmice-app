"""Extract/confirm mapping, RAM session, and HTTP tests. Vision is faked."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.deps import get_account_service, get_upload_service
from app.core.security import Argon2SeedHasher, JwtTokenIssuer
from app.domain.accounts import UserRecord
from app.domain.enums import MappingStatus
from app.domain.uploads import (
    ConfirmedLabResult,
    ExtractSessionNotFoundError,
    GeminiBudgetExhaustedError,
    MappedMarker,
    OwnedLabPanel,
    OwnedMarker,
    RawLabExtraction,
    RawMarker,
    VisionNotConfiguredError,
    map_marker,
)
from app.main import create_app
from app.services.accounts import AccountService
from app.services.extract_sessions import InMemoryExtractSessionStore
from app.services.gemini_budget import GeminiTokenBudget
from app.services.loinc_dictionary import load_loinc_dictionary
from app.services.media import sha256_hex
from app.services.uploads import UploadService
from app.services.vision import (
    ClaudeExtractionProvider,
    ProviderExtraction,
    build_extraction_provider,
)
from app.tests.test_accounts import InMemoryUserStore


def _text_pdf(line: str) -> bytes:
    """Return a one-page PDF with selectable text, never written to disk."""
    escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    content = f"BT /F1 12 Tf 50 720 Td ({escaped}) Tj ET"
    content_bytes = content.encode("latin-1")
    objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        (
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        ),
        f"4 0 obj\n<< /Length {len(content_bytes)} >>\nstream\n{content}\nendstream\nendobj\n",
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]
    header = "%PDF-1.4\n"
    encoded = [obj.encode("latin-1") for obj in objects]
    offsets: list[int] = []
    cursor = len(header.encode("latin-1"))
    for raw in encoded:
        offsets.append(cursor)
        cursor += len(raw)
    xref = ["xref\n0 6\n0000000000 65535 f \n"]
    xref.extend(f"{offset:010d} 00000 n \n" for offset in offsets)
    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{cursor}\n%%EOF\n"
    return (
        header.encode("latin-1")
        + b"".join(encoded)
        + "".join(xref).encode("latin-1")
        + trailer.encode("latin-1")
    )


def _albumin_extraction() -> RawLabExtraction:
    return RawLabExtraction(
        lab_name="Quest Diagnostics",
        collected_at="2025-08-12",
        chronological_age=42.0,
        markers=[
            RawMarker(raw_name="Serum Albumin", value=46.2, unit="g/L", confidence=0.94),
            RawMarker(raw_name="hs-CRP", value=0.8, unit="mg/L", confidence=0.91),
        ],
    )


class FakeVision:
    """Deterministic provider. Records call kinds, never keeps file bytes."""

    name = "gemini"
    model_id = "fake-flash"

    def __init__(self, tokens_used: int | None = 100) -> None:
        self.text_calls = 0
        self.media_calls = 0
        self.tokens_used = tokens_used
        self.last_text: str | None = None
        self.last_media_mime: str | None = None
        self.last_media_size: int | None = None

    async def extract_from_text(self, text: str) -> ProviderExtraction:
        self.text_calls += 1
        self.last_text = text
        return ProviderExtraction(extraction=_albumin_extraction(), tokens_used=self.tokens_used)

    async def extract_from_media(self, payload: bytes, mime_type: str) -> ProviderExtraction:
        self.media_calls += 1
        self.last_media_mime = mime_type
        self.last_media_size = len(payload)
        return ProviderExtraction(extraction=_albumin_extraction(), tokens_used=self.tokens_used)


class InMemoryLabStore:
    """Process-local stand-in for LabResultRepository."""

    def __init__(self) -> None:
        self.saved: list[ConfirmedLabResult] = []
        self.markers: list[tuple[MappedMarker, ...]] = []
        self.lab_names: list[str | None] = []
        self.ages: list[Decimal | None] = []
        self._owners: list[tuple[UUID, OwnedLabPanel]] = []

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
        result = ConfirmedLabResult(
            lab_result_id=uuid4(),
            document_sha256=document_sha256,
            parser_version=parser_version,
            confirmed_at=confirmed_at,
            marker_count=len(markers),
        )
        self.saved.append(result)
        self.markers.append(markers)
        self.lab_names.append(lab_name)
        self.ages.append(chronological_age)
        self._owners.append(
            (
                user_id,
                OwnedLabPanel(
                    collected_at=collected_at,
                    lab_name=lab_name,
                    chronological_age=chronological_age,
                    confirmed_at=confirmed_at,
                    document_sha256=document_sha256,
                    markers=tuple(
                        OwnedMarker(
                            raw_name=marker.raw_name,
                            canonical_id=marker.canonical_id,
                            loinc_code=marker.loinc_code,
                            value=marker.value,
                            unit=marker.unit,
                        )
                        for marker in markers
                    ),
                ),
            )
        )
        del parser_version
        return result

    async def list_confirmed(self, user_id: UUID) -> tuple[OwnedLabPanel, ...]:
        return tuple(panel for owner, panel in self._owners if owner == user_id)


def _account_service() -> AccountService:
    return AccountService(
        users=InMemoryUserStore(),
        hasher=Argon2SeedHasher("test-pepper-secret-key-32-bytes!!"),
        tokens=JwtTokenIssuer("test-jwt-secret-key-32-bytes-min!", ttl_seconds=3600),
    )


def _budget() -> GeminiTokenBudget:
    return GeminiTokenBudget(
        daily_token_budget=2_000_000,
        user_daily_token_budget=100_000,
        ip_daily_token_budget=150_000,
        call_token_reserve=16_000,
        user_daily_calls=8,
        ip_daily_calls=12,
        warn_ratio=0.8,
    )


def _upload_bundle() -> tuple[UploadService, FakeVision, InMemoryLabStore]:
    vision = FakeVision()
    labs = InMemoryLabStore()
    service = UploadService(
        vision=vision,
        sessions=InMemoryExtractSessionStore(ttl_seconds=60),
        lab_results=labs,
        max_upload_bytes=1_000_000,
        budget=_budget(),
    )
    return service, vision, labs


def _app(account_service: AccountService, upload_service: UploadService) -> FastAPI:
    application = create_app()

    async def override_accounts() -> AccountService:
        return account_service

    async def override_uploads() -> UploadService:
        return upload_service

    application.dependency_overrides[get_account_service] = override_accounts
    application.dependency_overrides[get_upload_service] = override_uploads
    return application


def test_map_marker_known_and_unmapped() -> None:
    """Albumin maps to LOINC 1751-7; unknown names stay in the unmapped queue."""
    dictionary = load_loinc_dictionary()
    mapped = map_marker(RawMarker(raw_name="Альбумин", value=46.0, unit="g/L"), dictionary)
    assert mapped.canonical_id == "albumin"
    assert mapped.loinc_code == "1751-7"
    assert mapped.mapping_status is MappingStatus.MAPPED
    assert mapped.within_range is True
    unknown = map_marker(RawMarker(raw_name="Vitamin D", value=42.0, unit="ng/mL"), dictionary)
    assert unknown.canonical_id is None
    assert unknown.loinc_code is None
    assert unknown.mapping_status is MappingStatus.UNMAPPED
    assert unknown.value == Decimal("42")
    assert unknown.within_range is None


def test_claude_provider_is_explicit_stub() -> None:
    """Switching VISION_PROVIDER=claude fails closed until the adapter is written."""
    provider = build_extraction_provider(
        provider="claude",
        gemini_api_key="",
        gemini_model="gemini-3.8-flash",
        claude_api_key="sk-test",
        claude_model="claude-sonnet-5",
    )
    assert isinstance(provider, ClaudeExtractionProvider)


@pytest.mark.asyncio
async def test_claude_extract_raises_not_configured() -> None:
    """The Claude stub does not silently fall back to Gemini."""
    provider = ClaudeExtractionProvider(api_key="sk-test", model="claude-sonnet-5")
    with pytest.raises(VisionNotConfiguredError):
        await provider.extract_from_text("Albumin 46 g/L")


@pytest.mark.asyncio
async def test_text_pdf_uses_pdfplumber_path_and_drops_bytes() -> None:
    """Selectable PDF text is sent to extract_from_text; the panel has SHA-256, not the file."""
    service, vision, _labs = _upload_bundle()
    user = UserRecord(id=uuid4(), public_id="nmtest", is_public=False, created_at=datetime.now(UTC))
    payload = _text_pdf(
        "Serum Albumin 46.2 g/L  Creatinine 0.88 mg/dL  Glucose 84 mg/dL extra padding text"
    )
    digest = sha256_hex(payload)
    session = (await service.extract(user.id, payload, client_key="203.0.113.10")).session
    assert vision.text_calls == 1
    assert vision.media_calls == 0
    assert session.panel.document_sha256 == digest
    assert session.panel.markers[0].canonical_id == "albumin"
    assert session.panel.markers[0].loinc_code == "1751-7"


@pytest.mark.asyncio
async def test_image_uses_vision_media_path() -> None:
    """Scans skip pdfplumber and go to the Vision provider."""
    service, vision, _labs = _upload_bundle()
    user = UserRecord(id=uuid4(), public_id="nmtest", is_public=False, created_at=datetime.now(UTC))
    jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 64
    session = (await service.extract(user.id, jpeg, client_key="203.0.113.10")).session
    assert vision.media_calls == 1
    assert vision.text_calls == 0
    assert vision.last_media_mime == "image/jpeg"
    assert session.panel.document_sha256 == sha256_hex(jpeg)


@pytest.mark.asyncio
async def test_confirm_keeps_unmapped_marker() -> None:
    """An unknown analyte is stored with the panel instead of being dropped."""
    service, _vision, labs = _upload_bundle()
    user = UserRecord(id=uuid4(), public_id="nmtest", is_public=False, created_at=datetime.now(UTC))
    jpeg = b"\xff\xd8\xff\xe0" + b"\x33" * 32
    session = (await service.extract(user.id, jpeg, client_key="203.0.113.10")).session
    await service.confirm(
        user.id,
        session.token,
        lab_name=None,
        collected_at=None,
        chronological_age=None,
        markers=(
            RawMarker(raw_name="Serum Albumin", value=46.0, unit="g/L"),
            RawMarker(raw_name="Vitamin D", value=42.0, unit="ng/mL"),
        ),
    )
    saved = labs.markers[0]
    assert len(saved) == 2
    vitamin_d = saved[1]
    assert vitamin_d.mapping_status is MappingStatus.UNMAPPED
    assert vitamin_d.loinc_code is None
    assert vitamin_d.value == Decimal("42")


@pytest.mark.asyncio
async def test_confirm_persists_session_hash_and_forgets_token() -> None:
    """Confirm writes provenance SHA-256 from the extract session, then the token dies."""
    service, _vision, labs = _upload_bundle()
    user = UserRecord(id=uuid4(), public_id="nmtest", is_public=False, created_at=datetime.now(UTC))
    payload = b"\xff\xd8\xff\xe0" + b"\x11" * 32
    session = (await service.extract(user.id, payload, client_key="203.0.113.10")).session
    result = await service.confirm(
        user.id,
        session.token,
        lab_name="Quest Diagnostics",
        collected_at=session.panel.collected_at,
        chronological_age=Decimal("42.0"),
        markers=(RawMarker(raw_name="Serum Albumin", value=46.0, unit="g/L"),),
    )
    assert result.document_sha256 == sha256_hex(payload)
    assert labs.saved[0].document_sha256 == sha256_hex(payload)
    with pytest.raises(ExtractSessionNotFoundError):
        await service.confirm(
            user.id,
            session.token,
            lab_name=None,
            collected_at=None,
            chronological_age=None,
            markers=(RawMarker(raw_name="Serum Albumin", value=46.0, unit="g/L"),),
        )


@pytest.mark.asyncio
async def test_extract_http_requires_auth() -> None:
    """Extract is not anonymous."""
    application = _app(_account_service(), _upload_bundle()[0])
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/uploads/extract",
            files={"file": ("scan.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 8, "image/jpeg")},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_extract_confirm_http_flow() -> None:
    """DoD HTTP path: login, extract a real JPEG, confirm values, session expires."""
    accounts = _account_service()
    uploads, vision, labs = _upload_bundle()
    application = _app(accounts, uploads)
    jpeg = b"\xff\xd8\xff\xe0" + b"\x22" * 48
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/v1/accounts", json={})
        token = created.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        extracted = await client.post(
            "/api/v1/uploads/extract",
            headers=headers,
            files={"file": ("panel.jpg", jpeg, "image/jpeg")},
        )
        assert extracted.status_code == 200
        body = extracted.json()
        assert body["document_sha256"] == sha256_hex(jpeg)
        assert body["parser_version"].startswith("notmice-extract/1.0/gemini/")
        assert body["tokens_used"] == 100
        assert body["tokens_limit"] == 100_000
        assert body["warning"] is False
        assert "file" not in body
        albumin = next(item for item in body["markers"] if item["canonical_id"] == "albumin")
        assert albumin["loinc_code"] == "1751-7"
        assert vision.media_calls == 1
        confirmed = await client.post(
            "/api/v1/uploads/confirm",
            headers=headers,
            json={
                "extract_token": body["extract_token"],
                "lab_name": "Quest Diagnostics",
                "collected_at": "2025-08-12",
                "chronological_age": 42,
                "markers": [{"raw_name": "Serum Albumin", "value": 46.1, "unit": "g/L"}],
            },
        )
        assert confirmed.status_code == 200
        assert confirmed.json()["document_sha256"] == sha256_hex(jpeg)
        assert confirmed.json()["marker_count"] == 1
        assert labs.saved[0].document_sha256 == sha256_hex(jpeg)
        replay = await client.post(
            "/api/v1/uploads/confirm",
            headers=headers,
            json={
                "extract_token": body["extract_token"],
                "markers": [{"raw_name": "Serum Albumin", "value": 46.1, "unit": "g/L"}],
            },
        )
        assert replay.status_code == 404


@pytest.mark.asyncio
async def test_confirm_accepts_nine_canonical_phenoage_names() -> None:
    """The review screen confirms the nine canonical names, not raw PDF labels."""
    accounts = _account_service()
    uploads, _vision, labs = _upload_bundle()
    application = _app(accounts, uploads)
    jpeg = b"\xff\xd8\xff\xe0" + b"\x44" * 48
    markers = [
        {"raw_name": "Serum Albumin", "value": 46.0, "unit": "g/L"},
        {"raw_name": "Serum Creatinine", "value": 0.88, "unit": "mg/dL"},
        {"raw_name": "Fasting Serum Glucose", "value": 84.0, "unit": "mg/dL"},
        {"raw_name": "hs-C-Reactive Protein", "value": 0.8, "unit": "mg/L"},
        {"raw_name": "Lymphocyte Percentage", "value": 32.5, "unit": "%"},
        {"raw_name": "Mean Corpuscular Volume (MCV)", "value": 88.5, "unit": "fL"},
        {"raw_name": "Red Cell Distribution Width (RDW)", "value": 12.1, "unit": "%"},
        {"raw_name": "Alkaline Phosphatase (ALP)", "value": 58.0, "unit": "U/L"},
        {"raw_name": "White Blood Cell Count (WBC)", "value": 5.4, "unit": "10³/µL"},
    ]
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/v1/accounts", json={})
        token = created.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        extracted = await client.post(
            "/api/v1/uploads/extract",
            headers=headers,
            files={"file": ("panel.jpg", jpeg, "image/jpeg")},
        )
        assert extracted.status_code == 200
        confirmed = await client.post(
            "/api/v1/uploads/confirm",
            headers=headers,
            json={
                "extract_token": extracted.json()["extract_token"],
                "lab_name": "Quest Diagnostics",
                "collected_at": "2023-11-15",
                "chronological_age": 42,
                "markers": markers,
            },
        )
    assert confirmed.status_code == 200
    assert confirmed.json()["marker_count"] == 9
    assert [item.raw_name for item in labs.markers[0]] == [item["raw_name"] for item in markers]


@pytest.mark.asyncio
async def test_confirm_keeps_values_when_labels_look_personal() -> None:
    """A name or birth year in the confirm body does not reject the measured values."""
    accounts = _account_service()
    uploads, _vision, labs = _upload_bundle()
    application = _app(accounts, uploads)
    jpeg = b"\xff\xd8\xff\xe0" + b"\x55" * 48
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/v1/accounts", json={})
        token = created.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        extracted = await client.post(
            "/api/v1/uploads/extract",
            headers=headers,
            files={"file": ("panel.jpg", jpeg, "image/jpeg")},
        )
        confirmed = await client.post(
            "/api/v1/uploads/confirm",
            headers=headers,
            json={
                "extract_token": extracted.json()["extract_token"],
                "lab_name": "Иван Петров",
                "collected_at": "2023-11-15",
                "chronological_age": 1984,
                "markers": [
                    {"raw_name": "Serum Albumin", "value": 46.2, "unit": "g/L"},
                    {"raw_name": "Мочевая Кислота", "value": 320, "unit": "мкмоль/л"},
                ],
            },
        )
        assert confirmed.status_code == 200
        owned = await client.get("/api/v1/uploads/results", headers=headers)
    assert owned.status_code == 200
    body = owned.json()["results"]
    assert len(body) == 1
    assert body[0]["lab_name"] is None
    assert body[0]["chronological_age"] is None
    saved_names = [item.raw_name for item in labs.markers[0]]
    assert "Serum Albumin" in saved_names
    assert "Иван Петров" not in saved_names
    assert all("Мочевая" not in name for name in saved_names)
    assert labs.ages[0] is None


@pytest.mark.asyncio
async def test_extract_rejects_unsupported_type() -> None:
    """A text file is not parsed as a lab report."""
    accounts = _account_service()
    application = _app(accounts, _upload_bundle()[0])
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/v1/accounts", json={})
        token = created.json()["access_token"]
        response = await client.post(
            "/api/v1/uploads/extract",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("notes.txt", b"hello world this is not a pdf", "text/plain")},
        )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_extract_stops_before_gemini_when_budget_is_exhausted() -> None:
    """A full global budget refuses the extract without calling the provider."""
    vision = FakeVision()
    labs = InMemoryLabStore()
    service = UploadService(
        vision=vision,
        sessions=InMemoryExtractSessionStore(ttl_seconds=60),
        lab_results=labs,
        max_upload_bytes=1_000_000,
        budget=GeminiTokenBudget(
            daily_token_budget=10,
            user_daily_token_budget=100_000,
            ip_daily_token_budget=150_000,
            call_token_reserve=16_000,
            user_daily_calls=8,
            ip_daily_calls=12,
            warn_ratio=0.8,
        ),
    )
    user = UserRecord(id=uuid4(), public_id="nmtest", is_public=False, created_at=datetime.now(UTC))
    jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 32
    with pytest.raises(GeminiBudgetExhaustedError):
        await service.extract(user.id, jpeg, client_key="203.0.113.20")
    assert vision.media_calls == 0
    assert vision.text_calls == 0


@pytest.mark.asyncio
async def test_extract_http_budget_is_429_without_global_figures() -> None:
    """The refusal names the daily limit and returns only the caller's counter."""
    accounts = _account_service()
    vision = FakeVision()
    service = UploadService(
        vision=vision,
        sessions=InMemoryExtractSessionStore(ttl_seconds=60),
        lab_results=InMemoryLabStore(),
        max_upload_bytes=1_000_000,
        budget=GeminiTokenBudget(
            daily_token_budget=10,
            user_daily_token_budget=100_000,
            ip_daily_token_budget=150_000,
            call_token_reserve=16_000,
            user_daily_calls=8,
            ip_daily_calls=12,
            warn_ratio=0.8,
        ),
    )
    application = _app(accounts, service)
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/v1/accounts", json={})
        token = created.json()["access_token"]
        response = await client.post(
            "/api/v1/uploads/extract",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("panel.jpg", b"\xff\xd8\xff\xe0" + b"\x22" * 16, "image/jpeg")},
        )
    assert response.status_code == 429
    body = response.json()
    assert body["detail"] == "Daily extraction limit reached"
    assert body["tokens_used"] == 0
    assert body["tokens_limit"] == 100_000
    assert body["warning"] is True
    assert set(body) == {"detail", "tokens_used", "tokens_limit", "warning"}
    assert vision.media_calls == 0
