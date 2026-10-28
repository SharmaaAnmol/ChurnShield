"""
ChurnShield Backend Test Suite
Verifies model artifact loading, schema endpoints, inference calculations, and validation rules.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_ACTIVE_PAYLOAD = {
    "order_count": 3,
    "total_spend": 380.0,
    "avg_order_value": 126.67,
    "median_order_value": 125.0,
    "order_value_std": 18.0,
    "total_items": 4,
    "avg_items_per_order": 1.33,
    "total_freight": 46.0,
    "distinct_products": 3,
    "distinct_sellers": 2,
    "orders_recent_90d": 2,
    "spend_recent_90d": 250.0,
    "freight_ratio": 0.12,
    "recency_days": 14.0,
    "tenure_days": 140.0,
    "has_multiple_orders": 1,
    "avg_inter_order_days": 45.0,
    "std_inter_order_days": 12.0,
    "order_ratio_recent_vs_earlier": 0.67,
    "spend_ratio_recent_vs_earlier": 0.66,
    "customer_state": "SP"
}

SAMPLE_LAPSED_PAYLOAD = {
    "order_count": 1,
    "total_spend": 65.0,
    "avg_order_value": 65.0,
    "median_order_value": 65.0,
    "order_value_std": 0.0,
    "total_items": 1,
    "avg_items_per_order": 1.0,
    "total_freight": 16.5,
    "distinct_products": 1,
    "distinct_sellers": 1,
    "orders_recent_90d": 0,
    "spend_recent_90d": 0.0,
    "freight_ratio": 0.25,
    "recency_days": 165.0,
    "tenure_days": 165.0,
    "has_multiple_orders": 0,
    "avg_inter_order_days": 180.0,
    "std_inter_order_days": 0.0,
    "order_ratio_recent_vs_earlier": 0.0,
    "spend_ratio_recent_vs_earlier": 0.0,
    "customer_state": "RJ"
}

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "Balanced Logistic Regression" in data["model_type"]

def test_model_info():
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["target_variable"] == "repeat_purchase_next_90d"
    assert data["features_count"] == 21
    assert data["decision_threshold"] == 0.5
    assert "PR-AUC" in data["primary_selection_metric"]

def test_model_schema():
    response = client.get("/api/model-schema")
    assert response.status_code == 200
    data = response.json()
    assert len(data["features"]) == 21
    assert len(data["groups"]) >= 3
    assert len(data["presets"]) >= 2
    # Verify customer_state has options
    state_feature = next(f for f in data["features"] if f["name"] == "customer_state")
    assert "SP" in state_feature["options"]

def test_predict_active_customer():
    response = client.post("/api/predict", json=SAMPLE_ACTIVE_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_class" in data
    assert data["predicted_class"] in [0, 1]
    assert 0.0 <= data["repeat_purchase_probability"] <= 1.0
    assert 0.0 <= data["inactivity_risk_score"] <= 1.0
    # Inactivity risk + repeat probability must equal 1.0
    assert abs((data["repeat_purchase_probability"] + data["inactivity_risk_score"]) - 1.0) < 1e-3
    assert data["risk_tier"] in ["high", "moderate", "low"]
    assert "explanation" in data
    assert len(data["explanation"]["key_drivers"]) > 0

def test_predict_lapsed_customer():
    response = client.post("/api/predict", json=SAMPLE_LAPSED_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    # Lapsed buyer with 165d recency and 0 recent orders should have elevated inactivity risk
    assert data["inactivity_risk_score"] >= 0.50
    assert data["predicted_class"] == 0
    assert data["risk_tier"] in ["moderate", "high"]

def test_predict_repeatability():
    # Calling predict repeatedly on identical inputs must yield deterministic results
    res1 = client.post("/api/predict", json=SAMPLE_ACTIVE_PAYLOAD).json()
    res2 = client.post("/api/predict", json=SAMPLE_ACTIVE_PAYLOAD).json()
    assert res1["repeat_purchase_probability"] == res2["repeat_purchase_probability"]
    assert res1["inactivity_risk_score"] == res2["inactivity_risk_score"]
    assert res1["predicted_class"] == res2["predicted_class"]

def test_validation_missing_field():
    incomplete = SAMPLE_ACTIVE_PAYLOAD.copy()
    del incomplete["customer_state"]
    response = client.post("/api/predict", json=incomplete)
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "Validation Error"

def test_validation_invalid_state():
    invalid_state = SAMPLE_ACTIVE_PAYLOAD.copy()
    invalid_state["customer_state"] = "INVALID"
    response = client.post("/api/predict", json=invalid_state)
    assert response.status_code == 422

def test_validation_negative_spend():
    invalid_spend = SAMPLE_ACTIVE_PAYLOAD.copy()
    invalid_spend["total_spend"] = -50.0
    response = client.post("/api/predict", json=invalid_spend)
    assert response.status_code == 422
