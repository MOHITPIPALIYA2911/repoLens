from app.services.stats_service import increment_repo_analysis_count
from app.services.leaderboard_service import upsert_leaderboard_entry
from collections import Counter

from app.services.ml_scoring_service import (
    blend_rule_and_ml_scores,
    predict_ml_scores,
    save_training_example,
)
from app.services.github_service import GitHubService
from app.services.feature_extractor import extract_repo_features
from app.services.scoring_service import calculate_repo_scores
from app.services.review_service import generate_repo_review


def _average(values: list[int | float]) -> int:
    if not values:
        return 0

    return round(sum(values) / len(values))


def _detect_developer_type(languages: list[str], topics: list[str], scores: dict) -> str:
    language_set = {item.lower() for item in languages}
    topic_set = {item.lower() for item in topics}

    combined = language_set | topic_set

    ai_keywords = {
        "python",
        "jupyter notebook",
        "machine-learning",
        "ml",
        "ai",
        "deep-learning",
        "tensorflow",
        "pytorch",
        "data-science",
        "nlp",
        "computer-vision",
    }

    frontend_keywords = {
        "javascript",
        "typescript",
        "html",
        "css",
        "react",
        "nextjs",
        "vue",
        "angular",
        "svelte",
        "tailwind",
    }

    backend_keywords = {
        "python",
        "java",
        "go",
        "php",
        "ruby",
        "c#",
        "nodejs",
        "express",
        "fastapi",
        "django",
        "spring",
        "laravel",
    }

    mobile_keywords = {
        "dart",
        "flutter",
        "kotlin",
        "swift",
        "android",
        "ios",
        "react-native",
    }

    devops_keywords = {
        "docker",
        "kubernetes",
        "terraform",
        "shell",
        "devops",
        "ci-cd",
        "github-actions",
    }

    if combined & ai_keywords:
        return "AI/ML Developer"

    if combined & mobile_keywords:
        return "Mobile App Developer"

    if combined & devops_keywords and scores.get("production_readiness", 0) >= 50:
        return "DevOps-Oriented Developer"

    has_frontend = bool(combined & frontend_keywords)
    has_backend = bool(combined & backend_keywords)

    if has_frontend and has_backend:
        return "Full Stack Developer"

    if has_frontend:
        return "Frontend Developer"

    if has_backend:
        return "Backend Developer"

    if scores.get("overall", 0) >= 70:
        return "Production-Ready Developer"

    return "Beginner Builder"


def _build_profile_review(
    profile: dict,
    scores: dict,
    best_repo: dict | None,
    weakest_repo: dict | None,
) -> dict:
    strengths = []
    weaknesses = []
    red_flags = []
    improvement_plan = []

    if scores["documentation"] >= 70:
        strengths.append("Profile has good documentation quality across repositories.")
    else:
        weaknesses.append("Documentation quality is weak across repositories.")
        improvement_plan.append("Improve README files with screenshots, setup steps, tech stack, and usage guide.")

    if scores["production_readiness"] >= 60:
        strengths.append("Some repositories show production-readiness signals.")
    else:
        weaknesses.append("Most repositories lack production-readiness signals.")
        red_flags.append("Recruiters may not see testing, Docker, CI/CD, or deployment readiness.")
        improvement_plan.append("Add tests, Dockerfile, CI/CD workflow, and environment examples to top repositories.")

    if scores["activity"] >= 70:
        strengths.append("GitHub profile shows recent activity.")
    else:
        weaknesses.append("Profile activity looks low or outdated.")
        red_flags.append("Inactive repositories may look abandoned.")
        improvement_plan.append("Update your best repositories with recent commits and improvements.")

    if scores["skill_diversity"] >= 60:
        strengths.append("Profile shows a healthy variety of skills and technologies.")
    else:
        weaknesses.append("Skill diversity is limited.")
        improvement_plan.append("Add one project that demonstrates a different important skill, such as API, database, AI, testing, or deployment.")

    if best_repo:
        strengths.append(f"Best interview-ready repository: {best_repo['name']}.")

    if weakest_repo:
        weaknesses.append(f"Weakest repository presentation: {weakest_repo['name']}.")

    if scores["overall"] >= 80:
        summary = "This GitHub profile looks strong and can create a good impression during interviews."
    elif scores["overall"] >= 60:
        summary = "This GitHub profile has useful projects, but it needs better presentation and production-readiness improvements."
    else:
        summary = "This GitHub profile may look weak to recruiters because many important signals are missing."

    improvement_plan.extend(
        [
            "Pick your best 2 repositories and polish them first.",
            "Add proper README structure to important repositories.",
            "Add live demo links where possible.",
            "Add screenshots or GIFs to show project output.",
            "Add tests and GitHub Actions to at least one strong project.",
            "Hide, archive, or improve weak unfinished repositories.",
        ]
    )

    return {
        "summary": summary,
        "strengths": strengths[:8],
        "weaknesses": weaknesses[:8],
        "red_flags": red_flags[:6],
        "improvement_plan": improvement_plan[:8],
    }


async def analyze_single_repo_from_data(
    github: GitHubService,
    repo_data: dict,
) -> dict:
    owner = repo_data.get("owner", {}).get("login")
    repo_name = repo_data.get("name")

    readme_text = await github.get_readme(owner, repo_name)
    languages = await github.get_languages(owner, repo_name)

    default_branch = repo_data.get("default_branch") or "main"
    tree = await github.get_tree(owner, repo_name, default_branch)

    features = extract_repo_features(
        repo_data=repo_data,
        readme_text=readme_text,
        tree=tree,
        languages=languages,
    )

    rule_scores = calculate_repo_scores(features)
    ml_scores = predict_ml_scores(features)
    scores = blend_rule_and_ml_scores(rule_scores, ml_scores)

    review = generate_repo_review(features, scores)

    repository = {
        "name": repo_data.get("name"),
        "full_name": repo_data.get("full_name"),
        "owner": owner,
        "repo": repo_name,
        "url": repo_data.get("html_url"),
        "description": repo_data.get("description"),
        "main_language": repo_data.get("language"),
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "open_issues": repo_data.get("open_issues_count", 0),
        "default_branch": default_branch,
    }

    result = {
        "repository": repository,
        "features": features,
        "scores": scores,
        "review": review,
    }

    save_training_example(
        {
            "repository": repository,
            "features": features,
            "scores": rule_scores,
        }
    )

    return result


