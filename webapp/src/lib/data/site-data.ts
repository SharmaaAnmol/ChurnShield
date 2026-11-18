/**
 * Data for the redesigned pages. Every file here is generated from the repository's
 * artifacts by export_webapp_data.py; `python export_webapp_data.py --check` proves it.
 * Pages must read numbers from this hook and never type them in.
 */
import { useEffect, useState } from 'react';

export interface RateRow {
  bucket: string;
  customers: number;
  repeaters: number;
  repeat_rate: number;
}

export interface Eda {
  source: string;
  rows: number;
  unique_customers: number;
  repeaters: number;
  repeat_rate: number;
  one_order_share: number;
  median_spend: number;
  median_recency_days: number;
  cohorts: RateRow[];
  by_recency: RateRow[];
  by_recent_orders: RateRow[];
  by_order_count: RateRow[];
  by_spend: RateRow[];
  by_freight_ratio: RateRow[];
  by_state_top10: RateRow[];
  spend_histogram: Array<{ from: number; to: number; inactive_share: number; repeat_share: number }>;
}

export interface CohortMetrics {
  timelineId: string;
  quarterLabel: string;
  split: 'train' | 'validation' | 'test' | 'all';
  totalCustomersEvaluated: number;
  actualRepeatPurchasers: number;
  baseRepeatPurchaseRate: number;
  prAuc: number;
  rocAuc: number;
  recall: number;
  balancedAccuracy: number;
  prAucLiftOverDummy: number;
  recommendedContactCount: number;
  riskDistribution: { highRisk: number; moderateRisk: number; lowRisk: number };
  confusionMatrix: { tn: number; fp: number; fn: number; tp: number };
}

export interface ModelSummary {
  dataset_source: string;
  observation_window_days: number;
  prediction_horizon_days: number;
  cohort_schedule: { training_cohorts: string[]; validation_cohort: string; final_test_cohort: string };
  feature_schema: { numerical_features: string[]; categorical_features: string[] };
  champion_model: { model_type: string; test_cohort_pr_auc: number; validation_cohort_pr_auc: number };
  known_limitations: string[];
  environment: Record<string, string>;
}

export interface Evaluation {
  evaluation_cohort: string;
  test_population_size: number;
  actual_repeat_purchasers: number;
  metrics: Record<string, number>;
  dummy_baseline_metrics: { average_precision_pr_auc: number; roc_auc: number };
  pr_auc_lift_over_dummy: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
}

export interface Importance {
  feature: string;
  importance_mean: number;
  importance_std: number;
  rank: number;
}

export interface Pipeline {
  raw_tables: Array<{ file: string; rows: number }>;
  date_range: [string, string];
  orders_with_items: number;
  model_comparison: Array<{
    model: string;
    cv_pr_auc_mean: number;
    cv_pr_auc_std: number;
    val_pr_auc: number;
    val_roc_auc: number;
    fit_time_seconds: number;
  }>;
  /** State-level vs region-level location encoding, from artifacts/location_fix_comparison.json. */
  location_fix: Record<'before' | 'after', LocationFixSide>;
}

export interface LocationFixSide {
  encoding: string;
  location_categories: number;
  largest_location_weight: { category: string; log_odds: number };
  val_pr_auc: number;
  test_pr_auc: number;
  test_roc_auc: number;
  ms_train_customers: number;
  ms_train_returners: number;
  ms_test_customers: number;
  ms_test_returners: number;
  ms_test_min_risk: number;
  ms_test_median_risk: number;
  high_tier_customers: number;
  high_tier_top_states: Record<string, number>;
}

export interface SiteData {
  eda: Eda;
  timeline: Record<string, CohortMetrics>;
  summary: ModelSummary;
  evaluation: Evaluation;
  importance: Importance[];
  pipeline: Pipeline;
}

/** File names, shown on the page as the source of each figure. */
export const SOURCES = {
  eda: 'eda.json',
  timeline: 'timeline_metrics.json',
  summary: 'model_summary.json',
  evaluation: 'evaluation_metrics.json',
  importance: 'feature_importance.json',
  customers: 'customer_predictions.csv',
  pipeline: 'pipeline.json',
  examples: 'examples.json',
  weights: 'model_weights.json',
} as const;

/** Plain-English names for the model's 21 inputs. */
export const FEATURE_LABELS: Record<string, string> = {
  order_count: 'Number of orders',
  total_spend: 'Total spend',
  avg_order_value: 'Average order value',
  median_order_value: 'Typical (median) order value',
  order_value_std: 'How much order values vary',
  total_items: 'Items bought',
  avg_items_per_order: 'Items per order',
  total_freight: 'Shipping paid',
  distinct_products: 'Different products',
  distinct_sellers: 'Different sellers',
  orders_recent_90d: 'Orders in the last 90 days',
  spend_recent_90d: 'Spend in the last 90 days',
  freight_ratio: 'Shipping as a share of spend',
  recency_days: 'Days since last order',
  tenure_days: 'Days since first order',
  has_multiple_orders: 'Has more than one order',
  avg_inter_order_days: 'Average days between orders',
  std_inter_order_days: 'How regular the gaps are',
  order_ratio_recent_vs_earlier: 'Share of orders that were recent',
  spend_ratio_recent_vs_earlier: 'Share of spend that was recent',
  customer_state: 'State',
};

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`/data/${file}`);
  if (!res.ok) throw new Error(`Could not load /data/${file} (HTTP ${res.status})`);
  return res.json();
}

let cache: Promise<SiteData> | null = null;

function loadSiteData(): Promise<SiteData> {
  cache ??= Promise.all([
    getJson<Eda>(SOURCES.eda),
    getJson<Record<string, CohortMetrics>>(SOURCES.timeline),
    getJson<ModelSummary>(SOURCES.summary),
    getJson<Evaluation>(SOURCES.evaluation),
    getJson<Importance[]>(SOURCES.importance),
    getJson<Pipeline>(SOURCES.pipeline),
  ]).then(([eda, timeline, summary, evaluation, importance, pipeline]) => ({
    eda,
    timeline,
    summary,
    evaluation,
    importance,
    pipeline,
  }));
  cache.catch(() => (cache = null)); // let a later visit retry after a failed load
  return cache;
}

export function useSiteData(): { data: SiteData | null; error: string | null } {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadSiteData().then(
      (d) => alive && setData(d),
      (e: Error) => alive && setError(e.message)
    );
    return () => {
      alive = false;
    };
  }, []);
  return { data, error };
}

export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
export const num = (v: number) => new Intl.NumberFormat('en-US').format(v);
