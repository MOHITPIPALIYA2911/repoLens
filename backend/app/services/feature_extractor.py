from datetime import datetime, timezone
import re


def _contains_any(text: str, keywords: list[str]) -> bool:
    text = text.lower()
    return any(keyword in text for keyword in keywords)


def _days_between_now(date_text: str | None) -> int:
    if not date_text:
        return 9999

    try:
        date_value = datetime.fromisoformat(date_text.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return max((now - date_value).days, 0)
    except Exception:
        return 9999


def extract_repo_features(
    repo_data: dict,
    readme_text: str,
    tree: list[dict],
    languages: dict,
) -> dict:
    readme_lower = readme_text.lower()

    paths = [
        item.get("path", "")
        for item in tree
        if item.get("type") == "blob" and item.get("path")
    ]

    lower_paths = [path.lower() for path in paths]

    root_files = {
        path.lower()
        for path in paths
        if "/" not in path
    }

    folders = set()

    for path in paths:
        parts = path.split("/")
        if len(parts) > 1:
            for index in range(1, len(parts)):
                folders.add("/".join(parts[:index]).lower())

    has_tests = any(
        "test" in path
        or "tests/" in path
        or "__tests__" in path
        or ".test." in path
        or ".spec." in path
        for path in lower_paths
    )

    has_ci_cd = any(
        path.startswith(".github/workflows/")
        or path == ".gitlab-ci.yml"
        or path.startswith(".circleci/")
        for path in lower_paths
    )

    has_dockerfile = any(
        path == "dockerfile" or path.endswith("/dockerfile")
        for path in lower_paths
    )

    has_license = any(
        path == "license"
        or path.startswith("license.")
        or path == "licence"
        or path.startswith("licence.")
        for path in root_files
    )

    has_env_example = any(
        path in [".env.example", ".env.sample", "sample.env", "example.env"]
        or path.endswith("/.env.example")
        for path in lower_paths
    )

    important_package_files = [
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "pom.xml",
        "build.gradle",
        "composer.json",
        "gemfile",
        "go.mod",
        "cargo.toml",
        "docker-compose.yml",
    ]

    has_package_file = any(
        path in important_package_files
        or any(path.endswith("/" + file_name) for file_name in important_package_files)
        for path in lower_paths
    )

    has_screenshots = (
        bool(re.search(r"!\[.*?\]\(.*?\)", readme_text))
        or "<img" in readme_lower
        or "screenshot" in readme_lower
        or "screenshots" in readme_lower
    )

    has_live_demo = (
        "demo" in readme_lower
        or "live" in readme_lower
        or "vercel.app" in readme_lower
        or "netlify.app" in readme_lower
        or "render.com" in readme_lower
        or "herokuapp.com" in readme_lower
        or "github.io" in readme_lower
    )

    has_setup_guide = _contains_any(
        readme_lower,
        [
            "installation",
            "install",
            "setup",
            "getting started",
            "how to run",
            "run locally",
            "usage",
        ],
    )

    has_api_docs = _contains_any(
        readme_lower,
        [
            "api",
            "endpoint",
            "swagger",
            "openapi",
            "postman",
            "request",
            "response",
        ],
    )

    has_tech_stack = _contains_any(
        readme_lower,
        [
            "tech stack",
            "technologies",
            "built with",
            "tools used",
            "framework",
            "library",
        ],
    )

    has_project_description = len(readme_text.strip()) > 120

    readme_section_count = readme_text.count("#")

    pushed_at = repo_data.get("pushed_at")
    created_at = repo_data.get("created_at")

    return {
        "repo_name": repo_data.get("name"),
        "full_name": repo_data.get("full_name"),
        "description": repo_data.get("description"),
        "default_branch": repo_data.get("default_branch"),
        "main_language": repo_data.get("language"),
        "languages": list(languages.keys()),
        "language_count": len(languages),
        "topics": repo_data.get("topics") or [],
        "topic_count": len(repo_data.get("topics") or []),

        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "watchers": repo_data.get("watchers_count", 0),
        "open_issues": repo_data.get("open_issues_count", 0),

        "is_archived": repo_data.get("archived", False),
        "is_fork": repo_data.get("fork", False),

        "created_at": created_at,
        "updated_at": repo_data.get("updated_at"),
        "pushed_at": pushed_at,
        "days_since_push": _days_between_now(pushed_at),
        "repo_age_days": _days_between_now(created_at),

        "file_count": len(paths),
        "folder_count": len(folders),

        "has_readme": bool(readme_text.strip()),
        "readme_length": len(readme_text),
        "readme_section_count": readme_section_count,
        "has_project_description": has_project_description,
        "has_screenshots": has_screenshots,
        "has_setup_guide": has_setup_guide,
        "has_tech_stack": has_tech_stack,
        "has_live_demo": has_live_demo,
        "has_api_docs": has_api_docs,

        "has_license": has_license,
        "has_tests": has_tests,
        "has_dockerfile": has_dockerfile,
        "has_ci_cd": has_ci_cd,
        "has_env_example": has_env_example,
        "has_package_file": has_package_file,
    }