async def analyze_profile(username: str, max_repos: int = 10) -> dict:
    github = GitHubService()

    user_data = await github.get_user(username)
    resolved_username = user_data.get("login") or username
    repos_data = await github.get_user_repos(resolved_username, max_repos=max_repos)

    repo_results = []

    for repo_data in repos_data:
        try:
            result = await analyze_single_repo_from_data(github, repo_data)
            repo_results.append(result)
            upsert_leaderboard_entry(result)
            increment_repo_analysis_count(result["repository"].get("url"))
        except Exception:
            continue

    repo_cards = []

    for result in repo_results:
        repo = result["repository"]
        scores = result["scores"]
        features = result["features"]

        repo_cards.append(
            {
                "name": repo["name"],
                "full_name": repo["full_name"],
                "url": repo["url"],
                "description": repo["description"],
                "main_language": repo["main_language"],
                "stars": repo["stars"],
                "forks": repo["forks"],
                "overall_score": scores["overall"],
                "badge": scores["badge"],
                "strongest_category": scores["strongest_category"],
                "weakest_category": scores["weakest_category"],
                "has_readme": features["has_readme"],
                "has_tests": features["has_tests"],
                "has_dockerfile": features["has_dockerfile"],
                "has_ci_cd": features["has_ci_cd"],
                "has_live_demo": features["has_live_demo"],
            }
        )

    if repo_cards:
        best_repo = max(repo_cards, key=lambda item: item["overall_score"])
        weakest_repo = min(repo_cards, key=lambda item: item["overall_score"])
    else:
        best_repo = None
        weakest_repo = None

    repo_scores = [result["scores"] for result in repo_results]

    avg_repo_score = _average([score["overall"] for score in repo_scores])
    recruiter = _average([score["recruiter_readiness"] for score in repo_scores])
    production = _average([score["production_readiness"] for score in repo_scores])
    documentation = _average([score["documentation"] for score in repo_scores])
    activity = _average([score["activity"] for score in repo_scores])
    consistency = _average([score["consistency"] for score in repo_scores])

    all_languages = []
    all_topics = []

    for result in repo_results:
        features = result["features"]
        all_languages.extend(features.get("languages") or [])
        all_topics.extend(features.get("topics") or [])

    unique_languages = sorted(set(all_languages))
    unique_topics = sorted(set(all_topics))

    skill_diversity = min(100, len(unique_languages) * 15 + len(unique_topics) * 3)

    best_repo_score = best_repo["overall_score"] if best_repo else 0

    overall = round(
        avg_repo_score * 0.40
        + best_repo_score * 0.20
        + consistency * 0.15
        + activity * 0.10
        + skill_diversity * 0.10
        + documentation * 0.05
    )

    scores = {
        "overall": overall,
        "average_repo_score": avg_repo_score,
        "best_repo_score": best_repo_score,
        "recruiter_readiness": recruiter,
        "production_readiness": production,
        "documentation": documentation,
        "activity": activity,
        "consistency": consistency,
        "skill_diversity": skill_diversity,
    }

    language_counter = Counter(all_languages)
    top_languages = [language for language, _ in language_counter.most_common(6)]

    strongest_skills = []

    strongest_skills.extend(top_languages[:4])

    if documentation >= 70:
        strongest_skills.append("Documentation")

    if production >= 60:
        strongest_skills.append("Production Readiness")

    if activity >= 70:
        strongest_skills.append("Active Maintenance")

    if recruiter >= 70:
        strongest_skills.append("Recruiter-Friendly Projects")

    missing_skills = []

    if documentation < 60:
        missing_skills.append("Better README Documentation")

    if production < 50:
        missing_skills.append("Testing, Docker, and CI/CD")

    if skill_diversity < 50:
        missing_skills.append("Skill Diversity")

    if activity < 50:
        missing_skills.append("Recent GitHub Activity")

    if recruiter < 60:
        missing_skills.append("Interview-Ready Project Presentation")

    developer_type = _detect_developer_type(
        languages=unique_languages,
        topics=unique_topics,
        scores=scores,
    )

    profile = {
        "username": user_data.get("login"),
        "name": user_data.get("name"),
        "avatar_url": user_data.get("avatar_url"),
        "html_url": user_data.get("html_url"),
        "bio": user_data.get("bio"),
        "public_repos": user_data.get("public_repos"),
        "followers": user_data.get("followers"),
        "following": user_data.get("following"),
        "analyzed_repo_count": len(repo_results),
    }

    review = _build_profile_review(
        profile=profile,
        scores=scores,
        best_repo=best_repo,
        weakest_repo=weakest_repo,
    )

    return {
        "profile": profile,
        "scores": scores,
        "developer_type": developer_type,
        "skills": {
            "strongest": strongest_skills[:8],
            "missing": missing_skills[:8],
            "languages": unique_languages,
            "topics": unique_topics,
        },
        "best_repo": best_repo,
        "weakest_repo": weakest_repo,
        "repositories": sorted(
            repo_cards,
            key=lambda item: item["overall_score"],
            reverse=True,
        ),
        "review": review,
    }