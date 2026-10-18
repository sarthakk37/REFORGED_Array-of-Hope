"""Application configuration module using pydantic-settings.

This is the only place in the backend where environment variables are parsed.
"""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """DriftSmith server and integration configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173"

    # Database settings
    database_url: str = "sqlite:///./data/driftsmith.db"

    # Authentication settings
    auth_enabled: bool = True
    jwt_secret: str = "demo-secret-key-change-in-production"
    jwt_expiry_minutes: int = 1440
    demo_password: str = "password"
    api_key: str = "drift-secret-key-42"

    # AI and LLM settings
    llm_mode: Literal["live", "replay", "mock"] = "mock"
    gemini_api_key: str = ""
    gemma_model_diag: str = "gemma-2-9b-it"
    gemma_model_code: str = "gemma-2-27b-it"

    # Targets & mock provider
    demo_targets_path: str = "../demo"
    provider_url: str = "http://localhost:9000"

    # Integrations
    github_token: str = ""
    github_repo: str = ""
    slack_webhook_url: str = ""
    n8n_webhook_url: str = ""
    sandbox_timeout_seconds: int = 30

    @property
    def cors_origin_list(self) -> list[str]:
        """Return CORS origins as a trimmed list of strings."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def replay_dir(self) -> Path:
        """Return directory where live LLM interactions are cached."""
        return Path(__file__).resolve().parent.parent.parent / "fixtures" / "llm_replay"

    @property
    def mock_dir(self) -> Path:
        """Return directory containing scripted scenario responses."""
        return Path(__file__).resolve().parent.parent.parent / "fixtures" / "llm_mock"


settings = Settings()
