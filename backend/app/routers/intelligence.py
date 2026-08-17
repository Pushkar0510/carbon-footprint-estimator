"""Intelligence, AST Green Advisor, and ML Prediction router."""
from fastapi import APIRouter
from backend.app.models.schemas import (
    IntelligenceRequest,
    IntelligenceResponse,
    PredictEmissionRequest,
    PredictEmissionResponse,
)
from backend.app.services.intelligence_service import (
    get_green_code_recommendations,
    predict_code_emissions,
)

router = APIRouter()


@router.post("/recommend", response_model=IntelligenceResponse)
def get_recommendations(req: IntelligenceRequest):
    """Statically analyze Python source code AST and return green code optimization advice."""
    recs = get_green_code_recommendations(req.codeSnippet)
    return {"recommendations": recs, "count": len(recs)}


@router.post("/predict/emission", response_model=PredictEmissionResponse)
def predict_emission(req: PredictEmissionRequest):
    """Predict execution runtime, energy, and emissions using AST features before execution."""
    res = predict_code_emissions(
        code_snippet=req.codeSnippet,
        expected_input_size=req.expectedInputSize or 1000,
        region=req.region,
    )
    return res
