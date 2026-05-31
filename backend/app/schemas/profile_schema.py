from typing import Any
from pydantic import BaseModel, Field


class ProfileAnalyzeRequest(BaseModel):
    username: str = Field(..., examples=["torvalds"])
    max_repos: int = Field(default=10, ge=1, le=30)


class ProfileAnalysisResponse(BaseModel):
    profile: dict[str, Any]
    scores: dict[str, Any]
    developer_type: str
    skills: dict[str, Any]
    best_repo: dict[str, Any] | None
    weakest_repo: dict[str, Any] | None
    repositories: list[dict[str, Any]]
    review: dict[str, Any]