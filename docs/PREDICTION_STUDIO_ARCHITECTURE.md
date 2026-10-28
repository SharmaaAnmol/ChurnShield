# ChurnShield — Prediction Studio & Real ML Inference Architecture

This document describes the design, execution mechanics, feature schemas, and decision boundaries of the **ChurnShield Prediction Studio** and its Python FastAPI backend service.

---

## 1. Retrospective Evaluation vs. Real Interactive Inference

A core architectural principle of ChurnShield is maintaining strict segregation between **retrospective model evaluation** and **prospective interactive prediction**:

| Dimension | Model Performance Page | Prediction Studio |
| :--- | :--- | :--- |
| **Data Source** | Fixed out-of-time test cohort (`2018-06-01`, $N = 39,162$) | User-supplied feature vector via dynamic form |
| **Execution Mode** | Pre-computed evaluation metrics and holdout predictions | Real-time Python FastAPI inference via Scikit-Learn pipeline |
| **Purpose** | Validate scientific generalization and compute PR-AUC/ROC-AUC | Counterfactual "what-if" testing and interactive inference |
| **Modifiability** | Read-only static data | Editable inputs with real-time recalculation |

---

## 2. Served ML Model Identity & Pipeline Specifications

- **Algorithm:** Balanced Logistic Regression (`sklearn.linear_model.LogisticRegression`)
- **Hyperparameters:**
  - $C = 1.0$ (L2 Ridge Regularization)
  - `class_weight = 'balanced'` (adjusts weights inversely proportional to class frequencies)
  - `solver = 'lbfgs'`
  - `max_iter = 1000`
  - `random_state = 42`
- **Serialization Format:** Python Joblib (`backend/artifacts/churnshield_pipeline.joblib`)
- **Pipeline Architecture:**
  1. `ColumnTransformer`:
     - **Numerical Branch (20 features):** `SimpleImputer(strategy='median')` $\to$ `StandardScaler()`
     - **Categorical Branch (1 feature, `customer_state`):** `SimpleImputer(strategy='most_frequent')` $\to$ `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`
  2. `Classifier`:
     - Fitted `LogisticRegression` with 47 total input coefficients (20 standardized numeric + 27 one-hot state dimensions).

---

## 3. Prediction Semantics & Output Mapping

- **Target Variable:** `repeat_purchase_next_90d` $\in \{0, 1\}$
- **Class Mapping:**
  - `1`: Customer places at least one qualifying order within $[T, T + 90\text{ days})$ (Positive class: Repeat Buyer).
  - `0`: Customer places zero orders within $[T, T + 90\text{ days})$ (Negative class: Inactive Buyer).
- **Probabilities & Inactivity Risk:**
  - $\text{repeat\_purchase\_probability} = P(y = 1 \mid X)$
  - $\text{inactivity\_risk\_score} = 1.0 - \text{repeat\_purchase\_probability} = P(y = 0 \mid X)$
- **Decision Rule:**
  - Default classification threshold $\tau = 0.50$.
  - If $\text{repeat\_purchase\_probability} \ge 0.50 \implies \text{Class 1 (Likely to Repeat)}$.
  - If $\text{repeat\_purchase\_probability} < 0.50 \implies \text{Class 0 (At Risk of Inactivity)}$.
- **Risk Tiers:**
  - High Inactivity Risk: $\text{inactivity\_risk\_score} \ge 70\%$
  - Moderate Inactivity Risk: $40\% \le \text{inactivity\_risk\_score} < 70\%$
  - Low Inactivity Risk: $\text{inactivity\_risk\_score} < 40\%$

---

## 4. Input Feature Schema & Groupings

The model consumes 21 customer-level engineered behavioral features:

### A. Recent 90-Day Dynamics
1. `recency_days`: Calendar days elapsed since customer's most recent order (0.0 to 180.0 days).
2. `orders_recent_90d`: Count of orders completed within the immediate 90-day observation window (0 to 8).
3. `spend_recent_90d`: Monetary spend within the immediate 90-day window (R$ 0 to R$ 5,000+).
4. `spend_ratio_recent_vs_earlier`: Spend in recent 90d divided by total lifetime spend (0.0 to 1.0).
5. `order_ratio_recent_vs_earlier`: Orders in recent 90d divided by total lifetime orders (0.0 to 1.0).

### B. Order Cadence & Frequency
6. `order_count`: Total historical order count in the 180-day lookback window (1 to 10).
7. `has_multiple_orders`: Binary flag (1 if `order_count >= 2`, 0 if single-order buyer).
8. `total_items`: Total quantity of merchandise units purchased across all orders.
9. `avg_items_per_order`: Average items per order (1.0 to 15.0).
10. `distinct_products`: Number of unique product SKUs purchased.
11. `tenure_days`: Calendar days elapsed since customer's first recorded order.
12. `avg_inter_order_days`: Average cadence between consecutive orders (180.0 for single-order buyers).
13. `std_inter_order_days`: Regularity vs volatility of inter-order cadence (0.0 for <3 orders).

### C. Spend & Basket Economics
14. `total_spend`: Cumulative gross revenue (including item price and freight) in Brazilian Reais (R$).
15. `avg_order_value`: Mean basket size across all orders (R$).
16. `median_order_value`: Median order value (robust against outlier basket sizes).
17. `order_value_std`: Standard deviation of order values.
18. `total_freight`: Cumulative logistics and shipping fees paid (R$).
19. `freight_ratio`: Proportion of total expenditure spent on logistics ($0.0$ to $1.0$).

### D. Geography & Merchant Engagement
20. `customer_state`: 2-letter Brazilian state code (27 federative units: SP, RJ, MG, RS, PR, etc.).
21. `distinct_sellers`: Count of distinct marketplace merchants the customer purchased from.

---

## 5. API Service Specification (`backend/`)

- `GET /api/health`: Confirms model readiness and server status.
- `GET /api/model-info`: Returns model hyperparameters, decision threshold, and evaluation metrics.
- `GET /api/model-schema`: Returns complete input schema, constraints, groups, and empirical presets.
- `POST /api/predict`: Validates payload via Pydantic, converts to DataFrame, and returns real model inference.
