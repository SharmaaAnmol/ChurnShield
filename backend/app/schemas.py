"""
ChurnShield API — Pydantic Request & Response Schemas
Validates feature inputs, enforces strict types, and formats model responses.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator

VALID_BRAZILIAN_STATES = {
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG',
    'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR',
    'RS', 'SC', 'SE', 'SP', 'TO'
}

class CustomerInferenceRequest(BaseModel):
    """
    Input feature vector matching the 21 engineered features expected by
    the trained ChurnShield Scikit-Learn Pipeline.
    """
    # Recent 90-day activity
    recency_days: float = Field(
        ...,
        ge=0.0,
        le=365.0,
        description="Calendar days elapsed since the customer's most recent order (max 180d in lookback window)."
    )
    orders_recent_90d: int = Field(
        ...,
        ge=0,
        le=50,
        description="Count of orders placed during the immediate 90-day observation window."
    )
    spend_recent_90d: float = Field(
        ...,
        ge=0.0,
        le=50000.0,
        description="Gross spend during the immediate 90-day observation window."
    )
    spend_ratio_recent_vs_earlier: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Proportion of lifetime spend that occurred within recent 90 days vs earlier (0.0 to 1.0)."
    )
    order_ratio_recent_vs_earlier: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Proportion of lifetime orders placed within recent 90 days vs earlier (0.0 to 1.0)."
    )

    # Order Cadence & Frequency
    order_count: int = Field(
        ...,
        ge=1,
        le=50,
        description="Total lifetime orders placed by the customer within the 180-day lookback window."
    )
    has_multiple_orders: int = Field(
        ...,
        ge=0,
        le=1,
        description="Binary flag: 1 if total order count >= 2, 0 otherwise."
    )
    total_items: int = Field(
        ...,
        ge=1,
        le=100,
        description="Total quantity of physical items purchased across all orders."
    )
    avg_items_per_order: float = Field(
        ...,
        ge=1.0,
        le=50.0,
        description="Average merchandise items per order."
    )
    distinct_products: int = Field(
        ...,
        ge=1,
        le=50,
        description="Number of distinct product catalog items (SKUs) ordered."
    )
    tenure_days: float = Field(
        ...,
        ge=0.0,
        le=365.0,
        description="Calendar days elapsed since customer's first recorded order in lookback window."
    )
    avg_inter_order_days: float = Field(
        ...,
        ge=0.0,
        le=365.0,
        description="Average days elapsed between consecutive orders (180.0 for single-order buyers)."
    )
    std_inter_order_days: float = Field(
        ...,
        ge=0.0,
        le=180.0,
        description="Standard deviation of inter-order intervals (0.0 for buyers with <3 orders)."
    )

    # Spend & Basket Economics
    total_spend: float = Field(
        ...,
        gt=0.0,
        le=100000.0,
        description="Total lifetime gross expenditure in Brazilian Reais (R$)."
    )
    avg_order_value: float = Field(
        ...,
        gt=0.0,
        le=50000.0,
        description="Mean order value across all customer orders (R$)."
    )
    median_order_value: float = Field(
        ...,
        gt=0.0,
        le=50000.0,
        description="Median order value across all customer orders (R$)."
    )
    order_value_std: float = Field(
        ...,
        ge=0.0,
        le=20000.0,
        description="Standard deviation of order values (0.0 for single-order buyers)."
    )
    total_freight: float = Field(
        ...,
        ge=0.0,
        le=10000.0,
        description="Cumulative freight/shipping charges paid across all orders (R$)."
    )
    freight_ratio: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Ratio of freight charges to total spend (0.0 to 1.0)."
    )

    # Geography & Logistics
    customer_state: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="2-letter Brazilian state code (e.g. 'SP', 'RJ', 'MG')."
    )
    distinct_sellers: int = Field(
        ...,
        ge=1,
        le=30,
        description="Number of distinct marketplace sellers the customer purchased from."
    )

    @field_validator('customer_state')
    @classmethod
    def validate_state(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in VALID_BRAZILIAN_STATES:
            raise ValueError(
                f"Invalid customer_state '{v}'. Must be one of the 27 Brazilian states: "
                f"{', '.join(sorted(VALID_BRAZILIAN_STATES))}"
            )
        return v_upper

    model_config = {
        "json_schema_extra": {
            "example": {
                "order_count": 2,
                "total_spend": 240.50,
                "avg_order_value": 120.25,
                "median_order_value": 120.25,
                "order_value_std": 10.50,
                "total_items": 3,
                "avg_items_per_order": 1.5,
                "total_freight": 32.0,
                "distinct_products": 2,
                "distinct_sellers": 2,
                "orders_recent_90d": 1,
                "spend_recent_90d": 130.0,
                "freight_ratio": 0.133,
                "recency_days": 28.0,
                "tenure_days": 110.0,
                "has_multiple_orders": 1,
                "avg_inter_order_days": 82.0,
                "std_inter_order_days": 0.0,
                "order_ratio_recent_vs_earlier": 0.5,
                "spend_ratio_recent_vs_earlier": 0.54,
                "customer_state": "SP"
            }
        }
    }


class PredictionKeyDriver(BaseModel):
    feature: str
    feature_label: str
    feature_value: Any
    impact: str  # 'positive_for_repeat' | 'negative_for_repeat' | 'neutral'
    explanation: str


class PredictionExplanation(BaseModel):
    summary: str
    recommended_retention_action: str
    key_drivers: List[PredictionKeyDriver]


class PredictionResponse(BaseModel):
    """
    Standardized inference response from the trained Scikit-Learn pipeline.
    """
    predicted_class: int = Field(
        ...,
        description="0 = Inactive / no repeat purchase in next 90 days, 1 = Repeat purchase in next 90 days"
    )
    prediction_label: str = Field(
        ...,
        description="Human-readable prediction statement."
    )
    repeat_purchase_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Estimated probability P(repeat_purchase_next_90d == 1) from the classifier."
    )
    inactivity_risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Calculated as 1.0 - repeat_purchase_probability."
    )
    risk_tier: str = Field(
        ...,
        description="'high' (>=0.70), 'moderate' (0.40 - 0.69), or 'low' (<0.40)."
    )
    decision_threshold: float = Field(
        default=0.5,
        description="Classifier probability cutoff used for predict()."
    )
    model_name: str = Field(
        default="Balanced Logistic Regression",
        description="Trained classifier pipeline algorithm."
    )
    features_received: Dict[str, Any] = Field(
        ...,
        description="Echo of the 21 validated model input feature values."
    )
    explanation: PredictionExplanation = Field(
        ...,
        description="Contextual interpretation of the prediction."
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_type: str
    version: str


class ModelInfoResponse(BaseModel):
    model_name: str
    version: str
    target_variable: str
    target_definition: str
    positive_class: str
    negative_class: str
    inactivity_formula: str
    decision_threshold: float
    primary_selection_metric: str
    validation_pr_auc: float
    test_pr_auc: float
    pr_auc_lift_over_dummy: float
    features_count: int
    features_order: List[str]
