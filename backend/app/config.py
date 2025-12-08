"""Application configuration via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # OpenRouter API
    openrouter_api_key: str
    openrouter_model_transcription: str = "google/gemini-2.5-pro-preview"
    openrouter_model_synthesis: str = "google/gemini-2.5-pro-preview"

    # App settings
    max_file_size_mb: int = 5
    max_file_count: int = 10
    cors_origins: list[str] = ["http://localhost:5173"]
    request_timeout: int = 300
    max_retries: int = 3


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
