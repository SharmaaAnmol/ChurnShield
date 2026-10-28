# ChurnShield Backend — Real ML Inference Service

This FastAPI service provides real-time model inference for customer repeat-purchase inactivity prediction using the trained Scikit-Learn pipeline from `ChurnShield_Customer_Inactivity_Prediction.ipynb`.

---

## 1. Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and model readiness. |
| `GET` | `/api/model-info` | Verified model hyperparameters, target variable, and metrics. |
| `GET` | `/api/model-schema` | The 21 input features, constraints, groupings, and empirical presets. |
| `POST` | `/api/predict` | Executes real inference on `churnshield_pipeline.joblib`. |

---

## 2. Running Locally

```bash
# Navigate to backend directory
cd backend

# Run with uvicorn
uvicorn app.main:app --reload --port 8000
```

The interactive OpenAPI docs will be available at:
`http://localhost:8000/docs`

---

## 3. Running Automated Tests

```bash
cd backend
pytest tests/ -v
```
