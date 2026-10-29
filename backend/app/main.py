"""FastAPI Application Main Entry point."""
import sys
import os
from contextlib import asynccontextmanager

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.routers import profile, grid, budget, intelligence, auth
from backend.app.db.mongodb import init_mongo_db, close_mongo_db, is_mongo_connected


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt MongoDB connection
    await init_mongo_db()
    yield
    # Shutdown: close MongoDB pool
    await close_mongo_db()


app = FastAPI(
    title="Carbon Footprint Estimator API",
    description="Python FastAPI backend for estimating, profiling, and analyzing software codebase carbon emissions.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(grid.router, prefix="/api/grid", tags=["India Grid"])
app.include_router(budget.router, prefix="/api/budget", tags=["Carbon Budget"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Green Code Intelligence"])
app.include_router(intelligence.router, prefix="/api", tags=["ML Prediction"])

# Mount static frontend dashboard
frontend_dir = os.path.join(PROJECT_ROOT, "frontend")
if os.path.exists(frontend_dir):
    app.mount("/dashboard", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/")
def root():
    return {
        "title": "Carbon Footprint Estimator API",
        "status": "online",
        "dashboard": "/dashboard/",
        "docs": "/docs",
        "default_region": settings.DEFAULT_REGION,
        "database": "mongodb" if is_mongo_connected() else "resilient-in-memory",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mongo_connected": is_mongo_connected(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
