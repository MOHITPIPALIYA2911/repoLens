from math import log1p


CATEGORY_SCORE_KEYS = [
    "recruiter_readiness",
    "production_readiness",
    "documentation",
    "code_structure",
    "activity",
    "consistency",
]

SCORE_KEYS = [
    "overall",
    *CATEGORY_SCORE_KEYS,
]

FEATURE_VECTOR_NAMES = [
    "readme_length_scaled",
    "readme_section_count_scaled",
    "stars_scaled",
    "forks_scaled",
    "open_issues_scaled",
    "file_count_scaled",
    "folder_count_scaled",
    "language_count_scaled",
    "topic_count_scaled",
    "days_since_push_scaled",
    "repo_age_days_scaled",

    "has_readme",
    "has_project_description",
    "has_screenshots",
    "has_setup_guide",
    "has_tech_stack",
    "has_live_demo",
    "has_api_docs",
    "has_license",
    "has_tests",
    "has_dockerfile",
    "has_ci_cd",
    "has_env_example",
    "has_package_file",
    "is_archived",
    "is_fork",
]


def _bool(value) -> float:
    return 1.0 if bool(value) else 0.0


def _num(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _scale_log(value, max_value: float) -> float:
    value = max(_num(value), 0.0)
    return min(log1p(value) / log1p(max_value), 1.0)


def _scale_linear(value, max_value: float) -> float:
    value = max(_num(value), 0.0)
    return min(value / max_value, 1.0)


def features_to_vector(features: dict) -> list[float]:
    return [
        _scale_linear(features.get("readme_length"), 8000),
        _scale_linear(features.get("readme_section_count"), 25),
        _scale_log(features.get("stars"), 50000),
        _scale_log(features.get("forks"), 10000),
        _scale_log(features.get("open_issues"), 2000),
        _scale_linear(features.get("file_count"), 2500),
        _scale_linear(features.get("folder_count"), 150),
        _scale_linear(features.get("language_count"), 12),
        _scale_linear(features.get("topic_count"), 20),
        _scale_linear(features.get("days_since_push"), 730),
        _scale_linear(features.get("repo_age_days"), 3650),

        _bool(features.get("has_readme")),
        _bool(features.get("has_project_description")),
        _bool(features.get("has_screenshots")),
        _bool(features.get("has_setup_guide")),
        _bool(features.get("has_tech_stack")),
        _bool(features.get("has_live_demo")),
        _bool(features.get("has_api_docs")),
        _bool(features.get("has_license")),
        _bool(features.get("has_tests")),
        _bool(features.get("has_dockerfile")),
        _bool(features.get("has_ci_cd")),
        _bool(features.get("has_env_example")),
        _bool(features.get("has_package_file")),
        _bool(features.get("is_archived")),
        _bool(features.get("is_fork")),
    ]


def scores_to_target(scores: dict) -> list[float]:
    return [
        float(scores.get(key, 0))
        for key in SCORE_KEYS
    ]


def clamp_score(value) -> int:
    try:
        value = round(float(value))
    except Exception:
        value = 0

    return max(0, min(100, value))


def target_to_scores(target: list[float]) -> dict:
    scores = {}

    for index, key in enumerate(SCORE_KEYS):
        scores[key] = clamp_score(target[index])

    return scores