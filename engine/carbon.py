"""Carbon emissions calculation module.

Translates energy usage (kWh) into CO2 carbon emissions (grams)
using regional/state electricity grid carbon intensity values.
"""
import json
import os
from typing import Dict, Optional

# Default fallbacks
DEFAULT_GRID_INTENSITY_G_PER_KWH = 710.0  # India national average fallback


def load_india_grid_data(filepath: Optional[str] = None) -> Dict[str, float]:
    """Load India state-wise carbon intensity dataset."""
    if filepath is None:
        # Default path relative to project root
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "data", "india_grid.json")

    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("states", {})
        except Exception:
            pass
    return {}


def get_grid_intensity(region: Optional[str] = None, dataset_path: Optional[str] = None) -> float:
    """Retrieve grid intensity factor (g CO2/kWh) for a given region/state."""
    if not region:
        return DEFAULT_GRID_INTENSITY_G_PER_KWH

    states = load_india_grid_data(dataset_path)
    # Search exact match or case-insensitive match
    for state_name, factor in states.items():
        if state_name.lower() == region.strip().lower():
            return factor

    return DEFAULT_GRID_INTENSITY_G_PER_KWH


def calculate_emissions(energy_kwh: float, grid_intensity_g_per_kwh: float) -> dict:
    """Calculate carbon emissions in grams and milligrams of CO2."""
    emissions_g = energy_kwh * grid_intensity_g_per_kwh
    emissions_mg = emissions_g * 1000.0

    # Equivalencies for user perspective
    # Smartphone full charge ~ 8.22g CO2
    # Car km ~ 120g CO2
    # Tree absorption per day ~ 60g CO2
    smartphone_charges = emissions_g / 8.22 if emissions_g > 0 else 0.0
    km_car = emissions_g / 120.0 if emissions_g > 0 else 0.0

    return {
        "grid_intensity_g_per_kwh": grid_intensity_g_per_kwh,
        "emissions_g_co2": round(emissions_g, 6),
        "emissions_mg_co2": round(emissions_mg, 3),
        "equivalencies": {
            "smartphone_charges": round(smartphone_charges, 4),
            "car_meters_driven": round(km_car * 1000, 2),
        },
    }
