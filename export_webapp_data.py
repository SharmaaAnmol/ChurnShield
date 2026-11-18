"""
ChurnShield — webapp data exporter.

Every file in webapp/public/data/ is produced here from artifacts committed to this
repository. Nothing is typed in by hand:

  artifacts/final_test_metrics.json        -> evaluation_metrics.json   (copy)
  artifacts/model_metadata.json            -> model_summary.json        (copy)
  artifacts/feature_importance.csv         -> feature_importance.csv/.json
  backend/artifacts/churnshield_pipeline.joblib
      -> model_weights.json   (coefficients + scaler/imputer stats read from the pipeline)
      -> timeline_metrics.json (pipeline scored on every cohort of the feature store)
      -> customer_predictions.csv (seeded random sample of scored customers)
  artifacts/curated_customer_snapshots.csv -> eda.json (via export_eda.py)
  curated snapshots + pipeline -> examples.json (rule-picked real test customers)
  artifacts/data_quality_report.json + model_comparison.csv + location_fix_comparison.json -> pipeline.json

Usage:
  python export_webapp_data.py          # regenerate the files
  python export_webapp_data.py --check  # fail if any served file differs from what the repo produces
"""

import filecmp
import json
import shutil
import sys
import tempfile
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (average_precision_score, balanced_accuracy_score,
                             confusion_matrix, recall_score, roc_auc_score)

import export_eda
from churnshield_features import STATE_TO_REGION

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent
ART = ROOT / "artifacts"
PIPELINE = ROOT / "backend" / "artifacts" / "churnshield_pipeline.joblib"
WEB_DATA = ROOT / "webapp" / "public" / "data"
Y = "repeat_purchase_next_90d"
AUDIT = ("customer_unique_id", "observation_date", Y)
SAMPLE_PER_COHORT = 800
SEED = 42

COHORT_LABELS = {
    "2017-06-01": ("Q2 2017 [In-Sample Training]", "train"),
    "2017-09-01": ("Q3 2017 [In-Sample Training]", "train"),
    "2017-12-01": ("Q4 2017 [In-Sample Training]", "train"),
    "2018-03-01": ("Q1 2018 [Validation Cohort]", "validation"),
    "2018-06-01": ("Q2 2018 [Held-Out Test]", "test"),
}
EXPORT_COLUMNS = [
    "customer_unique_id", "observation_date", Y, "repeat_purchase_probability",
    "inactivity_risk_score", "priority_retention_target_20pct", "order_count", "total_spend",
    "avg_order_value", "orders_recent_90d", "spend_recent_90d", "recency_days", "tenure_days",
    "customer_state", "total_freight", "spend_ratio_recent_vs_earlier",
]


def model_weights(pipe) -> dict:
    """Read the logistic-regression maths straight out of the fitted sklearn pipeline."""
    ct = pipe.named_steps["prep"]
    clf = pipe.named_steps["clf"]
    num_cols = ct.transformers_[0][2]
    num_pipe = ct.named_transformers_["num"]
    imputer, scaler = num_pipe.named_steps["imputer"], num_pipe.named_steps["scaler"]
    ohe = ct.named_transformers_["cat"].named_steps["ohe"]
    cat_imputer = ct.named_transformers_["cat"].named_steps["imputer"]
    coef = clf.coef_[0]
    n = len(num_cols)
    region_w = {str(r): float(coef[n + i]) for i, r in enumerate(ohe.categories_[0])}
    return {
        "intercept": float(clf.intercept_[0]),
        "num_weights": {
            col: {"coef": float(coef[i]), "median": float(imputer.statistics_[i]),
                  "mean": float(scaler.mean_[i]), "scale": float(scaler.scale_[i])}
            for i, col in enumerate(num_cols)
        },
        # The pipeline maps state -> region before one-hot encoding, so every state carries its region's weight.
        "cat_weights": {s: region_w[r] for s, r in sorted(STATE_TO_REGION.items())},
        "region_weights": region_w,
        "state_region": dict(sorted(STATE_TO_REGION.items())),
        "cat_default": str(cat_imputer.statistics_[0]),
    }


