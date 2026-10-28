import { z } from 'zod';

/**
 * Zod schemas for validating static exports
 */

export const ConfusionMatrixSchema = z.object({
  tn: z.coerce.number().optional(),
  fp: z.coerce.number().optional(),
  fn: z.coerce.number().optional(),
  tp: z.coerce.number().optional(),
  trueNegative: z.coerce.number().optional(),
  falsePositive: z.coerce.number().optional(),
  falseNegative: z.coerce.number().optional(),
  truePositive: z.coerce.number().optional(),
});

export const EvaluationMetricsSchema = z.object({
  evaluation_cohort: z.string().optional(),
  evaluationCohort: z.string().optional(),
  test_population_size: z.coerce.number().optional(),
  testPopulationSize: z.coerce.number().optional(),
  actual_repeat_purchasers: z.coerce.number().optional(),
  actualRepeatPurchasers: z.coerce.number().optional(),
  actual_inactive_customers: z.coerce.number().optional(),
  actualInactiveCustomers: z.coerce.number().optional(),
  base_repeat_purchase_rate: z.coerce.number().optional(),
  baseRepeatPurchaseRate: z.coerce.number().optional(),
  base_inactivity_rate: z.coerce.number().optional(),
  baseInactivityRate: z.coerce.number().optional(),
  champion_model: z.string().optional(),
  championModel: z.string().optional(),
  metrics: z.record(z.any()),
  dummy_baseline_metrics: z.record(z.any()).optional(),
  dummyBaselineMetrics: z.record(z.any()).optional(),
  pr_auc_lift_over_dummy: z.coerce.number().optional(),
  prAucLiftOverDummy: z.coerce.number().optional(),
  confusion_matrix: ConfusionMatrixSchema.optional(),
  confusionMatrix: ConfusionMatrixSchema.optional(),
});

export const ModelSummarySchema = z.object({
  project_name: z.string().optional(),
  projectName: z.string().optional(),
  project_version: z.string().optional(),
  version: z.string().optional(),
  target_variable: z.string().optional(),
  targetVariable: z.string().optional(),
  target_definition: z.string().optional(),
  targetDefinition: z.string().optional(),
  inactivity_score_definition: z.string().optional(),
  inactivityScoreDefinition: z.string().optional(),
  observation_window_days: z.coerce.number().optional(),
  observationWindowDays: z.coerce.number().optional(),
  prediction_horizon_days: z.coerce.number().optional(),
  predictionHorizonDays: z.coerce.number().optional(),
  champion_model: z.record(z.any()).optional(),
  championModel: z.record(z.any()).optional(),
  retention_prioritization_policy: z.record(z.any()).optional(),
  retentionPolicy: z.record(z.any()).optional(),
  business_impact_scenario: z.record(z.any()).optional(),
  businessImpactScenario: z.record(z.any()).optional(),
  cohort_schedule: z.record(z.any()).optional(),
  cohortSchedule: z.record(z.any()).optional(),
  known_limitations: z.array(z.string()).optional(),
  knownLimitations: z.array(z.string()).optional(),
});

export const FeatureImportanceItemSchema = z.object({
  feature: z.string(),
  importance_mean: z.coerce.number().optional(),
  importanceMean: z.coerce.number().optional(),
  importance_std: z.coerce.number().optional(),
  importanceStd: z.coerce.number().optional(),
  rank: z.coerce.number().optional(),
  interpretation: z.string().optional(),
  category: z.string().optional(),
});

export const FeatureImportanceListSchema = z.array(FeatureImportanceItemSchema);

export const CustomerPredictionCsvRowSchema = z.object({
  customer_unique_id: z.string(),
  observation_date: z.string().optional(),
  actual_repeat_purchase_next_90d: z.coerce.number().optional(),
  repeat_purchase_probability: z.coerce.number(),
  inactivity_risk_score: z.coerce.number(),
  priority_retention_target_20pct: z.union([z.coerce.number(), z.boolean(), z.string()]).optional(),
  // snapshot features
  order_count: z.coerce.number().optional(),
  total_spend: z.coerce.number().optional(),
  avg_order_value: z.coerce.number().optional(),
  orders_recent_90d: z.coerce.number().optional(),
  spend_recent_90d: z.coerce.number().optional(),
  recency_days: z.coerce.number().optional(),
  tenure_days: z.coerce.number().optional(),
  customer_state: z.string().optional(),
  total_freight: z.coerce.number().optional(),
  spend_ratio_recent_vs_earlier: z.coerce.number().optional(),
});
