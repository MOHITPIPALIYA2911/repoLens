from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any


LEADERBOARD_FILE = Path("storage/leaderboard.json")

SCORE_KEYS = [
    "recruiter_readiness",
    "production_readiness",
    "documentation",
    "code_structure",
    "activity",
    "consistency",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_entries() -> list[dict[str, Any]]:
    if not LEADERBOARD_FILE.exists():
        return []

    try:
        with LEADERBOARD_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except Exception:
        return []


def _write_entries(entries: list[dict[str, Any]]) -> None:
    LEADERBOARD_FILE.parent.mkdir(parents=True, exist_ok=True)

    with LEADERBOARD_FILE.open("w", encoding="utf-8") as file:
        json.dump(entries, file, indent=2)


def calculate_average_score(scores: dict[str, Any]) -> int:
    values = []

    for key in SCORE_KEYS:
        value = scores.get(key)

        if isinstance(value, int | float):
            values.append(value)

    if not values:
        return 0

    return round(sum(values) / len(values))


def upsert_leaderboard_entry(analysis: dict[str, Any]) -> dict[str, Any]:
    repository = analysis["repository"]
    scores = analysis["scores"]
    features = analysis["features"]

    average_score = calculate_average_score(scores)

    entry = {
        "name": repository.get("name"),
        "full_name": repository.get("full_name"),
        "owner": repository.get("owner"),
        "repo": repository.get("repo"),
        "url": repository.get("url"),
        "description": repository.get("description"),
        "main_language": repository.get("main_language"),
        "stars": repository.get("stars", 0),
        "forks": repository.get("forks", 0),
        "open_issues": repository.get("open_issues", 0),

        "average_score": average_score,
        "overall_score": scores.get("overall", 0),
        "recruiter_readiness": scores.get("recruiter_readiness", 0),
        "production_readiness": scores.get("production_readiness", 0),
        "documentation": scores.get("documentation", 0),
        "code_structure": scores.get("code_structure", 0),
        "activity": scores.get("activity", 0),
        "consistency": scores.get("consistency", 0),
        "strongest_category": scores.get("strongest_category"),
        "weakest_category": scores.get("weakest_category"),
        "badge": scores.get("badge"),

        "has_readme": features.get("has_readme", False),
        "has_screenshots": features.get("has_screenshots", False),
        "has_setup_guide": features.get("has_setup_guide", False),
        "has_live_demo": features.get("has_live_demo", False),
        "has_tests": features.get("has_tests", False),
        "has_dockerfile": features.get("has_dockerfile", False),
        "has_ci_cd": features.get("has_ci_cd", False),
        "has_license": features.get("has_license", False),

        "analyzed_at": _now(),
    }

    entries = _read_entries()

    entries = [
        item for item in entries
        if item.get("url") != entry["url"]
    ]

    entries.append(entry)

    entries = sorted(
        entries,
        key=lambda item: item.get("overall_score", 0),
        reverse=True,
    )

    entries = entries[:100]

    _write_entries(entries)

    return entry


def get_top_repositories(limit: int = 10) -> list[dict[str, Any]]:
    entries = _read_entries()

    entries = sorted(
        entries,
        key=lambda item: item.get("overall_score", 0),
        reverse=True,
    )

    top_entries = entries[:limit]

    ranked_entries = []

    for index, item in enumerate(top_entries, start=1):
        ranked_entries.append(
            {
                "rank": index,
                **item,
            }
        )

    return ranked_entries

def delete_leaderboard_entry(repo_url: str) -> bool:
    entries = _read_entries()

    updated_entries = [
        item for item in entries
        if item.get("url") != repo_url
    ]

    if len(updated_entries) == len(entries):
        return False

    _write_entries(updated_entries)

    return True