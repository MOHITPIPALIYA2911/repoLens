from urllib.parse import urlparse


def parse_github_repo_url(repo_url: str) -> tuple[str, str]:
    if not repo_url:
        raise ValueError("Repository URL is required.")

    repo_url = repo_url.strip()

    if repo_url.startswith("git@github.com:"):
        repo_url = repo_url.replace("git@github.com:", "https://github.com/")

    parsed = urlparse(repo_url)

    if "github.com" not in parsed.netloc.lower():
        raise ValueError("Only GitHub repository URLs are supported.")

    parts = [part for part in parsed.path.strip("/").split("/") if part]

    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL.")

    owner = parts[0]
    repo = parts[1].replace(".git", "")

    return owner, repo