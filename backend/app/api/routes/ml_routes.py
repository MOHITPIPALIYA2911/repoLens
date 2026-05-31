from fastapi import APIRouter

from app.services.ml_scoring_service import get_model_status, train_repo_model


router = APIRouter(prefix="/api/ml", tags=["ML Model"])


@router.get("/status")
def model_status():
    return get_model_status()


@router.post("/train")
def train_model():
    return train_repo_model(force=True)