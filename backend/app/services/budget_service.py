"""Carbon Budget Monitoring Service with MongoDB persistence and resilient memory cache."""
import asyncio
from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.db.mongodb import db_set_budget, db_record_emissions, db_get_budget

# In-memory fast cache for project carbon budgets and cumulative usage
_BUDGET_LIMITS: Dict[str, float] = {settings.DEFAULT_PROJECT_ID: settings.DEFAULT_CARBON_BUDGET_G}
_BUDGET_USAGE: Dict[str, float] = {settings.DEFAULT_PROJECT_ID: 0.0}


def set_project_budget(project_id: str, monthly_limit_grams: float, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Set or update the monthly carbon budget limit for a project."""
    _BUDGET_LIMITS[project_id] = float(monthly_limit_grams)
    if project_id not in _BUDGET_USAGE:
        _BUDGET_USAGE[project_id] = 0.0

    # Fire-and-forget DB update if event loop is running
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(db_set_budget(project_id, monthly_limit_grams, user_id=user_id))
    except Exception:
        pass

    return get_budget_status(project_id)


def record_project_emissions(project_id: str, emissions_g: float) -> None:
    """Add emissions to a project's cumulative monthly usage and sync to DB."""
    current = _BUDGET_USAGE.get(project_id, 0.0)
    _BUDGET_USAGE[project_id] = current + max(0.0, emissions_g)

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(db_record_emissions(project_id, emissions_g))
    except Exception:
        pass


def get_budget_status(project_id: str) -> Dict[str, Any]:
    """Get current usage, limit, percentage, and budget status for a project."""
    limit = _BUDGET_LIMITS.get(project_id, settings.DEFAULT_CARBON_BUDGET_G)
    used = _BUDGET_USAGE.get(project_id, 0.0)

    percent = (used / limit) * 100.0 if limit > 0 else 0.0

    if percent >= 100.0:
        status_text = "Budget Exceeded"
    elif percent >= 75.0:
        status_text = "Near Limit Warning"
    else:
        status_text = "Within Budget"

    return {
        "projectId": project_id,
        "monthlyLimitGrams": round(limit, 2),
        "usedGrams": round(used, 4),
        "usagePercent": round(percent, 2),
        "status": status_text,
        "warningTriggered": percent >= 75.0,
    }