def cohort_metrics(cid: str, g: pd.DataFrame, label: str, split: str) -> dict:
    y, p = g[Y].to_numpy(), g["repeat_purchase_probability"].to_numpy()
    risk = 1.0 - p
    pred = (p >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    base = float(y.mean())
    pr_auc = float(average_precision_score(y, p))
    return {
        "timelineId": cid,
        "label": label if cid == "all" else cid,
        "quarterLabel": label,
        "split": split,
        "totalCustomersEvaluated": int(len(g)),
        "actualRepeatPurchasers": int(y.sum()),
        "actualInactiveCustomers": int(len(g) - y.sum()),
        "baseRepeatPurchaseRate": round(base, 6),
        "baseInactivityRate": round(1 - base, 6),
        "prAuc": round(pr_auc, 4),
        "rocAuc": round(float(roc_auc_score(y, p)), 4),
        "recall": round(float(recall_score(y, pred)), 4),
        "balancedAccuracy": round(float(balanced_accuracy_score(y, pred)), 4),
        "prAucLiftOverDummy": round(pr_auc / base, 2),  # dummy classifier's PR-AUC equals the base rate
        "recommendedContactCount": int(g["priority_retention_target_20pct"].sum()),
        "riskDistribution": {
            "highRisk": int((risk >= 0.70).sum()),
            "moderateRisk": int(((risk >= 0.40) & (risk < 0.70)).sum()),
            "lowRisk": int((risk < 0.40).sum()),
        },
        "confusionMatrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def pipeline_facts() -> dict:
    """Facts for the How-it's-built page: raw tables profiled and the model bake-off."""
    dq = json.loads((ART / "data_quality_report.json").read_text())
    ji = dq["join_integrity"]
    mc = pd.read_csv(ART / "model_comparison.csv")
    return {
        "raw_tables": [{"file": f, "rows": t["rows"]} for f, t in dq["tables_profiled"].items()],
        "date_range": [ji["min_order_purchase_timestamp"][:10], ji["max_order_purchase_timestamp"][:10]],
        "orders_with_items": ji["orders_with_qualifying_items"],
        "model_comparison": mc[["model", "cv_pr_auc_mean", "cv_pr_auc_std", "val_pr_auc", "val_roc_auc", "fit_time_seconds"]]
        .sort_values("val_pr_auc", ascending=False).to_dict("records"),
        "location_fix": json.loads((ART / "location_fix_comparison.json").read_text()),
    }


def pick_examples(df: pd.DataFrame, features: list) -> dict:
    """Real held-out customers for the Try-the-model presets, chosen by fixed rules (no hand-picking)."""
    t = df[df["observation_date"] == "2018-06-01"]
    risk = t["inactivity_risk_score"]
    back = t[t[Y] == 1]
    rules = [
        ("lowest", "Lowest risk in the test cohort", risk.idxmin()),
        ("typical", "Closest to the cohort's median risk", (risk - risk.median()).abs().idxmin()),
        ("returner", "A customer who did come back (median risk among returners)",
         (back["inactivity_risk_score"] - back["inactivity_risk_score"].median()).abs().idxmin()),
        ("highest", "Highest risk in the test cohort", risk.idxmax()),
    ]
    out = []
    for key, rule, i in rules:
        r = t.loc[i]
        out.append({
            "key": key, "rule": rule, "customer_unique_id": r["customer_unique_id"],
            "observation_date": r["observation_date"], "came_back": int(r[Y]),
            "repeat_purchase_probability": round(float(r["repeat_purchase_probability"]), 6),
            "inactivity_risk_score": round(float(r["inactivity_risk_score"]), 6),
            "features": {c: (r[c] if c == "customer_state" else round(float(r[c]), 6)) for c in features},
        })
    assert len({e["customer_unique_id"] for e in out}) == len(out), "example rules picked the same customer twice"
    flagged = t.loc[t["priority_retention_target_20pct"] == 1, "inactivity_risk_score"]
    return {
        "cohort": "2018-06-01",
        "cohort_customers": int(len(t)),
        "cohort_repeat_rate": round(float(t[Y].mean()), 5),
        "contact_list_size": int(len(flagged)),
        # lowest risk that still made the cohort's top-20% contact list
        "contact_threshold": round(float(flagged.min()), 6),
        "customers": out,
    }


def export_to(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(ART / "final_test_metrics.json", out / "evaluation_metrics.json")
    shutil.copyfile(ART / "model_metadata.json", out / "model_summary.json")
    fi = pd.read_csv(ART / "feature_importance.csv")
    fi.to_csv(out / "feature_importance.csv", index=False)
    (out / "feature_importance.json").write_text(
        json.dumps([{**r, "rank": i + 1} for i, r in enumerate(fi.to_dict("records"))], indent=2))

    pipe = joblib.load(PIPELINE)
    (out / "model_weights.json").write_text(json.dumps(model_weights(pipe), indent=2))

    df = pd.read_csv(ART / "curated_customer_snapshots.csv")
    features = [c for c in df.columns if c not in AUDIT]
    df["repeat_purchase_probability"] = pipe.predict_proba(df[features])[:, 1]
    df["inactivity_risk_score"] = 1.0 - df["repeat_purchase_probability"]
    # Top 20% highest inactivity risk within each cohort (same rule as the notebook's policy).
    df["priority_retention_target_20pct"] = 0
    for _, g in df.groupby("observation_date"):
        top = g["inactivity_risk_score"].sort_values(ascending=False).index[: int(len(g) * 0.20)]
        df.loc[top, "priority_retention_target_20pct"] = 1

    timeline = {cid: cohort_metrics(cid, g, *COHORT_LABELS[cid]) for cid, g in df.groupby("observation_date")}
    timeline["all"] = cohort_metrics("all", df, "All 5 snapshots (130k)", "all")
    (out / "timeline_metrics.json").write_text(json.dumps(timeline, indent=2))

    picked = [g.sample(n=min(SAMPLE_PER_COHORT, len(g)), random_state=SEED).index
              for _, g in df.groupby("observation_date")]
    sample = df.loc[np.concatenate(picked)].sort_values(["observation_date", "inactivity_risk_score"], ascending=[True, False])
    sample[EXPORT_COLUMNS].round({"repeat_purchase_probability": 4, "inactivity_risk_score": 4}).to_csv(
        out / "customer_predictions.csv", index=False)

    (out / "pipeline.json").write_text(json.dumps(pipeline_facts(), indent=2))
    (out / "examples.json").write_text(json.dumps(pick_examples(df, features), indent=2))

    export_eda.OUT = out / "eda.json"
    export_eda.main()

    # self-checks against artifacts the notebook wrote independently
    test = timeline["2018-06-01"]
    final = json.loads((ART / "final_test_metrics.json").read_text())
    assert test["prAuc"] == final["metrics"]["average_precision_pr_auc"], "test PR-AUC drifted from notebook"
    assert test["confusionMatrix"] == final["confusion_matrix"], "test confusion matrix drifted from notebook"
    holdout = pd.read_csv(ART / "holdout_predictions.csv")
    assert test["recommendedContactCount"] == int(holdout["priority_retention_target_20pct"].sum())


def main() -> None:
    if "--check" not in sys.argv:
        export_to(WEB_DATA)
        print(f"exported to {WEB_DATA}")
        return
    with tempfile.TemporaryDirectory() as tmp:
        export_to(Path(tmp))
        stale = [f.name for f in sorted(Path(tmp).iterdir())
                 if not (WEB_DATA / f.name).exists() or not filecmp.cmp(f, WEB_DATA / f.name, shallow=False)]
    if stale:
        sys.exit(f"webapp data does not match the repo artifacts: {', '.join(stale)}")
    print("webapp data matches the repo artifacts")


if __name__ == "__main__":
    main()
