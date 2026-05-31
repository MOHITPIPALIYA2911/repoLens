from app.db.database import execute


SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS app_stats (
        id INTEGER PRIMARY KEY DEFAULT 1,
        total_repo_analyses BIGINT NOT NULL DEFAULT 0,
        last_updated_at TIMESTAMPTZ,
        CONSTRAINT only_one_stats_row CHECK (id = 1)
    )
    """,
    """
    INSERT INTO app_stats (id, total_repo_analyses)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
    """,
    """
    CREATE TABLE IF NOT EXISTS unique_repos (
        repo_url TEXT PRIMARY KEY,
        first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS leaderboard_repos (
        repo_url TEXT PRIMARY KEY,
        name TEXT,
        full_name TEXT,
        owner_username TEXT,
        repo_name TEXT,
        description TEXT,
        main_language TEXT,
        stars INTEGER DEFAULT 0,
        forks INTEGER DEFAULT 0,
        open_issues INTEGER DEFAULT 0,
        average_score INTEGER DEFAULT 0,
        overall_score INTEGER DEFAULT 0,
        repository JSONB NOT NULL DEFAULT '{}'::jsonb,
        features JSONB NOT NULL DEFAULT '{}'::jsonb,
        scores JSONB NOT NULL DEFAULT '{}'::jsonb,
        analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS training_examples (
        id BIGSERIAL PRIMARY KEY,
        repo_url TEXT,
        full_name TEXT,
        features JSONB NOT NULL,
        labels JSONB NOT NULL,
        label_source TEXT NOT NULL,
        feedback JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS feedback_labels (
        id BIGSERIAL PRIMARY KEY,
        repo_url TEXT,
        full_name TEXT,
        quality_label TEXT NOT NULL,
        score_feedback TEXT NOT NULL,
        comment TEXT,
        scores_at_feedback_time JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
]


def init_db() -> None:
    for statement in SCHEMA_STATEMENTS:
        execute(statement)