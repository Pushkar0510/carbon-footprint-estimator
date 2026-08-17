"""India Grid Carbon Intensity Service."""
import json
import os
from typing import Dict, Any

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "india_grid.json")


def get_india_grid_data() -> Dict[str, Any]:
    """Load and return India grid intensity dataset."""
    if os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    return {
        "description": "Fallback India Carbon Intensity Data",
        "source": "CEA Default Factors",
        "unit": "g CO2 / kWh",
        "default_national_average": 710.0,
        "states": {
            "Maharashtra": 790.0,
            "Gujarat": 710.0,
            "Tamil Nadu": 650.0,
            "Karnataka": 580.0,
            "Delhi": 680.0,
        },
    }


def get_live_grid_factor(region: str) -> float:
    """Return live or cached grid factor for a given region."""
    grid_data = get_india_grid_data()
    states = grid_data.get("states", {})
    for st, factor in states.items():
        if st.lower() == region.strip().lower():
            return factor
    return grid_data.get("default_national_average", 710.0)
