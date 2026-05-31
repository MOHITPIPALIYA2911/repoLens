import json
from typing import Any

from app.db.database import execute, fetch_all


SCORE_KEYS = [
    "recruiter_readiness",
    "production_readiness",
    "documentation",
    "code_structure",
    "activity",
    "consistency",
]


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
    }

    execute(
        """
        INSERT INTO leaderboard_repos (
            repo_url,
            name,
            full_name,
            owner_username,
            repo_name,
            description,
            main_language,
            stars,
            forks,
            open_issues,
            average_score,
            overall_score,
            repository,
            features,
            scores,
            analyzed_at
        )
        VALUES (
            :repo_url,
            :name,
            :full_name,
            :owner_username,
            :repo_name,
            :description,
            :main_language,
            :stars,
            :forks,
            :open_issues,
            :average_score,
            :overall_score,
            CAST(:repository AS JSONB),
            CAST(:features AS JSONB),
            CAST(:scores AS JSONB),
            NOW()
        )
        ON CONFLICT (repo_url)
        DO UPDATE SET
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name,
            owner_username = EXCLUDED.owner_username,
            repo_name = EXCLUDED.repo_name,
            description = EXCLUDED.description,
            main_language = EXCLUDED.main_language,
            stars = EXCLUDED.stars,
            forks = EXCLUDED.forks,
            open_issues = EXCLUDED.open_issues,
            average_score = EXCLUDED.average_score,
            overall_score = EXCLUDED.overall_score,
            repository = EXCLUDED.repository,
            features = EXCLUDED.features,
            scores = EXCLUDED.scores,
            analyzed_at = NOW()
        """,
        {
            "repo_url": repository.get("url"),
            "name": repository.get("name"),
            "full_name": repository.get("full_name"),
            "owner_username": repository.get("owner"),
            "repo_name": repository.get("repo"),
            "description": repository.get("description"),
            "main_language": repository.get("main_language"),
            "stars": repository.get("stars", 0),
            "forks": repository.get("forks", 0),
            "open_issues": repository.get("open_issues", 0),
            "average_score": average_score,
            "overall_score": scores.get("overall", 0),
            "repository": json.dumps(repository),
            "features": json.dumps(features),
            "scores": json.dumps(scores),
        },
    )

    return entry


def get_top_repositories(limit: int = 10) -> list[dict[str, Any]]:
    rows = fetch_all(
        """
        SELECT
            repo_url,
            name,
            full_name,
            owner_username,
            repo_name,
            description,
            main_language,
            stars,
            forks,
            open_issues,
            average_score,
            overall_score,
            repository,
            features,
            scores,
            analyzed_at
        FROM leaderboard_repos
        ORDER BY overall_score DESC
        LIMIT :limit
        """,
        {"limit": limit},
    )

    items = []

    for index, row in enumerate(rows, start=1):
        scores = row.get("scores") or {}
        features = row.get("features") or {}

        items.append(
            {
                "rank": index,
                "name": row.get("name"),
                "full_name": row.get("full_name"),
                "owner": row.get("owner_username"),
                "repo": row.get("repo_name"),
                "url": row.get("repo_url"),
                "description": row.get("description"),
                "main_language": row.get("main_language"),
                "stars": row.get("stars", 0),
                "forks": row.get("forks", 0),
                "open_issues": row.get("open_issues", 0),

                "average_score": row.get("average_score", 0),
                "overall_score": row.get("overall_score", 0),
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

                "analyzed_at": str(row.get("analyzed_at")) if row.get("analyzed_at") else None,
            }
        )

    return items


def delete_leaderboard_entry(repo_url: str) -> bool:
    before = fetch_all(
        """
        SELECT repo_url
        FROM leaderboard_repos
        WHERE repo_url = :repo_url
        """,
        {"repo_url": repo_url},
    )

    if not before:
        return False

    execute(
        """
        DELETE FROM leaderboard_repos
        WHERE repo_url = :repo_url
        """,
        {"repo_url": repo_url},
    )

    return True