"""FastAPI Application Main Entry point."""
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.routers import profile, grid, budget, intelligence

app = FastAPI(
    title="Carbon Footprint Estimator API",
    description="Python FastAPI backend for estimating, profiling, and analyzing software codebase carbon emissions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(grid.router, prefix="/api/grid", tags=["India Grid"])
app.include_router(budget.router, prefix="/api/budget", tags=["Carbon Budget"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Green Code Intelligence"])
app.include_router(intelligence.router, prefix="/api", tags=["ML Prediction"])


@app.get("/")
def root():
    return {
        "title": "Carbon Footprint Estimator API",
        "status": "online",
        "docs": "/docs",
        "default_region": settings.DEFAULT_REGION,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
