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
}

export interface SiteData {
  eda: Eda;
  timeline: Record<string, CohortMetrics>;
  summary: ModelSummary;
}

/** File names, shown on the page as the source of each figure. */
export const SOURCES = {
  eda: 'eda.json',
  timeline: 'timeline_metrics.json',
  summary: 'model_summary.json',
} as const;

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
  ]).then(([eda, timeline, summary]) => ({ eda, timeline, summary }));
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
