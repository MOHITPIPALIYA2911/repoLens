from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any


STATS_FILE = Path("storage/stats.json")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_stats() -> dict[str, Any]:
    if not STATS_FILE.exists():
        return {
            "total_repo_analyses": 0,
            "unique_repos": [],
            "last_updated_at": None,
        }

    try:
        with STATS_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, dict):
            raise ValueError("Invalid stats file")

        data.setdefault("total_repo_analyses", 0)
        data.setdefault("unique_repos", [])
        data.setdefault("last_updated_at", None)

        return data

    except Exception:
        return {
            "total_repo_analyses": 0,
            "unique_repos": [],
            "last_updated_at": None,
        }


def _write_stats(stats: dict[str, Any]) -> None:
    STATS_FILE.parent.mkdir(parents=True, exist_ok=True)

    with STATS_FILE.open("w", encoding="utf-8") as file:
        json.dump(stats, file, indent=2)


def increment_repo_analysis_count(repo_url: str | None = None) -> dict[str, Any]:
    stats = _read_stats()

    stats["total_repo_analyses"] = int(stats.get("total_repo_analyses", 0)) + 1
    stats["last_updated_at"] = _now()

    if repo_url:
        normalized_url = repo_url.strip().rstrip("/").lower()
        unique_repos = stats.get("unique_repos", [])

        if normalized_url and normalized_url not in unique_repos:
            unique_repos.append(normalized_url)

        stats["unique_repos"] = unique_repos

    _write_stats(stats)

    return stats


def get_public_stats() -> dict[str, Any]:
    stats = _read_stats()

    return {
        "total_repo_analyses": stats.get("total_repo_analyses", 0),
        "unique_repo_count": len(stats.get("unique_repos", [])),
        "last_updated_at": stats.get("last_updated_at"),
    }