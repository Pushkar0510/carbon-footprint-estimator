"""Pydantic schemas for Carbon Footprint Estimator API."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ProfileRunRequest(BaseModel):
    scriptContent: str = Field(..., description="Python source code to execute and profile")
    region: Optional[str] = Field("Maharashtra", description="Indian state or region for carbon grid factor")
    projectId: Optional[str] = Field("default", description="Associated project identifier")


class HotspotItem(BaseModel):
    function: str
    filename: str
    lineno: int
    ncalls: int
    cumtime_s: float
    contribution_pct: float
    attributed_co2_g: float
    is_hotspot: bool


class LineStatItem(BaseModel):
    lineno: int
    content: str
    hits: int
    time_s: float
    share_pct: float
    attributed_co2_g: float
    is_hotspot: bool


class MetricsItem(BaseModel):
    execution_time_s: float
    cpu_percent: float
    memory_rss_mb: float
    power_watts: float
    energy_wh: float
    energy_kwh: float
    grid_intensity_g_per_kwh: float
    emissions_g_co2: float
    emissions_mg_co2: float
    equivalencies: Dict[str, float]


class ProfileRunResponse(BaseModel):
    status: str = "ok"
    runId: str
    projectId: str
    timestamp: str
    metrics: MetricsItem
    hotspots: List[HotspotItem]
    line_stats: Optional[List[LineStatItem]] = []
    stdout: Optional[str] = ""
    stderr: Optional[str] = ""


class StateGridItem(BaseModel):
    state: str
    grid_intensity_g_per_kwh: float


class IndiaGridResponse(BaseModel):
    unit: str
    source: str
    default_national_average: float
    states: Dict[str, float]


class BudgetSetRequest(BaseModel):
    projectId: str
    monthlyLimitGrams: float = Field(..., gt=0.0, description="Monthly carbon limit in grams of CO2")


class BudgetStatusResponse(BaseModel):
    projectId: str
    monthlyLimitGrams: float
    usedGrams: float
    usagePercent: float
    status: str
    warningTriggered: bool


class IntelligenceRequest(BaseModel):
    codeSnippet: str = Field(..., description="Python code to analyze statically for green practices")


class RecommendationItem(BaseModel):
    line: int
    pattern: str
    severity: str
    recommendation: str
    reason: str


class IntelligenceResponse(BaseModel):
    recommendations: List[RecommendationItem]
    count: int


class PredictEmissionRequest(BaseModel):
    codeSnippet: str = Field(..., description="Python code snippet to predict emissions for")
    expectedInputSize: Optional[int] = Field(1000, description="Estimated input size N")
    region: Optional[str] = Field("Maharashtra", description="Target region for carbon calculation")


class PredictEmissionResponse(BaseModel):
    predicted_time_s: float
    predicted_energy_kwh: float
    predicted_emissions_g_co2: float
    confidence_score: float
    complexity_class: str
    features: Dict[str, float]
