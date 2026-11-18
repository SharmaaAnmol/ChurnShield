# webapp/public/data

Generated files. Do not edit by hand.

All files here are produced from this repository's artifacts by `export_webapp_data.py`
(and `export_eda.py`) at the repo root:

```bash
python export_webapp_data.py          # regenerate
python export_webapp_data.py --check  # fail if anything here differs from what the artifacts produce
```

| File | Built from |
|---|---|
| evaluation_metrics.json | copy of artifacts/final_test_metrics.json |
| model_summary.json | copy of artifacts/model_metadata.json |
| feature_importance.csv/.json | artifacts/feature_importance.csv |
| model_weights.json | coefficients and scaler stats read from backend/artifacts/churnshield_pipeline.joblib |
| timeline_metrics.json | the pipeline scored on every cohort of artifacts/curated_customer_snapshots.csv |
| customer_predictions.csv | seeded random sample (800 per cohort, seed 42) of those scored customers |
| eda.json | aggregates of artifacts/curated_customer_snapshots.csv |
| examples.json | 4 real test-cohort customers picked by fixed rules (lowest, median, returner median, highest risk), with all 21 features, the sklearn score and the real outcome; plus the top-20% contact cut-off |
