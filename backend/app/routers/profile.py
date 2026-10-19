"""Profiling router for multi-language code execution and historical reports."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
import datetime
import uuid

from backend.app.models.schemas import (
    ProfileRunRequest, ProfileRunResponse,
    FileProfileResult, MultiFileProfileResponse,
)
from backend.app.services.profiling_service import (
    run_script_from_content,
    get_profile_history,
    get_profile_run_by_id,
)

router = APIRouter()


@router.post("/run", response_model=ProfileRunResponse)
def run_profile(req: ProfileRunRequest):
    """Execute submitted code snippet across any language and return detailed energy and carbon profiling report."""
    try:
        report = run_script_from_content(
            script_content=req.scriptContent,
            region=req.region,
            project_id=req.projectId,
            language=req.language,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/file", response_model=ProfileRunResponse)
async def run_file_profile(
    file: UploadFile = File(...),
    region: Optional[str] = Form("Maharashtra"),
    projectId: Optional[str] = Form("default"),
    language: Optional[str] = Form("auto"),
):
    """Accept an uploaded script file of any language and run carbon footprint profiling."""
    try:
        content_bytes = await file.read()
        script_content = content_bytes.decode("utf-8", errors="replace")
        report = run_script_from_content(
            script_content=script_content,
            region=region,
            project_id=projectId,
            filename=file.filename,
            language=language,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")


@router.post("/multi", response_model=MultiFileProfileResponse)
async def run_multi_file_profile(
    files: List[UploadFile] = File(...),
    region: Optional[str] = Form("Maharashtra"),
    projectId: Optional[str] = Form("default"),
):
    """Accept multiple code files of any language (or folder contents) and profile each independently.

    Returns per-file language detection, hotspots, line stats, and a combined emissions total.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > 25:
        raise HTTPException(status_code=400, detail="Maximum 25 files per batch.")

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    results: List[FileProfileResult] = []
    total_emissions = 0.0
    success_count = 0

    for upload in files:
        fname = upload.filename or "unknown.txt"

        # Ignore hidden/system files (e.g., .DS_Store, .git)
        base_name = fname.split("/")[-1].split("\\")[-1]
        if base_name.startswith(".") and not base_name.endswith((".py", ".js", ".ts", ".c", ".cpp", ".java", ".go", ".rs", ".sh", ".ps1")):
            continue

        try:
            content_bytes = await upload.read()
            script_content = content_bytes.decode("utf-8", errors="replace")

            report = run_script_from_content(
                script_content=script_content,
                region=region,
                project_id=projectId,
                filename=fname,
            )

            file_result = FileProfileResult(
                filename=fname,
                status=report.get("status", "ok"),
                runId=report.get("runId", f"run-{uuid.uuid4().hex[:8]}"),
                language=report.get("language"),
                languageDisplay=report.get("languageDisplay"),
                metrics=report.get("metrics"),
                hotspots=report.get("hotspots", []),
                line_stats=report.get("line_stats", []),
                stdout=report.get("stdout", ""),
                stderr=report.get("stderr", ""),
            )
            total_emissions += report.get("metrics", {}).get("emissions_g_co2", 0.0)
            success_count += 1
            results.append(file_result)

        except Exception as e:
            results.append(FileProfileResult(
                filename=fname,
                status="error",
                runId=f"run-{uuid.uuid4().hex[:8]}",
                error=str(e),
            ))

    return MultiFileProfileResponse(
        status="ok",
        projectId=projectId,
        timestamp=timestamp,
        totalFiles=len(files),
        successCount=success_count,
        totalEmissionsG=round(total_emissions, 6),
        files=results,
    )


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
