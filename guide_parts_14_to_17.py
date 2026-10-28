"""
Part 14 to Part 17: Production Walkthrough, System Architecture & Engineering Specifications
"""

def get_part_fourteen():
    return r"""# PART FOURTEEN — EXECUTIVE PRODUCT WALKTHROUGH & TECHNICAL DEMONSTRATION

This section provides a timed executive demonstration script and walkthrough designed for product reviews, technical interviews, and stakeholder presentations.

---

### Demonstration Strategy: Pre-Run vs Live Run
* **Pre-Run:** Have Cells 00 to 40 already executed before the demonstration. Running the 14 EDA figures and training benchmarks live wastes 40 seconds of valuable walkthrough time.
* **Live Run:** Execute Cell 41 (`predict_customer_inactivity` on the 3 personas) and Cell 43 (pipeline reload assertion and packaging) **live** to demonstrate interactive real-time inference and deterministic artifact restoration.

---

### Minute-by-Minute Technical Walkthrough Sequence

#### [0:00 – 1:00] Executive Summary & Problem Identity
* **On Screen:** Scroll to **Cell 00 (Title)** and **Cell 03 (Project Identity)**.
* **Spoken Narrative:**
  > "Hello everyone. Today I am presenting **ChurnShield**, an explainable, end-to-end machine learning system engineered for customer inactivity prediction and retention intelligence in e-commerce.
  > 
  > Unlike contractual subscription services where customers explicitly cancel their accounts, retail e-commerce is **non-contractual**: customers silently lapse and cease purchasing.
  > 
  > Furthermore, repeat purchases within a fixed 90-day quarterly window represent rare minority events, occurring in fewer than 1% of accounts. Our objective is to predict this 90-day repeat propensity, invert it into an Inactivity Risk Score, and rank-order at-risk customers so retention marketing teams can deploy interventions under finite budget constraints."

#### [1:00 – 2:00] Relational Schema, Identity Disambiguation & Data Quality
* **On Screen:** Scroll to **Cell 05 (Dataset Acquisition)** and **Cell 07 (Data Quality Audit)**.
* **Spoken Narrative:**
  > "We utilized the Brazilian E-Commerce Public Dataset by Olist, comprising approximately 100,000 real orders across 9 relational tables.
  > 
  > Prior to modeling, we performed a comprehensive relational audit. In Olist, `customer_id` is a transient token generated per order, whereas `customer_unique_id` represents the permanent human individual. Tracking repeat behavior requires grouping by `customer_unique_id`.
  > 
  > Furthermore, orders have a one-to-many relationship with line items. Merging them directly would trigger row multiplication, artificially inflating spend and frequency metrics. We pre-aggregated order items to the order level before merging, achieving a clean 1-to-1 join across 98,666 valid orders, with 775 orphaned orders cleanly excluded."

#### [2:00 – 3:15] Feature Engineering, Temporal Windows & EDA
* **On Screen:** Scroll to **Cell 09 (Feature Store Pipeline)**, **Cell 11 (10-Point Gate)**, and **Cell 15 (Donut Chart & Repeat Trajectory)**.
* **Spoken Narrative:**
  > "To eliminate lookahead bias, we established a sliding-window temporal design across 5 chronological cohorts from 2017 to 2018. For each cohort snapshot, we engineer 21 behavioral features strictly from a 180-day past lookback window, and evaluate the binary repeat purchase target strictly over the subsequent 90-day future window.
  > 
  > Our feature matrix passed all 10 automated quality checks with zero null values and zero infinities across 130,914 customer snapshot rows.
  > 
  > Looking at Figure 8, you can see the defining challenge: **severe 99:1 class imbalance**—99.1% inactive vs 0.9% repeat buyers. This proves immediately why standard accuracy is completely misleading: a naive baseline predicting zero for everyone achieves 99% accuracy while providing zero business value."

#### [3:15 – 4:15] Preprocessing Pipelines & Rolling-Origin CV
* **On Screen:** Scroll to **Cell 22 (ColumnTransformer Pipeline)** and **Cell 24 (Multi-Model Benchmark)**.
* **Spoken Narrative:**
  > "We strictly avoided random train/test splits, which cause temporal inversion by training on 2018 data to predict 2017 transactions. Instead, we established a chronological split: June, September, and December 2017 for training (56,975 rows); March 2018 for validation (34,777 rows); and June 2018 as an untouched held-out test cohort (39,162 rows).
  > 
  > All preprocessing is encapsulated in a Scikit-Learn `ColumnTransformer` with `StandardScaler` for numeric features and `OneHotEncoder(handle_unknown='ignore')` for state categories, fitted exclusively on training data.
  > 
  > We benchmarked 7 architectures using rolling-origin cross-validation, evaluating them primarily on **Average Precision (PR-AUC)** rather than accuracy or ROC-AUC."

#### [4:15 – 5:15] Champion Model Selection & Final Holdout Results
* **On Screen:** Scroll to **Cell 27 (Hyperparameter Tuning)** and **Cell 29 (Holdout Results Table)**.
* **Spoken Narrative:**
  > "Our benchmark revealed that **Balanced Logistic Regression** ($C=1.0$) won the competition, outperforming complex ensembles like Random Forest and Gradient Boosting. In severe class imbalance, high-capacity tree models overfit the tiny minority class, whereas regularized logistic regression establishes a smooth, well-calibrated monotonic boundary.
  > 
  > On the untouched June 2018 test cohort of 39,162 customers:
  > - It achieved an **Average Precision of 0.0117**, delivering a **1.70x lift over the baseline**.
  > - It achieved an **ROC-AUC of 0.5849**.
  > - Most importantly, it achieved a **Minority Class Recall of 42.59%**, successfully identifying 115 of the 270 returning customers who would otherwise be lost in the 38,000 inactive accounts."

#### [5:15 – 6:15] Retention Intelligence, Business ROI & Explainability
* **On Screen:** Scroll to **Cell 32 (Prioritization Table)**, **Cell 35 (ROI Simulation)**, and **Cell 38 (Permutation Importance Plot)**.
* **Spoken Narrative:**
  > "Rather than using an arbitrary 0.5 binary threshold, we translate predictions into retention intelligence.
  > 
  > If the marketing team has budget to contact only the top 20% highest-risk accounts, our policy identifies **7,798 inactive customers with a 99.57% concentration**, sparing active customers from unnecessary discounts.
  > 
  > In our financial simulation under standard retail economics—spending R$ 5 per contact with a 5% reactivation rate and R$ 40 monthly margin—contacting this top 20% tier yields **+R$ 7,628 in net financial benefit, representing a 19.5% ROI**.
  > 
  > Our permutation importance analysis in Figure 18 reveals that the primary drivers of retention are **purchasing velocity (`orders_recent_90d`) and spending momentum (`spend_ratio_recent_vs_earlier`)**, rather than total lifetime spend."

#### [6:15 – 7:00] Live Interactive Prediction Demonstration & Conclusion
* **On Screen:** Scroll to **Cell 41 (Inference Function)** and **Cell 43 (Serialization)**. **CLICK RUN ON CELL 41 AND CELL 43.**
* **Spoken Narrative:**
  > "To demonstrate production readiness, I am now executing our standalone inference engine live on three customer personas.
  > 
  > Notice Persona A—a customer who bought once 165 days ago: the pipeline outputs an Inactivity Risk Score of **0.5768 (Moderate Risk)** and recommends a catalog nurture campaign. Persona B—an active repeat buyer who ordered 12 days ago: outputs an Inactivity Risk of **0.0135 (Low Risk)** and recommends VIP loyalty appreciation.
  > 
  > Finally, Cell 43 serializes the entire fitted pipeline into `churnshield_model.joblib`. Our automated restoration assertion passes with 100% bit-for-bit identical predictions, and all artifacts are packaged for downstream microservice serving.
  > 
  > Thank you everyone. I am now open to discuss any architectural or implementation questions."

---
"""

