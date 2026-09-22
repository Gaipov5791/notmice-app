"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.accounts import router as accounts_router
from app.api.health import router as health_router
from app.api.phenoage import router as phenoage_router
from app.api.uploads import router as uploads_router
from app.core.config import get_settings
from app.core.deps import dispose_engine
from app.core.logging import configure_logging

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Configure logging on startup and dispose the database engine on shutdown."""
    settings = get_settings()
    configure_logging(settings.log_level)
    logger.info("api_start")
    yield
    await dispose_engine()
    logger.info("api_stop")


def create_app() -> FastAPI:
    """Build the ASGI application."""
    settings = get_settings()
    application = FastAPI(
        title="NotMice API",
        version="0.1.0",
        lifespan=lifespan,
        license_info={"name": "AGPL-3.0-or-later"},
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(health_router)
    application.include_router(accounts_router)
    application.include_router(uploads_router)
    application.include_router(phenoage_router)
    return application


app = create_app()
