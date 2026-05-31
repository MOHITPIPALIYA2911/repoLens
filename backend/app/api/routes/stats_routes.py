from fastapi import APIRouter

from app.services.stats_service import get_public_stats


router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("")
def get_stats():
    return get_public_stats()