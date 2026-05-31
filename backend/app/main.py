from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ml_routes import router as ml_router

from app.core.config import get_settings
from app.api.routes.repo_routes import router as repo_router
from app.api.routes.profile_routes import router as profile_router
from app.api.routes.leaderboard_routes import router as leaderboard_router
from app.api.routes.comparison_routes import router as comparison_router
from app.api.routes.stats_routes import router as stats_router

from app.api.routes.feedback_routes import router as feedback_router

from app.db.schema import init_db

settings = get_settings()

app = FastAPI(title="RepoLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repo_router)
app.include_router(profile_router)
app.include_router(leaderboard_router)
app.include_router(comparison_router)
app.include_router(stats_router)
app.include_router(ml_router)
app.include_router(feedback_router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {"message": "RepoLens API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}