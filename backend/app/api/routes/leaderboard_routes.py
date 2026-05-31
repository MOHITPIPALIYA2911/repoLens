from fastapi import APIRouter, Header, HTTPException, Query

from app.core.config import get_settings
from app.services.leaderboard_service import (
    delete_leaderboard_entry,
    get_top_repositories,
)


router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])


@router.get("")
def leaderboard(limit: int = Query(default=10, ge=1, le=50)):
    return {
        "items": get_top_repositories(limit=limit)
    }


@router.delete("")
def delete_from_leaderboard(
    repo_url: str = Query(...),
    x_admin_password: str | None = Header(default=None),
):
    settings = get_settings()

    if (
        not settings.leaderboard_admin_password
        or x_admin_password != settings.leaderboard_admin_password
    ):
        raise HTTPException(status_code=401, detail="Invalid admin password.")

    deleted = delete_leaderboard_entry(repo_url)

    if not deleted:
        raise HTTPException(status_code=404, detail="Leaderboard repo not found.")

    return {
        "deleted": True,
        "repo_url": repo_url,
    }