def get_part_fifteen():
    return r"""# PART FIFTEEN — PRODUCTION SYSTEM DESIGN & MLOPS ARCHITECTURE

This section outlines the production architecture, serving patterns, and operational monitoring specifications required to deploy ChurnShield at enterprise scale.

---

## 1. High-Availability Serving Microservice Architecture

In an enterprise e-commerce tech stack, ChurnShield is deployed as a stateless microservice wrapped with **FastAPI** inside a containerized Docker cluster:

```
[Marketing CRM / Frontend API]
            |
            v  HTTPS REST (JSON Payload)
+-----------------------------------------------------------+
|                   FastAPI Microservice                    |
|   - Pydantic Schema Validation (21 Input Features)        |
|   - In-Memory Loaded 'churnshield_model.joblib' Pipeline   |
|   - Latency: < 15ms p99 per prediction                    |
+-----------------------------------------------------------+
            |
            v
[Prediction Response: Inactivity Risk Score, Decile Tier, Retention Action]
```

### Production Pydantic Input Schema Example:
```python
from pydantic import BaseModel, Field

class CustomerFeaturesPayload(BaseModel):
    order_count: int = Field(..., ge=1)
    total_spend: float = Field(..., gt=0.0)
    avg_order_value: float = Field(..., gt=0.0)
    median_order_value: float = Field(..., gt=0.0)
    order_value_std: float = Field(default=0.0, ge=0.0)
    total_items: int = Field(..., ge=1)
    avg_items_per_order: float = Field(..., ge=1.0)
    total_freight: float = Field(..., ge=0.0)
    freight_ratio: float = Field(..., ge=0.0, le=1.0)
    distinct_products: int = Field(..., ge=1)
    distinct_sellers: int = Field(..., ge=1)
    recency_days: float = Field(..., ge=0.0, le=180.0)
    tenure_days: float = Field(..., ge=0.0, le=180.0)
    has_multiple_orders: int = Field(..., ge=0, le=1)
    avg_inter_order_days: float = Field(default=180.0, ge=0.0)
    std_inter_order_days: float = Field(default=0.0, ge=0.0)
    orders_recent_90d: int = Field(..., ge=0)
    spend_recent_90d: float = Field(..., ge=0.0)
    order_ratio_recent_vs_earlier: float = Field(default=0.0, ge=0.0)
    spend_ratio_recent_vs_earlier: float = Field(default=0.0, ge=0.0)
    customer_state: str = Field(..., min_length=2, max_length=2)
```

---

## 2. Batch Scoring vs. Real-Time Feature Serving

E-commerce retention campaigns generally operate on a **scheduled batch cadence**:
* **Batch Scoring (Recommended for Retention Campaigns):**
  - **Cadence:** Weekly cron job orchestrated via Apache Airflow or Prefect.
  - **Execution:** Queries the snowflake/BigQuery data warehouse for the past 180 days of orders, constructs features for all active accounts, passes the dataframe into `churnshield_model.joblib`, and pushes risk scores into the marketing automation engine (e.g., Braze, Klaviyo, Salesforce Marketing Cloud).
* **Real-Time Scoring (For Dynamic On-Site Personalization):**
  - **Architecture:** Upstream event streams (Kafka) populate an online feature store (e.g., Feast, Hopsworks, or Redis).
  - **Execution:** When a customer logs into the website or views a product page, the feature store serves their pre-aggregated 180-day features in < 5ms to the ChurnShield service, allowing the web app to dynamically display custom retention incentives or free-shipping vouchers.

---

## 3. Drift Monitoring & Production Quality Degradation

Machine learning models degrade over time due to macroeconomic changes, catalog shifts, and competitor pricing. In production, ChurnShield implements three monitoring pillars:

### A. Data Drift Monitoring (Input Feature Distributions)
* Uses the **Population Stability Index (PSI)** and **Wasserstein Distance** to monitor incoming feature shifts.
  $$\text{PSI} = \sum \left( \text{Actual}\% - \text{Expected}\% \right) \times \ln\left( \frac{\text{Actual}\%}{\text{Expected}\%} \right)$$
* **Alert Thresholds:**
  - $\text{PSI} < 0.10$: Stable; no changes required.
  - $0.10 \le \text{PSI} < 0.25$: Moderate drift; log warning and queue evaluation.
  - $\text{PSI} \ge 0.25$: Significant feature drift; trigger automated model retraining alert.

### B. Concept Drift Monitoring (Target Prevalence & Calibration)
* Tracks the empirical 90-day repeat rate across rolling cohorts. If the base repeat rate drops from 0.8% to 0.4% (e.g., during inflation or supply chain disruptions), the model's uncalibrated probabilities will systematically overestimate repeat buying.
* Continuously calculates the **Brier Score Loss** and **Expected Calibration Error (ECE)** against mature 90-day historical cohorts.

---

## 4. Automated CI/CD & Retraining Architecture

```
[Data Warehouse (BigQuery / Snowflake)]
            |
            v
[Monthly Airflow Retraining DAG]
    ├── 1. Ingest Latest 180-day / 90-day Snapshot Cohort
    ├── 2. Run 10-Point Feature Matrix Gate (Assertions)
    ├── 3. Execute Rolling-Origin Validation Pipeline
    ├── 4. Evaluate Champion Candidate vs. Production Model
    │      └── Criterion: Candidate PR-AUC > Prod PR-AUC + 0.0005
    ├── 5. Serialize Artifact & Log to MLflow Model Registry
    └── 6. Trigger Blue/Green Canary Deployment in Kubernetes
```

---

## 5. Causal Uplift & Randomized Controlled A/B Testing Framework

A critical tenet of senior ML engineering is distinguishing **predictive propensity** from **causal treatment effect**:
* **The Propensity Trap:** Standard classification predicts who is likely to repeat. Targeting customers with high repeat propensity wastes money on "Sure Things" who would have purchased anyway.
* **The Uplift Solution:** When launching retention interventions, the marketing team must establish a **Randomized Controlled Trial (RCT)**:
  - **Treated Group ($T$):** Receives retention coupon/email.
  - **Control Holdout ($C$):** Receives no outreach.
  - **Incremental Uplift:**
    $$\text{Incremental Lift} = P(\text{Repeat} \mid T) - P(\text{Repeat} \mid C)$$
  Targeting should prioritize the "Persuadables"—customers where the treatment effect is strongly positive.

---
"""

