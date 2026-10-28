# ChurnShield Frontend Data Contract

This document defines the schema requirements, data lifecycle, and error-handling contract between the ChurnShield Machine Learning Pipeline (`ChurnShield_Customer_Inactivity_Prediction.ipynb`) and the React web application (`webapp/`).

---

## 1. Architectural Philosophy

1. **Static Data Model**: The web application communicates with the ML pipeline exclusively through static data files located in `webapp/public/data/`.
2. **Honest Missing-Data Contract**: When a file is absent or malformed, the application **never** renders fabricated customer profiles, synthetic accuracy numbers, or mock predictions. It renders an explicit missing-state UI explaining what file is needed.
3. **Immutability of ML Ground Truth**: The web application never alters predictions or feature weights. Inactivity risk is strictly defined as:
   $$\text{inactivity\_risk} = 1.0 - \text{repeat\_purchase\_probability}$$

---

## 2. Expected Data Files

| File Name | Format | Primary Purpose | Required Columns / Top-Level Keys |
| :--- | :--- | :--- | :--- |
| `evaluation_metrics.json` | JSON | Holds out-of-time test cohort evaluation metrics ($N=39,162$). | `evaluation_cohort`, `test_population_size`, `metrics`, `confusion_matrix`, `pr_auc_lift_over_dummy` |
| `model_summary.json` | JSON | Model hyperparameters, training cohort schedule, and ROI scenario. | `project_name`, `target_variable`, `champion_model`, `retention_prioritization_policy`, `business_impact_scenario` |
| `feature_importance.json` *(or `.csv`)* | JSON / CSV | Permutation feature importance on test cohort. | `feature`, `importance_mean`, `importance_std` |
| `customer_predictions.csv` | CSV | Scored customer cohort for retention explorer. | `customer_unique_id`, `observation_date`, `repeat_purchase_probability`, `inactivity_risk_score`, `priority_retention_target_20pct` |
| `dashboard_summary.json` *(optional)* | JSON | Pre-computed dashboard KPI rollup (if omitted, dynamically computed by `data-adapter`). | `cohortDate`, `totalCustomersEvaluated`, `primaryMetric`, `riskDistribution` |

---

## 3. Detailed Schema Specifications

### `evaluation_metrics.json`
```json
{
  "evaluation_cohort": "2018-06-01",
  "test_population_size": 39162,
  "actual_repeat_purchasers": 270,
  "actual_inactive_customers": 38892,
  "base_repeat_purchase_rate": 0.006894,
  "base_inactivity_rate": 0.993106,
  "champion_model": "Balanced Logistic Regression",
  "metrics": {
    "average_precision_pr_auc": 0.0117,
    "roc_auc": 0.5849,
    "precision": 0.0094,
    "recall": 0.4259,
    "f1_score": 0.0184,
    "balanced_accuracy": 0.5575,
    "accuracy": 0.6873,
    "matthews_corrcoef": 0.0206,
    "brier_score": 0.2279
  },
  "dummy_baseline_metrics": {
    "average_precision_pr_auc": 0.0069,
    "roc_auc": 0.5
  },
  "pr_auc_lift_over_dummy": 1.7,
  "confusion_matrix": {
    "tn": 26802,
    "fp": 12090,
    "fn": 155,
    "tp": 115
  }
}
```

### `feature_importance.csv`
```csv
feature,importance_mean,importance_std
orders_recent_90d,0.009339,0.000272
spend_ratio_recent_vs_earlier,0.006754,0.000497
order_count,0.003210,0.000948
median_order_value,0.002870,0.000257
recency_days,0.002194,0.000448
```

### `customer_predictions.csv`
```csv
customer_unique_id,observation_date,actual_repeat_purchase_next_90d,repeat_purchase_probability,inactivity_risk_score,priority_retention_target_20pct,order_count,total_spend,orders_recent_90d,recency_days,customer_state
0005ef4cd20d2893f0d9fbd94d3c0d97,2018-06-01,0,0.28883,0.71117,1,1,119.90,0,165.2,SP
000c8bdb58a29e7115cfc257230fb21b,2018-06-01,0,0.39236,0.60764,1,1,29.90,0,140.8,RJ
```

---

## 4. UI Layer Handling of Missing Data

| State | Visual Presentation | User Action Available |
| :--- | :--- | :--- |
| **Loading** | Skeleton loaders with shimmer animation matching the component structure. | None (transient). |
| **Missing File (404)** | Bordered dark card with glowing accent border, `FileQuestion` icon, and command copy snippet. | One-click button to check again / instructions for export. |
| **Corrupted Payload** | Warning banner indicating exact schema validation failure reason. | Retry fetch button. |
| **Success** | High-contrast data visualization, animated counters, interactive filtering. | Full exploration. |
