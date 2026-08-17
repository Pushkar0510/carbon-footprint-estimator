"""Profiling service connecting FastAPI router to engine components."""
import tempfile
import os
import uuid
import datetime
from typing import Dict, Any, List, Optional

from engine.executor import run_script
from engine.advisor import analyze_code_ast
from backend.app.config import settings
from backend.app.services.budget_service import record_project_emissions

# In-memory storage for historical profiling runs
_RUN_HISTORY: List[Dict[str, Any]] = []


def run_script_from_content(
    script_content: str,
    region: Optional[str] = None,
    project_id: Optional[str] = None,
    timeout: Optional[int] = None,
) -> Dict[str, Any]:
    """Write script content to temp file, execute & profile, record budget, and store historical report."""
    effective_region = region or settings.DEFAULT_REGION
    effective_project_id = project_id or settings.DEFAULT_PROJECT_ID
    effective_timeout = timeout or settings.EXECUTION_TIMEOUT_SECONDS

    fd, path = tempfile.mkstemp(prefix="cfe_script_", suffix=".py")
    os.close(fd)

    run_id = f"run-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(script_content)

        # Execute script via subprocess executor
        exec_result = run_script(path, region=effective_region, timeout=effective_timeout)

        metrics = exec_result.get("metrics", {})
        if not metrics:
            metrics = {
                "execution_time_s": exec_result.get("elapsed_s", 0.0),
                "cpu_percent": 0.0,
                "memory_rss_mb": 0.0,
                "power_watts": 0.0,
                "energy_wh": 0.0,
                "energy_kwh": 0.0,
                "grid_intensity_g_per_kwh": 710.0,
                "emissions_g_co2": 0.0,
                "emissions_mg_co2": 0.0,
                "equivalencies": {"smartphone_charges": 0.0, "car_meters_driven": 0.0},
            }

        hotspots = []
        emissions_g = metrics.get("emissions_g_co2", 0.0)

        hotspots.append({
            "function": "main_execution",
            "filename": "script.py",
            "lineno": 1,
            "ncalls": 1,
            "cumtime_s": metrics.get("execution_time_s", 0.0),
            "contribution_pct": 100.0,
            "attributed_co2_g": emissions_g,
            "is_hotspot": True,
        })

        if effective_project_id and emissions_g > 0:
            record_project_emissions(effective_project_id, emissions_g)

        report = {
            "status": "ok" if exec_result.get("returncode") == 0 else "error",
            "runId": run_id,
            "projectId": effective_project_id,
            "timestamp": timestamp,
            "metrics": metrics,
            "hotspots": hotspots,
            "stdout": exec_result.get("stdout", ""),
            "stderr": exec_result.get("stderr", ""),
        }

        _RUN_HISTORY.insert(0, report)
        return report

    finally:
        try:
            os.remove(path)
        except OSError:
            pass


def get_profile_history(project_id: str) -> List[Dict[str, Any]]:
    """Return historical profile runs for a project."""
    return [run for run in _RUN_HISTORY if run.get("projectId") == project_id]


def get_profile_run_by_id(run_id: str) -> Optional[Dict[str, Any]]:
    """Return detailed profiling report for a specific run ID."""
    for run in _RUN_HISTORY:
        if run.get("runId") == run_id:
            return run
    return None
