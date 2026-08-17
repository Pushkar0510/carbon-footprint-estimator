"""India Grid Carbon Intensity router."""
from fastapi import APIRouter
from backend.app.services.grid_service import get_india_grid_data, get_live_grid_factor

router = APIRouter()


@router.get("/india/states")
def get_india_states_grid():
    """Get state-wise electricity grid carbon intensity data for India."""
    return get_india_grid_data()


@router.get("/india/live")
def get_live_state_factor(region: str = "Maharashtra"):
    """Get carbon intensity factor (g CO2/kWh) for a given Indian state."""
    factor = get_live_grid_factor(region)
    return {
        "region": region,
        "grid_intensity_g_per_kwh": factor,
        "unit": "g CO2 / kWh",
    }
