def _clamp(score: float) -> int:
    return max(0, min(100, round(score)))


def _activity_score(days_since_push: int) -> int:
    if days_since_push <= 7:
        return 100
    if days_since_push <= 30:
        return 85
    if days_since_push <= 90:
        return 65
    if days_since_push <= 180:
        return 45
    if days_since_push <= 365:
        return 25
    return 10


def calculate_repo_scores(features: dict) -> dict:
    documentation = 0

    if features["has_readme"]:
        documentation += 15
    if features["readme_length"] >= 800:
        documentation += 15
    if features["readme_length"] >= 2000:
        documentation += 10
    if features["has_project_description"]:
        documentation += 10
    if features["has_setup_guide"]:
        documentation += 15
    if features["has_tech_stack"]:
        documentation += 10
    if features["has_screenshots"]:
        documentation += 15
    if features["has_live_demo"]:
        documentation += 10
    if features["has_api_docs"]:
        documentation += 10

    documentation = _clamp(documentation)

    production = 0

    if features["has_tests"]:
        production += 25
    if features["has_dockerfile"]:
        production += 20
    if features["has_ci_cd"]:
        production += 20
    if features["has_env_example"]:
        production += 10
    if features["has_package_file"]:
        production += 10
    if features["has_license"]:
        production += 10
    if features["folder_count"] >= 3:
        production += 5

    production = _clamp(production)

    structure = 0

    if features["file_count"] >= 5:
        structure += 20
    if features["folder_count"] >= 2:
        structure += 25
    if features["folder_count"] >= 5:
        structure += 15
    if features["has_package_file"]:
        structure += 15
    if features["has_tests"]:
        structure += 15
    if features["has_ci_cd"]:
        structure += 10

    structure = _clamp(structure)

    activity = _activity_score(features["days_since_push"])

    if features["is_archived"]:
        activity = min(activity, 20)

    completeness_items = [
        features["has_readme"],
        features["has_project_description"],
        features["has_setup_guide"],
        features["has_tech_stack"],
        features["has_screenshots"],
        features["has_live_demo"],
        features["has_license"],
        features["has_tests"],
        features["has_dockerfile"],
        features["has_ci_cd"],
        features["has_package_file"],
    ]

    consistency = _clamp((sum(completeness_items) / len(completeness_items)) * 100)

    recruiter = (
        documentation * 0.45
        + production * 0.20
        + structure * 0.20
        + activity * 0.10
        + min(features["stars"], 20) * 0.25
    )

    recruiter = _clamp(recruiter)

    overall = (
        recruiter * 0.25
        + production * 0.20
        + documentation * 0.20
        + structure * 0.15
        + activity * 0.10
        + consistency * 0.10
    )

    overall = _clamp(overall)

    categories = {
        "recruiter_readiness": recruiter,
        "production_readiness": production,
        "documentation": documentation,
        "code_structure": structure,
        "activity": activity,
        "consistency": consistency,
    }

    strongest_category = max(categories, key=categories.get)
    weakest_category = min(categories, key=categories.get)

    if overall >= 85:
        badge = "Excellent"
    elif overall >= 70:
        badge = "Recruiter Ready"
    elif overall >= 50:
        badge = "Needs Improvement"
    else:
        badge = "Weak Presentation"

    return {
        "overall": overall,
        **categories,
        "strongest_category": strongest_category,
        "weakest_category": weakest_category,
        "badge": badge,
    }