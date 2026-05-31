from urllib.parse import quote

import httpx

from app.core.config import get_settings


GITHUB_API_BASE = "https://api.github.com"


class GitHubService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _headers(self, raw: bool = False) -> dict[str, str]:
        headers = {
            "User-Agent": "RepoLens",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        if raw:
            headers["Accept"] = "application/vnd.github.raw"
        else:
            headers["Accept"] = "application/vnd.github+json"

        token = self.settings.github_token

        if token and token != "your_github_token_here":
            headers["Authorization"] = f"Bearer {token}"

        return headers

    async def get_user(self, username: str) -> dict:
        username = username.strip()

        if username.isdigit():
            url = f"{GITHUB_API_BASE}/user/{username}"
        else:
            url = f"{GITHUB_API_BASE}/users/{username}"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers())

        if response.status_code == 404:
            raise ValueError(
                "GitHub user not found. Enter the exact GitHub username from the profile URL, for example: vercel, torvalds, or your-username."
            )

        if response.status_code == 401:
            raise ValueError(
                "GitHub authentication failed. Check your GITHUB_TOKEN in backend .env."
            )

        if response.status_code == 403:
            raise ValueError(
                "GitHub API rate limit reached. Add a valid GitHub token in backend .env."
            )

        response.raise_for_status()
        return response.json()

    async def get_user_repos(self, username: str, max_repos: int = 10) -> list[dict]:
        username = username.strip()
        repos: list[dict] = []
        page = 1

        async with httpx.AsyncClient(timeout=30) as client:
            while len(repos) < max_repos:
                remaining = max_repos - len(repos)

                response = await client.get(
                    f"{GITHUB_API_BASE}/users/{username}/repos",
                    headers=self._headers(),
                    params={
                        "type": "owner",
                        "sort": "updated",
                        "direction": "desc",
                        "per_page": min(100, remaining),
                        "page": page,
                    },
                )

                if response.status_code == 404:
                    raise ValueError(
                        "GitHub user repositories not found. Enter the exact GitHub username from the profile URL."
                    )

                if response.status_code == 401:
                    raise ValueError(
                        "GitHub authentication failed. Check your GITHUB_TOKEN in backend .env."
                    )

                if response.status_code == 403:
                    raise ValueError(
                        "GitHub API rate limit reached. Add a valid GitHub token in backend .env."
                    )

                response.raise_for_status()

                data = response.json()

                if not data:
                    break

                repos.extend(data)
                page += 1

        return repos[:max_repos]

    async def get_repo(self, owner: str, repo: str) -> dict:
        owner = owner.strip()
        repo = repo.strip()

        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers())

        if response.status_code == 404:
            raise ValueError("Repository not found or not public.")

        if response.status_code == 401:
            raise ValueError(
                "GitHub authentication failed. Check your GITHUB_TOKEN in backend .env."
            )

        if response.status_code == 403:
            raise ValueError(
                "GitHub API rate limit reached. Add a valid GitHub token in backend .env."
            )

        response.raise_for_status()
        return response.json()

    async def get_readme(self, owner: str, repo: str) -> str:
        owner = owner.strip()
        repo = repo.strip()

        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/readme"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers(raw=True))

        if response.status_code == 404:
            return ""

        if response.status_code >= 400:
            return ""

        return response.text or ""

    async def get_languages(self, owner: str, repo: str) -> dict:
        owner = owner.strip()
        repo = repo.strip()

        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/languages"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers())

        if response.status_code >= 400:
            return {}

        return response.json()

    async def get_tree(self, owner: str, repo: str, default_branch: str) -> list[dict]:
        owner = owner.strip()
        repo = repo.strip()
        default_branch = default_branch.strip() or "main"

        encoded_branch = quote(default_branch, safe="")

        url = (
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/"
            f"{encoded_branch}?recursive=1"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers())

        if response.status_code in [404, 409]:
            return []

        if response.status_code >= 400:
            return []

        data = response.json()
        return data.get("tree", [])