def get_part_sixteen():
    return r"""# PART SIXTEEN — COMMON RUNTIME ERRORS & TROUBLESHOOTING GUIDE

This section covers common operational issues and edge cases encountered when executing ChurnShield in local or cloud runtimes.

---

### Error 1: Multiprocessing / Loky Deadlock (`n_jobs=-1`)
* **Symptom:** Execution freezes indefinitely on Cell 37 (`permutation_importance`) with zero progress and 100% CPU lock.
* **Root Cause:** In sandboxed container environments (Docker, macOS sandbox, or certain Colab VM nodes), `n_jobs=-1` attempts to spawn worker processes via POSIX semaphores or `/dev/shm` shared memory, leading to an IPC deadlock.
* **Resolution:** Set `n_jobs=1` inside `permutation_importance(...)`. For regularized Logistic Regression with 15 features, sequential single-thread execution completes in only **1.39 seconds**, eliminating process-fork deadlocks.

---

### Error 2: Matplotlib Font Cache Latency
* **Symptom:** `UserWarning: /Users/.../.matplotlib is not a writable directory... Matplotlib is building the font cache; this may take a moment.` (25-second delay on Cell 02).
* **Root Cause:** The default user home directory is restricted or non-writable in the runtime, forcing matplotlib to fall back and re-scan all system fonts on every import.
* **Resolution:** Configure `os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib'` at the very top of Cell 02 *before* importing matplotlib.

---

### Error 3: Dataset Ingestion Timeout / Rate Limiting
* **Symptom:** `kagglehub.exceptions.KaggleApiError` or interactive login prompt pausing headless execution.
* **Root Cause:** Unauthenticated API requests hitting Kaggle's public rate limiter.
* **Resolution:** ChurnShield implements a 3-tier fallback. If `kagglehub` fails, upload `archive.zip` or the raw CSVs directly to `./data/`. The recursive file discovery engine detects local files automatically.

---

### Error 4: Unseen Category Exception During Online Inference
* **Symptom:** `ValueError: Found unknown categories ['XX'] in column 0 during transform.`
* **Root Cause:** An incoming inference payload contains a categorical value (e.g., an unobserved state code) not present in the training distribution.
* **Resolution:** Ensure `OneHotEncoder` is initialized with `handle_unknown='ignore'`. This encodes unseen categories as all zeros rather than raising a runtime exception.

---
"""

