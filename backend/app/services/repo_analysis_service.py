from app.utils.repo_parser import parse_github_repo_url
from app.services.github_service import GitHubService
from app.services.feature_extractor import extract_repo_features
from app.services.scoring_service import calculate_repo_scores
from app.services.review_service import generate_repo_review
from app.services.stats_service import increment_repo_analysis_count
from app.services.ml_scoring_service import (
    blend_rule_and_ml_scores,
    predict_ml_scores,
    save_training_example,
)


async def analyze_repo_by_url(repo_url: str) -> dict:
    owner, repo_name = parse_github_repo_url(repo_url)

    github = GitHubService()

    repo_data = await github.get_repo(owner, repo_name)
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

    increment_repo_analysis_count(repository.get("url"))

    save_training_example(
        {
            "repository": repository,
            "features": features,
            "scores": rule_scores,
        }
    )

    return result