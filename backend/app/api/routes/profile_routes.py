from fastapi import APIRouter, HTTPException

from app.schemas.profile_schema import ProfileAnalyzeRequest, ProfileAnalysisResponse
from app.services.profile_service import analyze_profile
from app.utils.user_parser import normalize_github_user_input


router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.post("/analyze", response_model=ProfileAnalysisResponse)
async def analyze_github_profile(payload: ProfileAnalyzeRequest):
    try:
        username = normalize_github_user_input(payload.username)

        return await analyze_profile(
            username=username,
            max_repos=payload.max_repos,
        )

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Profile analysis failed: {str(error)}",
        )