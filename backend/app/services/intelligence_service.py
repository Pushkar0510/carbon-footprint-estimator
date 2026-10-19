"""Intelligence & Green Code Service across all languages."""
from typing import Dict, Any, List, Optional
from engine.advisor import analyze_code_ast
from engine.ml_predictor import predict_emissions
from backend.app.services.grid_service import get_live_grid_factor


def get_green_code_recommendations(code_snippet: str, language: Optional[str] = "auto") -> List[Dict[str, Any]]:
    """Perform AST / pattern analysis on source code snippet across any language to generate recommendations."""
    return analyze_code_ast(code_snippet, language=language)


def predict_code_emissions(
    code_snippet: str,
    expected_input_size: int = 1000,
    region: Optional[str] = "Maharashtra",
    language: Optional[str] = "auto",
) -> Dict[str, Any]:
    """Use ML structural predictor to estimate execution time, energy, and carbon before execution."""
    grid_intensity = get_live_grid_factor(region or "Maharashtra")
    return predict_emissions(
        code_snippet=code_snippet,
        expected_input_size=expected_input_size,
        grid_intensity_g_per_kwh=grid_intensity,
    )
