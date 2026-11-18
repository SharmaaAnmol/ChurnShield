"""
ChurnShield — EDA exporter.
Aggregates the curated feature store (artifacts/curated_customer_snapshots.csv)
into small chart-ready tables at webapp/public/data/eda.json for the Data page.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "artifacts" / "curated_customer_snapshots.csv"
OUT = ROOT / "webapp" / "public" / "data" / "eda.json"
Y = "repeat_purchase_next_90d"


def rate_by(df: pd.DataFrame, col: str, order=None) -> list:
    g = df.groupby(col, observed=True)[Y].agg(["size", "sum"]).reset_index()
    if order is not None:
        g[col] = pd.Categorical(g[col], categories=order, ordered=True)
        g = g.sort_values(col)
    return [
        {"bucket": str(r[col]), "customers": int(r["size"]), "repeaters": int(r["sum"]),
         "repeat_rate": round(float(r["sum"] / r["size"]), 5)}
        for _, r in g.iterrows()
    ]


def main():
    df = pd.read_csv(SRC)
    n, pos = len(df), int(df[Y].sum())

    cohorts = rate_by(df, "observation_date")

    recency_edges = [0, 30, 60, 90, 120, 150, 181]
    recency_labels = ["0–30", "30–60", "60–90", "90–120", "120–150", "150–180"]
    df["recency_bucket"] = pd.cut(df["recency_days"], recency_edges, labels=recency_labels, right=False)

    df["recent_orders_bucket"] = df["orders_recent_90d"].clip(upper=2).map({0: "0", 1: "1", 2: "2+"})
    df["order_count_bucket"] = df["order_count"].clip(upper=3).map({1: "1", 2: "2", 3: "3+"})

    spend_edges = [0, 50, 100, 200, 500, np.inf]
    spend_labels = ["<$50", "$50–100", "$100–200", "$200–500", "$500+"]  # "$" by project choice; values are unconverted Olist amounts
    df["spend_bucket"] = pd.cut(df["total_spend"], spend_edges, labels=spend_labels, right=False)

    freight_edges = [0, 0.1, 0.2, 0.3, 0.5, np.inf]
    freight_labels = ["<10%", "10–20%", "20–30%", "30–50%", "50%+"]
    df["freight_bucket"] = pd.cut(df["freight_ratio"], freight_edges, labels=freight_labels, right=False)

    top_states = df["customer_state"].value_counts().head(10).index.tolist()
    states = sorted(rate_by(df[df["customer_state"].isin(top_states)], "customer_state"),
                    key=lambda r: -r["customers"])

    # log-spaced spend histogram, split by outcome, as share of each group
    bins = np.logspace(np.log10(5), np.log10(5000), 21)
    spend_hist = []
    h_all, _ = np.histogram(df.loc[df[Y] == 0, "total_spend"].clip(5, 4999), bins)
    h_rep, _ = np.histogram(df.loc[df[Y] == 1, "total_spend"].clip(5, 4999), bins)
    for i in range(len(bins) - 1):
        spend_hist.append({"from": round(float(bins[i]), 2), "to": round(float(bins[i + 1]), 2),
                           "inactive_share": round(float(h_all[i] / h_all.sum()), 5),
                           "repeat_share": round(float(h_rep[i] / h_rep.sum()), 5)})

    out = {
        "source": "artifacts/curated_customer_snapshots.csv (5 quarterly snapshots, 180d lookback, 90d outcome)",
        "rows": n,
        "unique_customers": int(df["customer_unique_id"].nunique()),
        "repeaters": pos,
        "repeat_rate": round(pos / n, 5),
        "one_order_share": round(float((df["order_count"] == 1).mean()), 5),
        "median_spend": round(float(df["total_spend"].median()), 2),
        "median_recency_days": round(float(df["recency_days"].median()), 1),
        "cohorts": cohorts,
        "by_recency": rate_by(df, "recency_bucket", recency_labels),
        "by_recent_orders": rate_by(df, "recent_orders_bucket", ["0", "1", "2+"]),
        "by_order_count": rate_by(df, "order_count_bucket", ["1", "2", "3+"]),
        "by_spend": rate_by(df, "spend_bucket", spend_labels),
        "by_freight_ratio": rate_by(df, "freight_bucket", freight_labels),
        "by_state_top10": states,
        "spend_histogram": spend_hist,
    }
    # self-check: every breakdown must cover the whole population
    for k in ["by_recency", "by_recent_orders", "by_order_count", "by_spend", "by_freight_ratio"]:
        assert sum(r["customers"] for r in out[k]) == n, k
    OUT.write_text(json.dumps(out, indent=2))
    print(f"wrote {OUT} ({n} rows, repeat rate {pos / n:.4%})")


if __name__ == "__main__":
    main()
