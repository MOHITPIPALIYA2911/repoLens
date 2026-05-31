from fastapi import APIRouter, HTTPException

from app.schemas.repo_schema import RepoAnalyzeRequest, RepoAnalysisResponse
from app.services.repo_analysis_service import analyze_repo_by_url
from app.services.leaderboard_service import upsert_leaderboard_entry


router = APIRouter(prefix="/api/repo", tags=["Repository"])


@router.post("/analyze", response_model=RepoAnalysisResponse)
async def analyze_repo(payload: RepoAnalyzeRequest):
    try:
        result = await analyze_repo_by_url(payload.repo_url)

        upsert_leaderboard_entry(result)

        return result

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(error)}")