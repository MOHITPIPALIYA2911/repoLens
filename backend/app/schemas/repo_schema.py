from typing import Any
from pydantic import BaseModel, Field


class RepoAnalyzeRequest(BaseModel):
    repo_url: str = Field(..., examples=["https://github.com/vercel/next.js"])


class RepoAnalysisResponse(BaseModel):
    repository: dict[str, Any]
    features: dict[str, Any]
    scores: dict[str, Any]
    review: dict[str, Any]