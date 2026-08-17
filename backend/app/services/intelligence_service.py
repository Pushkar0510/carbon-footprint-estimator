"""Intelligence & Green Code Service."""
from typing import Dict, Any, List, Optional
from engine.advisor import analyze_code_ast
from engine.ml_predictor import predict_emissions
from backend.app.services.grid_service import get_live_grid_factor


def get_green_code_recommendations(code_snippet: str) -> List[Dict[str, Any]]:
    """Perform AST analysis on source code snippet to generate optimization recommendations."""
    return analyze_code_ast(code_snippet)


def predict_code_emissions(
    code_snippet: str,
    expected_input_size: int = 1000,
    region: Optional[str] = "Maharashtra",
) -> Dict[str, Any]:
    """Use ML AST predictor to estimate execution time, energy, and carbon before execution."""
    grid_intensity = get_live_grid_factor(region or "Maharashtra")
    return predict_emissions(
        code_snippet=code_snippet,
        expected_input_size=expected_input_size,
        grid_intensity_g_per_kwh=grid_intensity,
    )
