from fastapi import APIRouter, HTTPException

from app.schemas.feedback_schema import RepoFeedbackRequest
from app.services.ml_scoring_service import save_user_feedback_example


router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post("/repo")
def submit_repo_feedback(payload: RepoFeedbackRequest):
    try:
        model_status = save_user_feedback_example(
            repository=payload.repository,
            features=payload.features,
            scores=payload.scores,
            quality_label=payload.quality_label,
            score_feedback=payload.score_feedback,
            comment=payload.comment,
        )

        return {
            "saved": True,
            "message": "Feedback saved and model retrained.",
            "model_status": model_status,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Feedback save failed: {str(error)}",
        )