from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RepoLens"
    app_env: str = "development"

    github_token: str | None = None
    gemini_api_key: str | None = None
    leaderboard_admin_password: str | None = None

    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()