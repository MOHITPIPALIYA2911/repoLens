from urllib.parse import urlparse


def normalize_github_user_input(value: str) -> str:
    if not value:
        raise ValueError("GitHub username is required.")

    value = value.strip()

    if value.startswith("@"):
        value = value[1:]

    if "github.com" in value:
        parsed = urlparse(value if value.startswith("http") else f"https://{value}")
        parts = [part for part in parsed.path.strip("/").split("/") if part]

        if not parts:
            raise ValueError("Invalid GitHub profile URL.")

        return parts[0].strip()

    value = value.strip("/")

    if not value:
        raise ValueError("GitHub username is required.")

    return value