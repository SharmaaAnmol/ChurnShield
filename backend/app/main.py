"""
ChurnShield FastAPI Application
Serves real machine-learning inference for non-contractual e-commerce customer inactivity prediction.
"""

import os
import logging
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .schemas import (
    CustomerInferenceRequest,
    PredictionResponse,
    HealthResponse,
    ModelInfoResponse,
)
from .services.predictor import predictor, EXPECTED_FEATURE_ORDER

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("churnshield-api")

app = FastAPI(
    title="ChurnShield ML Inference API",
    description="Real-time Scikit-Learn inference service for customer inactivity prediction",
    version="1.0.0",
)

# CORS configuration
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173"
)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field_loc = " -> ".join([str(l) for l in err.get("loc", []) if l != "body"])
        errors.append({
            "field": field_loc,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "One or more input feature fields failed validation.",
            "details": errors,
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An error occurred during model prediction. Please verify inputs.",
        },
    )

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Check backend service health and model readiness.
    """
    return HealthResponse(
        status="healthy",
        model_loaded=predictor.is_ready,
        model_type="Balanced Logistic Regression",
        version="1.0.0",
    )

@app.get("/api/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Returns verified model identity, target semantics, and evaluation metrics.
    """
    meta = predictor.metadata
    champ = meta.get("champion_model", {})
    return ModelInfoResponse(
        model_name=champ.get("model_type", "Balanced Logistic Regression"),
        version=meta.get("project_version", "1.0.0"),
        target_variable=meta.get("target_variable", "repeat_purchase_next_90d"),
        target_definition=meta.get(
            "target_definition",
            "Binary indicator: 1 if customer places at least one qualifying order in [T, T + 90d), 0 otherwise."
        ),
        positive_class="1: Repeat purchase within next 90 days",
        negative_class="0: Inactive / No repeat purchase within next 90 days",
        inactivity_formula="inactivity_risk_score = 1.0 - repeat_purchase_probability",
        decision_threshold=0.5,
        primary_selection_metric=champ.get("primary_selection_metric", "Average Precision (PR-AUC)"),
        validation_pr_auc=champ.get("validation_cohort_pr_auc", 0.0112),
        test_pr_auc=champ.get("test_cohort_pr_auc", 0.0117),
        pr_auc_lift_over_dummy=champ.get("test_pr_auc_lift_over_dummy", 1.7),
        features_count=len(EXPECTED_FEATURE_ORDER),
        features_order=EXPECTED_FEATURE_ORDER,
    )

@app.get("/api/model-schema")
async def get_model_schema():
    """
    Returns the complete input feature schema, constraints, groups, and empirical preset profiles.
    """
    if not predictor.schema:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model feature schema is currently unavailable."
        )
    return predictor.schema

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_customer(payload: CustomerInferenceRequest):
    """
    Executes actual model inference for a customer feature record.
    """
    try:
        result = predictor.predict(payload)
        return result
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference failed. Ensure feature values are within valid operational ranges."
        )
