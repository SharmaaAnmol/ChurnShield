/**
 * TypeScript Data Models for ChurnShield Web Application
 */

export type RiskTier = 'high' | 'moderate' | 'low';

export interface DataLoadState<T> {
  data: T | null;
  isLoading: boolean;
  isMissing: boolean;
  error: string | null;
}

export interface MetricItem {
  value: number;
  label: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
}

export interface DashboardSummary {
  cohortDate: string;
  totalCustomersEvaluated: number;
  totalCustomersScored: number;
  baseRepeatPurchaseRate: number;
  baseInactivityRate: number;
  championModel: string;
  primaryMetric: {
    name: string;
    value: number;
    liftOverBaseline: number;
  };
  rocAuc: number;
  recallAtDefault: number;
  riskDistribution: {
    highRisk: number; // >= 0.70
    moderateRisk: number; // 0.40 - 0.69
    lowRisk: number; // < 0.40
  };
  retentionCapacityTargetPct: number;
  recommendedContactCount: number;
}

export interface ModelSummary {
  projectName: string;
  version: string;
  targetVariable: string;
  targetDefinition: string;
  inactivityScoreDefinition: string;
  observationWindowDays: number;
  predictionHorizonDays: number;
  championModel: {
    modelType: string;
    hyperparameters: Record<string, string | number | boolean>;
    selectionMetric: string;
    validationPrAuc: number;
    testPrAuc: number;
    prAucLiftOverDummy: number;
  };
  retentionPolicy: {
    policyName: string;
    capacityPct: number;
    captureRate: number;
    lift: number;
  };
  businessImpactScenario: {
    outreachCostPerCustomerBrl: number;
    interventionSuccessRate: number;
    monthlyContributionMarginBrl: number;
    monthsPreserved: number;
    customersContacted: number;
    campaignExpenditureBrl: number;
    estimatedRetainedCustomers: number;
    grossContributionMarginBrl: number;
    netBenefitBrl: number;
    estimatedRoiRatio: number;
    cautionaryNote: string;
  };
  cohortSchedule: {
    trainingCohorts: string[];
    validationCohort: string;
    finalTestCohort: string;
  };
  knownLimitations: string[];
}

export interface EvaluationMetrics {
  evaluationCohort: string;
  testPopulationSize: number;
  actualRepeatPurchasers: number;
  actualInactiveCustomers: number;
  baseRepeatPurchaseRate: number;
  baseInactivityRate: number;
  championModel: string;
  metrics: {
    prAuc: number;
    rocAuc: number;
    precision: number;
    recall: number;
    f1Score: number;
    balancedAccuracy: number;
    accuracy: number;
    mcc: number;
    brierScore: number;
  };
  dummyBaselineMetrics: {
    prAuc: number;
    rocAuc: number;
  };
  prAucLiftOverDummy: number;
  confusionMatrix: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
  };
}

export interface FeatureImportanceItem {
  feature: string;
  importanceMean: number;
  importanceStd: number;
  rank: number;
  category?: 'order_frequency' | 'spend_behavior' | 'recency_tenure' | 'logistics' | 'geography';
  interpretation?: string;
}

export interface CustomerPrediction {
  customerUniqueId: string;
  observationDate: string;
  repeatPurchaseProbability: number;
  inactivityRiskScore: number;
  actualRepeatPurchase?: number; // 0 or 1, if ground truth known
  priorityRetentionTarget: boolean;
  riskTier: RiskTier;
  // Feature snapshot fields (optional / joined)
  orderCount?: number;
  totalSpend?: number;
  avgOrderValue?: number;
  ordersRecent90d?: number;
  spendRecent90d?: number;
  recencyDays?: number;
  tenureDays?: number;
  customerState?: string;
  totalFreight?: number;
  spendRatioRecentVsEarlier?: number;
}

export interface CustomerFilterParams {
  searchQuery: string;
  riskTier: 'all' | RiskTier;
  priorityOnly: boolean;
  stateFilter: string;
  sortBy: 'inactivityRisk' | 'repeatProbability' | 'totalSpend' | 'recency' | 'orderCount';
  sortOrder: 'asc' | 'desc';
}
