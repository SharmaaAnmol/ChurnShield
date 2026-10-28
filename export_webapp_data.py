"""
ChurnShield — Webapp Static Data Exporter
Extracts and normalizes machine learning artifacts into webapp/public/data/
for consumption by the React web application.
"""

import json
import shutil
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
WEBAPP_DATA_DIR = PROJECT_ROOT / "webapp" / "public" / "data"

def export_data():
    WEBAPP_DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Exporting ChurnShield artifacts to {WEBAPP_DATA_DIR}...")

    # 1. Evaluation Metrics
    metrics_src = ARTIFACTS_DIR / "final_test_metrics.json"
    if metrics_src.exists():
        shutil.copy2(metrics_src, WEBAPP_DATA_DIR / "evaluation_metrics.json")
        print(" -> Exported evaluation_metrics.json")
    else:
        print(" [!] Missing artifacts/final_test_metrics.json")

    # 2. Model Summary & Metadata
    meta_src = ARTIFACTS_DIR / "model_metadata.json"
    if meta_src.exists():
        shutil.copy2(meta_src, WEBAPP_DATA_DIR / "model_summary.json")
        print(" -> Exported model_summary.json")
    else:
        print(" [!] Missing artifacts/model_metadata.json")

    # 3. Feature Importance
    feat_src = ARTIFACTS_DIR / "feature_importance.csv"
    if feat_src.exists():
        df_feat = pd.read_csv(feat_src)
        df_feat.to_csv(WEBAPP_DATA_DIR / "feature_importance.csv", index=False)
        # Also export as JSON
        feat_records = df_feat.to_dict(orient="records")
        for i, rec in enumerate(feat_records):
            rec["rank"] = i + 1
        with open(WEBAPP_DATA_DIR / "feature_importance.json", "w") as f:
            json.dump(feat_records, f, indent=2)
        print(" -> Exported feature_importance.csv & feature_importance.json")
    else:
        print(" [!] Missing artifacts/feature_importance.csv")

    # 4. Customer Predictions with Features Joined
    preds_src = ARTIFACTS_DIR / "holdout_predictions.csv"
    snaps_src = ARTIFACTS_DIR / "curated_customer_snapshots.csv"

    if preds_src.exists():
        df_preds = pd.read_csv(preds_src)
        print(f" Loaded {len(df_preds):,} holdout predictions.")

        if snaps_src.exists():
            print(" Joining feature attributes from curated_customer_snapshots.csv...")
            # Load test cohort snapshot rows (2018-06-01)
            # Read in chunks or filtered by observation_date
            features_to_join = [
                "customer_unique_id",
                "order_count",
                "total_spend",
                "avg_order_value",
                "orders_recent_90d",
                "spend_recent_90d",
                "recency_days",
                "tenure_days",
                "customer_state",
                "total_freight",
                "spend_ratio_recent_vs_earlier",
            ]
            df_snaps = pd.read_csv(snaps_src)
            # Filter to 2018-06-01 cohort
            if "observation_date" in df_snaps.columns:
                df_snaps = df_snaps[df_snaps["observation_date"] == "2018-06-01"]

            existing_cols = [c for c in features_to_join if c in df_snaps.columns]
            df_snaps_sub = df_snaps[existing_cols].drop_duplicates(subset=["customer_unique_id"])

            df_merged = df_preds.merge(df_snaps_sub, on="customer_unique_id", how="left")
        else:
            df_merged = df_preds

        # Sort with priority and high risk first
        df_merged = df_merged.sort_values(
            by=["priority_retention_target_20pct", "inactivity_risk_score"],
            ascending=[False, False]
        )

        # For smooth browser performance, export the top 2,500 scored customers
        # (covers priority retention targets and representative deciles)
        export_sample = df_merged.head(2500)
        export_sample.to_csv(WEBAPP_DATA_DIR / "customer_predictions.csv", index=False)
        print(f" -> Exported customer_predictions.csv ({len(export_sample):,} curated records)")
    else:
        print(" [!] Missing artifacts/holdout_predictions.csv")

    print("\nStatic data export complete! Files are available at webapp/public/data/")

if __name__ == "__main__":
    export_data()
