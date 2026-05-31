from typing import Any
from pydantic import BaseModel, Field


class RepoCompareRequest(BaseModel):
    repo_a_url: str = Field(..., examples=["https://github.com/vercel/next.js"])
    repo_b_url: str = Field(..., examples=["https://github.com/username/my-repo"])


class RepoCompareResponse(BaseModel):
    repo_a: dict[str, Any]
    repo_b: dict[str, Any]
    winners: dict[str, Any]
    overall_winner: dict[str, Any]
    missing_for_a: list[str]
    missing_for_b: list[str]
    review: dict[str, Any]