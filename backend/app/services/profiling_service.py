"""Profiling service connecting FastAPI router to engine components across all languages."""
import tempfile
import os
import uuid
import datetime
from typing import Dict, Any, List, Optional

from engine.executor import run_script
from engine.advisor import analyze_code_ast
from engine.line_attribution import attribute_code_lines
from engine.language_support import (
    detect_language,
    get_default_extension,
    get_language_name,
)
from backend.app.config import settings
from backend.app.services.budget_service import record_project_emissions

# In-memory storage for historical profiling runs
_RUN_HISTORY: List[Dict[str, Any]] = []


def run_script_from_content(
    script_content: str,
    region: Optional[str] = None,
    project_id: Optional[str] = None,
    timeout: Optional[int] = None,
    filename: Optional[str] = None,
    language: Optional[str] = None,
) -> Dict[str, Any]:
    """Write script content to temp file, execute & profile, record budget, and store historical report."""
    effective_region = region or settings.DEFAULT_REGION
    effective_project_id = project_id or settings.DEFAULT_PROJECT_ID
    effective_timeout = timeout or settings.EXECUTION_TIMEOUT_SECONDS

    # Detect language
    detected_lang = detect_language(code=script_content, filename=filename or "", explicit_lang=language)
    ext = get_default_extension(detected_lang)
    if filename and os.path.splitext(filename)[1]:
        ext = os.path.splitext(filename)[1]

    # Create temporary file with appropriate extension
    # If filename is specified, keep base name prefix for Java / class matching
    base_prefix = "cfe_script_"
    if filename:
        raw_base = os.path.splitext(os.path.basename(filename))[0]
        if raw_base:
            base_prefix = f"cfe_{raw_base}_"

    temp_dir = tempfile.mkdtemp(prefix="cfe_dir_")
    path = os.path.join(temp_dir, f"{base_prefix}{uuid.uuid4().hex[:6]}{ext}")

    run_id = f"run-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(script_content)

        # Execute script via multi-language subprocess executor
        exec_result = run_script(path, region=effective_region, timeout=effective_timeout, language=detected_lang)

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

        emissions_g = metrics.get("emissions_g_co2", 0.0)
        exec_time_s = metrics.get("execution_time_s", 0.05)

        # Run line-level and function-level attribution across any language
        try:
            line_attr = attribute_code_lines(
                script_content,
                total_emissions_g=emissions_g,
                language=detected_lang,
                execution_time_s=exec_time_s,
            )
        except Exception as e:
            line_attr = {
                "status": "error",
                "function_hotspots": [],
                "line_stats": [],
                "stdout": "",
                "stderr": str(e),
            }

        hotspots = line_attr.get("function_hotspots", [])
        display_fname = filename or f"script{ext}"
        if not hotspots:
            hotspots.append({
                "function": "main_execution",
                "filename": display_fname,
                "lineno": 1,
                "ncalls": 1,
                "cumtime_s": exec_time_s,
                "contribution_pct": 100.0,
                "attributed_co2_g": emissions_g,
                "is_hotspot": True,
            })

        line_stats = line_attr.get("line_stats", [])

        if effective_project_id and emissions_g > 0:
            record_project_emissions(effective_project_id, emissions_g)

        stdout = exec_result.get("stdout", "") or line_attr.get("stdout", "")
        stderr = exec_result.get("stderr", "") or line_attr.get("stderr", "")

        report = {
            "status": "ok" if exec_result.get("returncode") == 0 else "error",
            "runId": run_id,
            "projectId": effective_project_id,
            "timestamp": timestamp,
            "language": detected_lang,
            "languageDisplay": get_language_name(detected_lang),
            "filename": display_fname,
            "metrics": metrics,
            "hotspots": hotspots,
            "line_stats": line_stats,
            "stdout": stdout,
            "stderr": stderr,
        }

        _RUN_HISTORY.insert(0, report)
        return report

    finally:
        try:
            if os.path.exists(path):
                os.remove(path)
            if os.path.exists(temp_dir):
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
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
