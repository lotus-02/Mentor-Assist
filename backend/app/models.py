from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class StudentRecord(BaseModel):
    id: Optional[str] = Field(None, description="Optional unique identifier for student")
    school: str = Field("GP", description="School code: 'GP' (Gabriel Pereira) or 'MS' (Mousinho da Silveira)")
    sex: str = Field("F", description="Gender: 'F' (female) or 'M' (male)")
    age: int = Field(17, ge=15, le=22, description="Student age (15 to 22)")
    address: str = Field("U", description="Home address: 'U' (urban) or 'R' (rural)")
    famsize: str = Field("GT3", description="Family size: 'LE3' (<=3) or 'GT3' (>3)")
    Pstatus: str = Field("T", description="Parent status: 'T' (together) or 'A' (apart)")
    Medu: int = Field(2, ge=0, le=4, description="Mother education (0: none to 4: higher education)")
    Fedu: int = Field(2, ge=0, le=4, description="Father education (0: none to 4: higher education)")
    Mjob: str = Field("other", description="Mother job")
    Fjob: str = Field("other", description="Father job")
    reason: str = Field("course", description="Reason for school choice")
    guardian: str = Field("mother", description="Student guardian")
    traveltime: int = Field(1, ge=1, le=4, description="Travel time to school (1: <15m, 4: >1h)")
    studytime: int = Field(2, ge=1, le=4, description="Weekly study time (1: <2h to 4: >10h)")
    failures: int = Field(0, ge=0, le=4, description="Number of past class failures")
    schoolsup: str = Field("no", description="Extra educational support: 'yes' or 'no'")
    famsup: str = Field("no", description="Family educational support: 'yes' or 'no'")
    paid: str = Field("no", description="Extra paid classes: 'yes' or 'no'")
    activities: str = Field("no", description="Extra-curricular activities: 'yes' or 'no'")
    nursery: str = Field("yes", description="Attended nursery school: 'yes' or 'no'")
    higher: str = Field("yes", description="Wants to take higher education: 'yes' or 'no'")
    internet: str = Field("yes", description="Internet access at home: 'yes' or 'no'")
    romantic: str = Field("no", description="In a romantic relationship: 'yes' or 'no'")
    famrel: int = Field(4, ge=1, le=5, description="Quality of family relationships (1 to 5)")
    freetime: int = Field(3, ge=1, le=5, description="Free time after school (1 to 5)")
    goout: int = Field(3, ge=1, le=5, description="Going out with friends (1 to 5)")
    Dalc: int = Field(1, ge=1, le=5, description="Workday alcohol consumption (1 to 5)")
    Walc: int = Field(1, ge=1, le=5, description="Weekend alcohol consumption (1 to 5)")
    health: int = Field(3, ge=1, le=5, description="Current health status (1 to 5)")
    absences: int = Field(4, ge=0, le=93, description="Number of school absences")
    G1: int = Field(10, ge=0, le=20, description="First period grade (0 to 20)")
    G2: int = Field(10, ge=0, le=20, description="Second period grade (0 to 20)")
    # Note: G3 is explicitly absent from input features to enforce ZERO leakage

class BatchPredictRequest(BaseModel):
    students: List[StudentRecord]
    budget_pct: Optional[float] = Field(0.20, ge=0.05, le=0.50, description="Intervention budget fraction (default 20%)")
    fairness_weight: Optional[float] = Field(1.0, ge=0.0, le=2.0, description="Fairness optimizer adjustment multiplier")

class RankedStudent(BaseModel):
    rank: int
    id: str
    school: str
    sex: str
    age: int
    G1: int
    G2: int
    grade_velocity: int
    risk_index: float
    effort_ratio: float
    calibrated_risk_prob: float
    pofr_score: float
    selected_for_support: bool
    priority_order: Optional[str] = "Later"
    priority_tier: Optional[str] = "Priority 3 (Later - Routine Monitoring)"
    risk_tier: str
    demographic_tags: Dict[str, str]

class DimensionScore(BaseModel):
    dimension_name: str
    earned_pts: float
    max_pts: float
    metric_value: float
    metric_label: str
    description: str

class EvaluateResponse(BaseModel):
    total_score: float
    overall_recall: float
    worst_group_recall: float
    fairness_gap: float
    brier_score: float
    dimensions: List[DimensionScore]
    recalls_by_group: Dict[str, float]
    group_counts: Dict[str, Dict[str, int]]
    budget_count: int
    total_students: int
    positive_count: int
    model_type: str

class ModelComparisonItem(BaseModel):
    metric_name: str
    base_model: float
    pofr_model: float
    delta: float
    unit: str
    impact: str

class ModelCompareResponse(BaseModel):
    base_eval: EvaluateResponse
    pofr_eval: EvaluateResponse
    comparisons: List[ModelComparisonItem]
    summary: str

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    readable_name: str
    category: str

class ModelInfoResponse(BaseModel):
    name: str
    base_classifier: str
    calibration_method: str
    budget_policy: str
    fairness_objective: str
    total_benchmark_score: float
    features: List[str]
    feature_importances: List[FeatureImportanceItem]
    calibration_curve: Dict[str, List[float]]
    compliance_audit: Dict[str, Any]

class SimulationRequest(BaseModel):
    student: StudentRecord
    modified_studytime: Optional[int] = None
    modified_absences: Optional[int] = None
    modified_G2: Optional[int] = None

class SimulationResponse(BaseModel):
    original_risk: float
    original_pofr_score: float
    simulated_risk: float
    simulated_pofr_score: float
    risk_change_pct: float
    status_change: str
    actionable_recommendations: List[str]
