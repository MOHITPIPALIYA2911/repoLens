from typing import Any, Literal
from pydantic import BaseModel


class RepoFeedbackRequest(BaseModel):
    repository: dict[str, Any]
    features: dict[str, Any]
    scores: dict[str, Any]
    quality_label: Literal["strong", "average", "weak"]
    score_feedback: Literal["accurate", "too_high", "too_low"]
    comment: str | None = None