from app.services.repo_analysis_service import analyze_repo_by_url
from app.services.leaderboard_service import upsert_leaderboard_entry


SCORE_CATEGORIES = [
    ("overall", "Overall Score"),
    ("recruiter_readiness", "Recruiter Readiness"),
    ("production_readiness", "Production Readiness"),
    ("documentation", "Documentation"),
    ("code_structure", "Code Structure"),
    ("activity", "Activity"),
    ("consistency", "Consistency"),
]


FEATURE_CHECKS = [
    ("has_readme", "README"),
    ("has_screenshots", "Screenshots"),
    ("has_setup_guide", "Setup Guide"),
    ("has_tech_stack", "Tech Stack Section"),
    ("has_live_demo", "Live Demo"),
    ("has_api_docs", "API Documentation"),
    ("has_license", "License"),
    ("has_tests", "Tests"),
    ("has_dockerfile", "Dockerfile"),
    ("has_ci_cd", "CI/CD"),
    ("has_env_example", "Environment Example"),
    ("has_package_file", "Package/Requirements File"),
]


def _winner(score_a: int, score_b: int) -> str:
    if score_a > score_b:
        return "repo_a"

    if score_b > score_a:
        return "repo_b"

    return "tie"


def _missing_features(target_features: dict, reference_features: dict) -> list[str]:
    missing = []

    for key, label in FEATURE_CHECKS:
        if reference_features.get(key) and not target_features.get(key):
            missing.append(label)

    return missing


def _simple_repo_summary(analysis: dict) -> dict:
    return {
        "repository": analysis["repository"],
        "scores": analysis["scores"],
        "features": analysis["features"],
        "review": analysis["review"],
    }


async def compare_repositories(repo_a_url: str, repo_b_url: str) -> dict:
    repo_a = await analyze_repo_by_url(repo_a_url)
    repo_b = await analyze_repo_by_url(repo_b_url)

    upsert_leaderboard_entry(repo_a)
    upsert_leaderboard_entry(repo_b)

    winners = {}

    for key, label in SCORE_CATEGORIES:
        score_a = repo_a["scores"].get(key, 0)
        score_b = repo_b["scores"].get(key, 0)

        winners[key] = {
            "label": label,
            "repo_a_score": score_a,
            "repo_b_score": score_b,
            "winner": _winner(score_a, score_b),
            "difference": abs(score_a - score_b),
        }

    overall_a = repo_a["scores"].get("overall", 0)
    overall_b = repo_b["scores"].get("overall", 0)

    overall_winner_key = _winner(overall_a, overall_b)

    if overall_winner_key == "repo_a":
        overall_winner_name = repo_a["repository"]["full_name"]
    elif overall_winner_key == "repo_b":
        overall_winner_name = repo_b["repository"]["full_name"]
    else:
        overall_winner_name = "Tie"

    missing_for_a = _missing_features(repo_a["features"], repo_b["features"])
    missing_for_b = _missing_features(repo_b["features"], repo_a["features"])

    if overall_winner_key == "repo_a":
        summary = f"{repo_a['repository']['full_name']} looks stronger overall based on RepoLens scoring."
    elif overall_winner_key == "repo_b":
        summary = f"{repo_b['repository']['full_name']} looks stronger overall based on RepoLens scoring."
    else:
        summary = "Both repositories are very close based on RepoLens scoring."

    improvement_for_a = [
        f"Add {item}" for item in missing_for_a
    ]

    improvement_for_b = [
        f"Add {item}" for item in missing_for_b
    ]

    return {
        "repo_a": _simple_repo_summary(repo_a),
        "repo_b": _simple_repo_summary(repo_b),
        "winners": winners,
        "overall_winner": {
            "winner": overall_winner_key,
            "winner_name": overall_winner_name,
            "repo_a_score": overall_a,
            "repo_b_score": overall_b,
            "difference": abs(overall_a - overall_b),
        },
        "missing_for_a": missing_for_a,
        "missing_for_b": missing_for_b,
        "review": {
            "summary": summary,
            "improvement_for_a": improvement_for_a,
            "improvement_for_b": improvement_for_b,
        },
    }