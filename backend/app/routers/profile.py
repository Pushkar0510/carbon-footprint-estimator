"""Profiling router for Python code execution and historical reports."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from backend.app.models.schemas import ProfileRunRequest, ProfileRunResponse
from backend.app.services.profiling_service import (
    run_script_from_content,
    get_profile_history,
    get_profile_run_by_id,
)

router = APIRouter()


@router.post("/run", response_model=ProfileRunResponse)
def run_profile(req: ProfileRunRequest):
    """Execute submitted Python code snippet and return detailed energy and carbon profiling report."""
    try:
        report = run_script_from_content(
            script_content=req.scriptContent,
            region=req.region,
            project_id=req.projectId,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/file", response_model=ProfileRunResponse)
async def run_file_profile(
    file: UploadFile = File(...),
    region: Optional[str] = Form("Maharashtra"),
    projectId: Optional[str] = Form("default"),
):
    """Accept an uploaded Python script file and run carbon footprint profiling."""
    try:
        content_bytes = await file.read()
        script_content = content_bytes.decode("utf-8")
        report = run_script_from_content(
            script_content=script_content,
            region=region,
            project_id=projectId,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")


@router.get("/history/{projectId}")
def get_history(projectId: str):
    """Get history of carbon profiling runs for a specific project ID."""
    history = get_profile_history(projectId)
    return {"projectId": projectId, "runs": history, "count": len(history)}


@router.get("/run/{runId}")
def get_run_details(runId: str):
    """Get detailed carbon footprint profiling report for a specific run ID."""
    run = get_profile_run_by_id(runId)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run with ID '{runId}' not found.")
    return run