def get_part_seventeen():
    return r"""# PART SEVENTEEN — PRODUCTION DEPLOYMENT CHECKLIST & MODEL SUMMARY

Keep this executive summary accessible for system architecture reviews and deployment readiness checks:

---

### 1. System Metadata & Core Parameters
* **System Name:** ChurnShield Retention Intelligence Engine
* **Dataset:** Brazilian E-Commerce Public Dataset by Olist (100,000 orders, 2016–2018, CC BY-NC-SA 4.0)
* **Core Tables:** `olist_orders_dataset.csv`, `olist_customers_dataset.csv`, `olist_order_items_dataset.csv`
* **Target Definition:** `repeat_purchase_next_90d` ($y \in \{0, 1\}$) over $[T, T + 90\text{d})$
* **Inactivity Risk Metric:** $S_{\text{inactivity}} = 1.0 - \hat{P}_{\text{repeat}}$
* **Class Imbalance:** Extreme **99:1 imbalance** (0.69% to 0.96% base repeat rate across cohorts)
* **Analytical Feature Store:** **130,914 customer snapshot rows across 24 columns** (5 snapshot cohorts)
* **Temporal Partitioning:**
  - Training Set (June, Sept, Dec 2017): 56,975 instances (0.91% repeats)
  - Validation Set (March 2018): 34,777 instances (0.83% repeats)
  - Held-out Test Set (June 2018): 39,162 instances (0.69% repeats)

---

### 2. Champion Model Benchmark Summary
* **Selected Algorithm:** **Balanced Logistic Regression** ($C = 1.0$, `class_weight='balanced'`)
* **Test PR-AUC (Average Precision):** **0.0117** vs Dummy Baseline **0.0069** (**1.70x Baseline Lift**)
* **Test ROC-AUC:** **0.5849**
* **Minority Class Recall:** **42.59%** (detects 115 of 270 returning buyers)
* **Probability Calibration (Brier Score):** **0.2279**

---

### 3. Retention Unit Economics & Financial ROI
* **Inactivity Outreach Policy (Top 20% Capacity):** Contacts 7,832 accounts, capturing **7,798 inactive customers (99.57% concentration)**.
* **Re-Engagement Decile Lift:** Top 10% repeat propensity targeting achieves **1.63x lift** over random outreach.
* **Campaign ROI Simulation:** R$ 39,160 marketing spend yields R$ 46,788 gross margin preserved $\to$ **+R$ 7,628 Net Benefit (19.5% ROI)**.

---

### 4. Primary Behavioral Drivers (Permutation Importance)
1. `orders_recent_90d`: Recent quarterly purchasing velocity (Importance: 0.009339)
2. `spend_ratio_recent_vs_earlier`: Spending momentum / monetary expansion (Importance: 0.006754)
3. `order_count`: Total lifetime order frequency in lookback (Importance: 0.003210)
4. `median_order_value`: Baseline basket commitment (Importance: 0.002870)
5. `recency_days`: Days elapsed since most recent transaction (Importance: 0.002194)

---

### 5. Five Core Architectural Principles for Production Retention ML
1. **Never evaluate imbalanced classifiers on raw accuracy.** Naive models achieve 99.31% accuracy while delivering zero business utility. Rely on **PR-AUC (Average Precision)** and **Minority Recall**.
2. **Preserve chronological causality.** Random train/test splits cause catastrophic temporal leakage. Always evaluate models using rolling-origin temporal splits.
3. **Pre-aggregate one-to-many transactional tables.** Failing to aggregate item lines to the order level causes row multiplication and distorts lifetime monetary statistics.
4. **Disambiguate transactional tokens from entity identifiers.** `customer_id` is per-order; `customer_unique_id` represents the true individual.
5. **Acknowledge non-contractual proxy boundaries.** 90-day repeat inactivity is a predictive behavioral proxy for dormancy, not permanent customer death.

---
"""

if __name__ == "__main__":
    print("Parts 14-17 loaded successfully.")
