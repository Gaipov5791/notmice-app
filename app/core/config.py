"""Runtime configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Process settings. Unknown env keys are ignored so frontend secrets do not break boot."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://notmice:notmice@localhost:5432/notmice"
    cors_origins: str = "http://localhost:3000,http://localhost:8080"
    log_level: str = "INFO"
    secret_key: str = "dev-insecure-change-me-not-for-prod"
    access_token_ttl_seconds: int = 43_200
    vision_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    claude_api_key: str = ""
    claude_model: str = "claude-sonnet-5"
    max_upload_bytes: int = 15_728_640
    extract_session_ttl_seconds: int = 1_800

    @property
    def cors_origin_list(self) -> list[str]:
        """Return CORS origins as a stripped list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings singleton."""
    return Settings()
