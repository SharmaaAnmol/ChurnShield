# ChurnShield Static Data Directory (`public/data`)

This directory contains the machine learning artifacts exported from `ChurnShield_Customer_Inactivity_Prediction.ipynb` to power the ChurnShield web analytics interface.

---

## Required Files

1. **`evaluation_metrics.json`**
   - Contains evaluation metrics evaluated on the final test cohort (`2018-06-01`, $N = 39,162$).
   - Metrics include PR-AUC, ROC-AUC, Recall, Balanced Accuracy, Brier score, and Confusion Matrix.

2. **`model_summary.json`**
   - Contains champion model metadata, hyperparameters, temporal cohort schedule, and financial ROI simulation numbers.

3. **`feature_importance.json`** or **`feature_importance.csv`**
   - Contains permutation importance rankings for all 21 input features.

4. **`customer_predictions.csv`**
   - Scored customers with their predicted repeat purchase probability, inactivity risk score, priority retention flag, and feature values.

---

## How to Export Data from Notebook or Python

Run the following in the project root:

```bash
# If using the export script:
python export_webapp_data.py
```

Or execute the final cell in `ChurnShield_Customer_Inactivity_Prediction.ipynb`.
