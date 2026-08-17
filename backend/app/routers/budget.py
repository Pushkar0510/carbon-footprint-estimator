"""Carbon Budget management router."""
from fastapi import APIRouter
from backend.app.models.schemas import BudgetSetRequest, BudgetStatusResponse
from backend.app.services.budget_service import set_project_budget, get_budget_status

router = APIRouter()


@router.post("/set", response_model=BudgetStatusResponse)
def set_budget(req: BudgetSetRequest):
    """Set monthly carbon budget limit in grams of CO2 for a project."""
    res = set_project_budget(req.projectId, req.monthlyLimitGrams)
    return res


@router.get("/status/{projectId}", response_model=BudgetStatusResponse)
def get_budget(projectId: str):
    """Get current carbon budget utilization and threshold alerts for a project."""
    res = get_budget_status(projectId)
    return res
