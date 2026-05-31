from fastapi import APIRouter, HTTPException

from app.schemas.comparison_schema import RepoCompareRequest, RepoCompareResponse
from app.services.comparison_service import compare_repositories


router = APIRouter(prefix="/api/repo", tags=["Repository Comparison"])


@router.post("/compare", response_model=RepoCompareResponse)
async def compare_repo(payload: RepoCompareRequest):
    try:
        return await compare_repositories(
            repo_a_url=payload.repo_a_url,
            repo_b_url=payload.repo_b_url,
        )

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(error)}")