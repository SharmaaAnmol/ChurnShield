"""
ChurnShield Predictor Service
Wraps the trained Scikit-Learn pipeline and handles real model inference.
"""

import os
import json
import warnings
from pathlib import Path
from typing import Optional, Dict, Any, List
import joblib
import pandas as pd

# Suppress minor version warning across cloud environments
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except ImportError:
    pass

from ..schemas import (
    CustomerInferenceRequest,
    PredictionResponse,
    PredictionExplanation,
    PredictionKeyDriver,
)

# Ordered feature columns strictly expected by the ColumnTransformer
EXPECTED_FEATURE_ORDER = [
    'order_count',
    'total_spend',
    'avg_order_value',
    'median_order_value',
    'order_value_std',
    'total_items',
    'avg_items_per_order',
    'total_freight',
    'distinct_products',
    'distinct_sellers',
    'orders_recent_90d',
    'spend_recent_90d',
    'freight_ratio',
    'recency_days',
    'tenure_days',
    'has_multiple_orders',
    'avg_inter_order_days',
    'std_inter_order_days',
    'order_ratio_recent_vs_earlier',
    'spend_ratio_recent_vs_earlier',
    'customer_state'
]

class ChurnShieldPredictor:
    def __init__(self, artifact_dir: Optional[Path] = None):
        if artifact_dir is None:
            env_artifact_dir = os.getenv("ARTIFACT_DIR")
            if env_artifact_dir:
                artifact_dir = Path(env_artifact_dir)
            else:
                artifact_dir = Path(__file__).resolve().parent.parent.parent / "artifacts"
        self.artifact_dir = artifact_dir
        self.pipeline = None
        self.metadata = {}
        self.schema = {}
        self._load_artifacts()

    def _load_artifacts(self):
        pipeline_path = self.artifact_dir / "churnshield_pipeline.joblib"
        # Fallback to root artifacts if not found
        if not pipeline_path.exists():
            fallback_path = Path(__file__).resolve().parent.parent.parent.parent / "artifacts" / "churnshield_model.joblib"
            if fallback_path.exists():
                pipeline_path = fallback_path

        if not pipeline_path.exists():
            raise FileNotFoundError(f"Trained pipeline not found at {pipeline_path}")

        self.pipeline = joblib.load(pipeline_path)

        meta_path = self.artifact_dir / "model_metadata.json"
        if meta_path.exists():
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)

        schema_path = self.artifact_dir / "feature_schema.json"
        if schema_path.exists():
            with open(schema_path, "r") as f:
                self.schema = json.load(f)

    @property
    def is_ready(self) -> bool:
        return self.pipeline is not None

    def predict(self, req: CustomerInferenceRequest) -> PredictionResponse:
        """
        Executes real inference on the trained Scikit-Learn pipeline.
        """
        if not self.is_ready:
            raise RuntimeError("ChurnShield inference pipeline is not loaded.")

        data_dict = req.model_dump()
        df = pd.DataFrame([data_dict])
        # Enforce exact column ordering
        df = df[EXPECTED_FEATURE_ORDER]

        # Model inference
        raw_pred = self.pipeline.predict(df)[0]
        probas = self.pipeline.predict_proba(df)[0]

        # Binary classes: [0, 1]
        # class 0 = inactive / no repeat
        # class 1 = repeat purchase in next 90 days
        predicted_class = int(raw_pred)
        p_repeat = float(probas[1])
        inactivity_risk = 1.0 - p_repeat

        # Risk tier definition
        if inactivity_risk >= 0.70:
            risk_tier = "high"
        elif inactivity_risk >= 0.40:
            risk_tier = "moderate"
        else:
            risk_tier = "low"

        # Construct readable prediction label
        if predicted_class == 1:
            prediction_label = "Predicted to repeat purchase within 90 days"
        else:
            prediction_label = "At risk of no repeat purchase within 90 days"

        # Generate contextual drivers
        key_drivers = self._analyze_drivers(req, p_repeat, inactivity_risk)

        if predicted_class == 1:
            summary = (
                f"The model estimates a {p_repeat:.1%} probability of repeat purchase within 90 days "
                f"(Inactivity risk: {inactivity_risk:.1%}). The customer exceeds the 50% decision threshold "
                f"driven by recent purchasing momentum."
            )
            retention_action = (
                "Enroll in VIP loyalty rewards program. Maintain regular product recommendations "
                "to capitalize on high repeat propensity without excessive margin discounts."
            )
        else:
            summary = (
                f"The model estimates a {inactivity_risk:.1%} risk of customer inactivity over the next 90 days "
                f"(Repeat purchase probability: {p_repeat:.1%}). Below the 50% threshold."
            )
            if risk_tier == "high":
                retention_action = (
                    "High Priority Action Tier: Trigger immediate win-back outreach (e.g. personalized voucher or "
                    "in-app promotion) within 7 days before complete customer disengagement."
                )
            else:
                retention_action = (
                    "Moderate Attention Tier: Include in scheduled marketing newsletters and monitor for further "
                    "recency deterioration."
                )

        explanation = PredictionExplanation(
            summary=summary,
            recommended_retention_action=retention_action,
            key_drivers=key_drivers
        )

        return PredictionResponse(
            predicted_class=predicted_class,
            prediction_label=prediction_label,
            repeat_purchase_probability=round(p_repeat, 4),
            inactivity_risk_score=round(inactivity_risk, 4),
            risk_tier=risk_tier,
            decision_threshold=0.5,
            model_name="Balanced Logistic Regression",
            features_received=data_dict,
            explanation=explanation
        )

    def _analyze_drivers(
        self,
        req: CustomerInferenceRequest,
        p_repeat: float,
        inactivity_risk: float
    ) -> List[PredictionKeyDriver]:
        drivers = []

        # 1. Recent Orders
        if req.orders_recent_90d > 0:
            drivers.append(PredictionKeyDriver(
                feature="orders_recent_90d",
                feature_label="Orders in Recent 90 Days",
                feature_value=req.orders_recent_90d,
                impact="positive_for_repeat",
                explanation=f"{req.orders_recent_90d} order(s) placed recently provides strong empirical repeat signal."
            ))
        else:
            drivers.append(PredictionKeyDriver(
                feature="orders_recent_90d",
                feature_label="Orders in Recent 90 Days",
                feature_value=0,
                impact="negative_for_repeat",
                explanation="Zero orders placed in recent 90 days heavily depresses repeat purchase likelihood."
            ))

        # 2. Recency
        if req.recency_days <= 30.0:
            drivers.append(PredictionKeyDriver(
                feature="recency_days",
                feature_label="Recency",
                feature_value=f"{req.recency_days:.1f} days",
                impact="positive_for_repeat",
                explanation=f"Very recent order ({req.recency_days:.0f} days ago) reflects fresh brand engagement."
            ))
        elif req.recency_days >= 120.0:
            drivers.append(PredictionKeyDriver(
                feature="recency_days",
                feature_label="Recency",
                feature_value=f"{req.recency_days:.1f} days",
                impact="negative_for_repeat",
                explanation=f"High elapsed time ({req.recency_days:.0f} days) since last transaction elevates inactivity risk."
            ))

        # 3. Spend ratio
        if req.spend_ratio_recent_vs_earlier >= 0.70:
            drivers.append(PredictionKeyDriver(
                feature="spend_ratio_recent_vs_earlier",
                feature_label="Spend Ratio (Recent vs Earlier)",
                feature_value=round(req.spend_ratio_recent_vs_earlier, 2),
                impact="positive_for_repeat",
                explanation="Customer spending momentum is weighted heavily toward the recent period."
            ))
        elif req.spend_ratio_recent_vs_earlier <= 0.10:
            drivers.append(PredictionKeyDriver(
                feature="spend_ratio_recent_vs_earlier",
                feature_label="Spend Ratio (Recent vs Earlier)",
                feature_value=round(req.spend_ratio_recent_vs_earlier, 2),
                impact="negative_for_repeat",
                explanation="Substantial drop in recent spend relative to earlier transaction history."
            ))

        # 4. Multi-order history
        if req.has_multiple_orders == 1 or req.order_count >= 2:
            drivers.append(PredictionKeyDriver(
                feature="order_count",
                feature_label="Multi-Order Buyer",
                feature_value=req.order_count,
                impact="positive_for_repeat",
                explanation=f"Customer has completed {req.order_count} lifetime orders (only ~2.3% of platform users do)."
            ))

        return drivers

# Singleton predictor instance
predictor = ChurnShieldPredictor()
