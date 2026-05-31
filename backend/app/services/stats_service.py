from app.db.database import execute, fetch_one


def increment_repo_analysis_count(repo_url: str | None = None) -> dict:
    execute(
        """
        UPDATE app_stats
        SET total_repo_analyses = total_repo_analyses + 1,
            last_updated_at = NOW()
        WHERE id = 1
        """
    )

    if repo_url:
        execute(
            """
            INSERT INTO unique_repos (repo_url)
            VALUES (:repo_url)
            ON CONFLICT (repo_url) DO NOTHING
            """,
            {"repo_url": repo_url.strip().rstrip("/").lower()},
        )

    return get_public_stats()


def get_public_stats() -> dict:
    stats = fetch_one(
        """
        SELECT
            total_repo_analyses,
            last_updated_at
        FROM app_stats
        WHERE id = 1
        """
    )

    unique_repo = fetch_one(
        """
        SELECT COUNT(*) AS unique_repo_count
        FROM unique_repos
        """
    )

    return {
        "total_repo_analyses": stats["total_repo_analyses"] if stats else 0,
        "unique_repo_count": unique_repo["unique_repo_count"] if unique_repo else 0,
        "last_updated_at": str(stats["last_updated_at"]) if stats and stats["last_updated_at"] else None,
    }