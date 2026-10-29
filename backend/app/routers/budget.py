from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from backend.app.models.schemas import BudgetSetRequest, BudgetStatusResponse
from backend.app.services.budget_service import set_project_budget, get_budget_status
from backend.app.services.auth_service import get_optional_current_user

router = APIRouter()


@router.post("/set", response_model=BudgetStatusResponse)
def set_budget(
    req: BudgetSetRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """Set monthly carbon budget limit in grams of CO2 for a project."""
    user_id = current_user.get("user_id") if current_user else None
    res = set_project_budget(req.projectId, req.monthlyLimitGrams, user_id=user_id)
    return res


@router.get("/status/{projectId}", response_model=BudgetStatusResponse)
def get_budget(
    projectId: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """Get current carbon budget utilization and threshold alerts for a project."""
    res = get_budget_status(projectId)
    return res

