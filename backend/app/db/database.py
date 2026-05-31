from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import get_settings


settings = get_settings()

engine: Engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


def execute(query: str, params: dict[str, Any] | None = None) -> None:
    with engine.begin() as connection:
        connection.execute(text(query), params or {})


def fetch_one(query: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
    with engine.connect() as connection:
        row = connection.execute(text(query), params or {}).mappings().first()

    if row is None:
        return None

    return dict(row)


def fetch_all(query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    with engine.connect() as connection:
        rows = connection.execute(text(query), params or {}).mappings().all()

    return [dict(row) for row in rows]