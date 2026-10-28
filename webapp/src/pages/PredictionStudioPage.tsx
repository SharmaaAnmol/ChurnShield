import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Sliders,
  Clock,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Calendar,
  Layers,
  Activity,
  GitCompare,
  CheckCircle2,
  ArrowRightLeft,
  Scale,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Info,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { runLocalModelInference, ClientInferenceResult } from '../lib/data/model-inference-engine';
import { predictCustomer } from '../lib/api/prediction-client';
import { formatPercent, formatCurrency } from '../lib/utils';

// Common Brazilian states for quick selection
const POPULAR_STATES = [
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'DF', name: 'Distrito Federal' },
];

const ALL_STATES = [
  'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF', 'ES', 'GO',
  'PE', 'CE', 'PA', 'MT', 'MA', 'MS', 'PB', 'PI', 'RN', 'AL',
  'SE', 'TO', 'RO', 'AM', 'AC', 'AP', 'RR',
];

interface ScenarioPreset {
  id: string;
  title: string;
  tagline: string;
  recency: number;
  tenure: number;
  orders: number;
  recentOrders: number;
  spend: number;
  state: string;
  freightRatio: number;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'active_repeat',
    title: 'Active Multi-Order Buyer',
    tagline: 'Ordered 14 days ago, 3 lifetime orders, high recent velocity',
    recency: 14,
    tenure: 140,
    orders: 3,
    recentOrders: 2,
    spend: 380,
    state: 'SP',
    freightRatio: 0.12,
  },
  {
    id: 'cooling_off',
    title: 'Cooling-Off Customer',
    tagline: 'Ordered 55 days ago, 2 lifetime orders, fading activity',
    recency: 55,
    tenure: 110,
    orders: 2,
    recentOrders: 1,
    spend: 180,
    state: 'RJ',
    freightRatio: 0.18,
  },
  {
    id: 'lapsed_single',
    title: 'Lapsed Single-Order Buyer',
    tagline: 'Single purchase 160 days ago, zero activity in recent period',
    recency: 160,
    tenure: 160,
    orders: 1,
    recentOrders: 0,
    spend: 75,
    state: 'MG',
    freightRatio: 0.28,
  },
];

export function PredictionStudioPage() {
  // 1. User-Controlled Timeline Settings
  const [snapshotDate, setSnapshotDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [predictionHorizon, setPredictionHorizon] = useState<number>(90);
  const [lookbackWindow, setLookbackWindow] = useState<number>(180);

  // 2. Interactive Customer Variables
  const [recencyDays, setRecencyDays] = useState<number>(50);
  const [tenureDays, setTenureDays] = useState<number>(120);
  const [orderCount, setOrderCount] = useState<number>(2);
  const [ordersRecent90d, setOrdersRecent90d] = useState<number>(1);
  const [totalSpend, setTotalSpend] = useState<number>(180);
  const [customerState, setCustomerState] = useState<string>('SP');
  const [freightRatio, setFreightRatio] = useState<number>(0.16);

  // 3. What-If Simulation Toggle
  const [simulateIntervention, setSimulateIntervention] = useState(false);
  const [simulatedRecency] = useState(12);

  // Active preset
  const [activePreset, setActivePreset] = useState<string>('');

  // Debounced live preview state (350ms)
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Prediction states
  const [predictionResult, setPredictionResult] = useState<ClientInferenceResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [hasRunPrediction, setHasRunPrediction] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Stage 4: What-If Scenario Comparison Baseline (Scenario A)
  const [baselineScenario, setBaselineScenario] = useState<{
    recencyDays: number;
    tenureDays: number;
    orderCount: number;
    ordersRecent90d: number;
    totalSpend: number;
    customerState: string;
    freightRatio: number;
    result: ClientInferenceResult;
    savedAt: string;
  } | null>(null);

  // Stage 5: Feature Sensitivity Analysis State
  const [sensitivityFeature, setSensitivityFeature] = useState<
    'recency_days' | 'total_spend' | 'orders_recent_90d' | 'freight_ratio'
  >('recency_days');

  // Apply scenario preset
  const applyPreset = (preset: ScenarioPreset) => {
    setActivePreset(preset.id);
    setRecencyDays(preset.recency);
    setTenureDays(preset.tenure);
    setOrderCount(preset.orders);
    setOrdersRecent90d(preset.recentOrders);
    setTotalSpend(preset.spend);
    setCustomerState(preset.state);
    setFreightRatio(preset.freightRatio);
    setIsStale(true);
  };

  // Build full 21-feature payload dynamically
  const buildPayload = (effectiveRecency: number, effectiveRecentOrders: number) => {
    const hasMultiple = orderCount >= 2 ? 1 : 0;
    const aov = totalSpend / Math.max(1, orderCount);
    const recentSpend =
      effectiveRecentOrders > 0
        ? totalSpend * (effectiveRecentOrders / Math.max(1, orderCount))
        : 0.0;
    const orderRatio =
      orderCount > 0 ? Math.min(1.0, effectiveRecentOrders / orderCount) : 0.0;
    const spendRatio =
      totalSpend > 0 ? Math.min(1.0, recentSpend / totalSpend) : 0.0;
    const interOrderDays =
      orderCount >= 2 ? (tenureDays - effectiveRecency) / (orderCount - 1) : 180.0;

    return {
      order_count: orderCount,
      total_spend: totalSpend,
      avg_order_value: parseFloat(aov.toFixed(2)),
      median_order_value: parseFloat(aov.toFixed(2)),
      order_value_std: orderCount >= 2 ? parseFloat((aov * 0.15).toFixed(2)) : 0.0,
      total_items: Math.max(orderCount, Math.round(orderCount * 1.2)),
      avg_items_per_order: 1.2,
      total_freight: parseFloat((totalSpend * freightRatio).toFixed(2)),
      distinct_products: Math.max(1, Math.min(orderCount, 3)),
      distinct_sellers: Math.max(1, Math.min(orderCount, 2)),
      orders_recent_90d: effectiveRecentOrders,
      spend_recent_90d: parseFloat(recentSpend.toFixed(2)),
      freight_ratio: freightRatio,
      recency_days: effectiveRecency,
      tenure_days: Math.max(effectiveRecency, tenureDays),
      has_multiple_orders: hasMultiple,
      avg_inter_order_days: parseFloat(Math.max(0, interOrderDays).toFixed(1)),
      std_inter_order_days: orderCount >= 3 ? 12.0 : 0.0,
      order_ratio_recent_vs_earlier: parseFloat(orderRatio.toFixed(3)),
      spend_ratio_recent_vs_earlier: parseFloat(spendRatio.toFixed(3)),
      customer_state: customerState,
    };
  };

  const currentPayload = useMemo(() => {
    return buildPayload(recencyDays, ordersRecent90d);
  }, [recencyDays, tenureDays, orderCount, ordersRecent90d, totalSpend, customerState, freightRatio]);

  // Stage 3: 350ms Debounced live preview inference
  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      const localResult = runLocalModelInference(currentPayload);
      setPredictionResult(localResult);
      setHasRunPrediction(true);
      setIsStale(false);
      setIsDebouncing(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [currentPayload]);

  // What-If Simulated Payload
  const simulatedPayload = useMemo(() => {
    if (!simulateIntervention) return null;
    return buildPayload(simulatedRecency, Math.max(1, ordersRecent90d + 1));
  }, [simulateIntervention, simulatedRecency, recencyDays, tenureDays, orderCount, ordersRecent90d, totalSpend, customerState, freightRatio]);

  // Run model prediction with API verification
  const handleRunPrediction = async () => {
    setIsComputing(true);
    setIsStale(false);
    setHasRunPrediction(true);

    const localResult = runLocalModelInference(currentPayload);

    try {
      const apiResult = await predictCustomer(currentPayload);
      if (apiResult) {
        setPredictionResult({
          ...localResult,
          repeatPurchaseProbability: apiResult.repeat_purchase_probability,
          inactivityRiskScore: apiResult.inactivity_risk_score,
          predictedClass: apiResult.predicted_class,
          predictionLabel: apiResult.prediction_label,
          riskTier: apiResult.risk_tier,
        });
      } else {
        setPredictionResult(localResult);
      }
    } catch {
      setPredictionResult(localResult);
    } finally {
      setIsComputing(false);
    }
  };

  // Stage 4: What-If Comparison Handlers
  const handleSaveBaseline = () => {
    if (!predictionResult) return;
    setBaselineScenario({
      recencyDays,
      tenureDays,
      orderCount,
      ordersRecent90d,
      totalSpend,
      customerState,
      freightRatio,
      result: predictionResult,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  const handleResetToBaseline = () => {
    if (!baselineScenario) return;
    setRecencyDays(baselineScenario.recencyDays);
    setTenureDays(baselineScenario.tenureDays);
    setOrderCount(baselineScenario.orderCount);
    setOrdersRecent90d(baselineScenario.ordersRecent90d);
    setTotalSpend(baselineScenario.totalSpend);
    setCustomerState(baselineScenario.customerState);
    setFreightRatio(baselineScenario.freightRatio);
  };

  const handlePromoteScenarioB = () => {
    if (!predictionResult) return;
    setBaselineScenario({
      recencyDays,
      tenureDays,
      orderCount,
      ordersRecent90d,
      totalSpend,
      customerState,
      freightRatio,
      result: predictionResult,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  const handleClearBaseline = () => {
    setBaselineScenario(null);
  };

  // What-If feature diff computation
  const featureDiff = useMemo(() => {
    if (!baselineScenario) return [];
    const diffs: { name: string; baseVal: string; currentVal: string; delta: string; direction: 'better' | 'worse' | 'neutral' }[] = [];

    if (recencyDays !== baselineScenario.recencyDays) {
      const d = recencyDays - baselineScenario.recencyDays;
      diffs.push({
        name: 'Recency (Days Inactive)',
        baseVal: `${baselineScenario.recencyDays}d`,
        currentVal: `${recencyDays}d`,
        delta: d > 0 ? `+${d}d` : `${d}d`,
        direction: d < 0 ? 'better' : 'worse',
      });
    }

    if (totalSpend !== baselineScenario.totalSpend) {
      const d = totalSpend - baselineScenario.totalSpend;
      diffs.push({
        name: 'Total Spend',
        baseVal: `$${baselineScenario.totalSpend.toFixed(0)}`,
        currentVal: `$${totalSpend.toFixed(0)}`,
        delta: d > 0 ? `+$${d.toFixed(0)}` : `-$${Math.abs(d).toFixed(0)}`,
        direction: d > 0 ? 'better' : 'worse',
      });
    }

    if (orderCount !== baselineScenario.orderCount) {
      const d = orderCount - baselineScenario.orderCount;
      diffs.push({
        name: 'Lifetime Orders',
        baseVal: `${baselineScenario.orderCount}`,
        currentVal: `${orderCount}`,
        delta: d > 0 ? `+${d}` : `${d}`,
        direction: d > 0 ? 'better' : 'worse',
      });
    }

    if (ordersRecent90d !== baselineScenario.ordersRecent90d) {
      const d = ordersRecent90d - baselineScenario.ordersRecent90d;
      diffs.push({
        name: 'Recent 90d Orders',
        baseVal: `${baselineScenario.ordersRecent90d}`,
        currentVal: `${ordersRecent90d}`,
        delta: d > 0 ? `+${d}` : `${d}`,
        direction: d > 0 ? 'better' : 'worse',
      });
    }

    if (customerState !== baselineScenario.customerState) {
      diffs.push({
        name: 'Customer State (UF)',
        baseVal: baselineScenario.customerState,
        currentVal: customerState,
        delta: 'Changed',
        direction: 'neutral',
      });
    }

    if (Math.abs(freightRatio - baselineScenario.freightRatio) > 0.005) {
      const d = (freightRatio - baselineScenario.freightRatio) * 100;
      diffs.push({
        name: 'Freight Ratio',
        baseVal: `${(baselineScenario.freightRatio * 100).toFixed(0)}%`,
        currentVal: `${(freightRatio * 100).toFixed(0)}%`,
        delta: d > 0 ? `+${d.toFixed(0)}%` : `${d.toFixed(0)}%`,
        direction: d < 0 ? 'better' : 'worse',
      });
    }

    return diffs;
  }, [baselineScenario, recencyDays, totalSpend, orderCount, ordersRecent90d, customerState, freightRatio]);

  // Stage 5: Feature Sensitivity Curve Calculation
  const sensitivityData = useMemo(() => {
    let points: number[] = [];
    let currentVal = 0;
    let unit = '';
    let featureLabel = '';

    if (sensitivityFeature === 'recency_days') {
      points = [1, 10, 20, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
      currentVal = recencyDays;
      unit = 'd';
      featureLabel = 'Recency (Days Inactive)';
    } else if (sensitivityFeature === 'total_spend') {
      points = [20, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000];
      currentVal = totalSpend;
      unit = '$';
      featureLabel = 'Total Lifetime Spend';
    } else if (sensitivityFeature === 'orders_recent_90d') {
      points = [0, 1, 2, 3, 4, 5];
      currentVal = ordersRecent90d;
      unit = ' orders';
      featureLabel = 'Orders in Recent 90d';
    } else if (sensitivityFeature === 'freight_ratio') {
      points = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50];
      currentVal = freightRatio;
      unit = '';
      featureLabel = 'Freight Ratio';
    }

    const curve = points.map((val) => {
      let testRecency = recencyDays;
      let testRecentOrders = ordersRecent90d;
      let testSpend = totalSpend;
      let testFreight = freightRatio;

      if (sensitivityFeature === 'recency_days') testRecency = val;
      if (sensitivityFeature === 'orders_recent_90d') testRecentOrders = val;
      if (sensitivityFeature === 'total_spend') testSpend = val;
      if (sensitivityFeature === 'freight_ratio') testFreight = val;

      const aov = testSpend / Math.max(1, orderCount);
      const recentSpend =
        testRecentOrders > 0 ? testSpend * (testRecentOrders / Math.max(1, orderCount)) : 0.0;
      const orderRatio = orderCount > 0 ? Math.min(1.0, testRecentOrders / orderCount) : 0.0;
      const spendRatio = testSpend > 0 ? Math.min(1.0, recentSpend / testSpend) : 0.0;
      const interOrderDays =
        orderCount >= 2 ? (tenureDays - testRecency) / (orderCount - 1) : 180.0;

      const p = {
        order_count: orderCount,
        total_spend: testSpend,
        avg_order_value: parseFloat(aov.toFixed(2)),
        median_order_value: parseFloat(aov.toFixed(2)),
        order_value_std: orderCount >= 2 ? parseFloat((aov * 0.15).toFixed(2)) : 0.0,
        total_items: Math.max(orderCount, Math.round(orderCount * 1.2)),
        avg_items_per_order: 1.2,
        total_freight: parseFloat((testSpend * testFreight).toFixed(2)),
        distinct_products: Math.max(1, Math.min(orderCount, 3)),
        distinct_sellers: Math.max(1, Math.min(orderCount, 2)),
        orders_recent_90d: testRecentOrders,
        spend_recent_90d: parseFloat(recentSpend.toFixed(2)),
        freight_ratio: testFreight,
        recency_days: testRecency,
        tenure_days: Math.max(testRecency, tenureDays),
        has_multiple_orders: orderCount >= 2 ? 1 : 0,
        avg_inter_order_days: parseFloat(Math.max(0, interOrderDays).toFixed(1)),
        std_inter_order_days: orderCount >= 3 ? 12.0 : 0.0,
        order_ratio_recent_vs_earlier: parseFloat(orderRatio.toFixed(3)),
        spend_ratio_recent_vs_earlier: parseFloat(spendRatio.toFixed(3)),
        customer_state: customerState,
      };

      const res = runLocalModelInference(p);
      return {
        val,
        displayVal: sensitivityFeature === 'freight_ratio' ? `${Math.round(val * 100)}%` : `${val}${unit}`,
        riskPct: parseFloat((res.inactivityRiskScore * 100).toFixed(1)),
        repeatPct: parseFloat((res.repeatPurchaseProbability * 100).toFixed(1)),
      };
    });

    // Compute steepest gradient (max change in risk between adjacent points)
    let maxSlope = 0;
    let steepStart = points[0];
    let steepEnd = points[1] || points[0];
    for (let i = 0; i < curve.length - 1; i++) {
      const slope = Math.abs(curve[i + 1].riskPct - curve[i].riskPct) / Math.max(0.001, Math.abs(curve[i + 1].val - curve[i].val));
      if (slope > maxSlope) {
        maxSlope = slope;
        steepStart = curve[i].val;
        steepEnd = curve[i + 1].val;
      }
    }

    return { curve, currentVal, unit, featureLabel, steepStart, steepEnd, maxSlope };
  }, [sensitivityFeature, recencyDays, ordersRecent90d, totalSpend, freightRatio, orderCount, tenureDays, customerState]);

  // What-If simulated prediction result
  const simulatedResult = useMemo(() => {
    if (!simulateIntervention || !simulatedPayload) return null;
    return runLocalModelInference(simulatedPayload);
  }, [simulateIntervention, simulatedPayload]);

  // Recency visual indicator
  const recencyStatus = useMemo(() => {
    if (recencyDays <= 30) return { label: 'Active Cadence', color: '#447A56', stage: 'active' };
    if (recencyDays <= 90) return { label: 'Cooling Off', color: '#C48232', stage: 'cooling' };
    return { label: 'Severe Inactivity', color: '#C82038', stage: 'danger' };
  }, [recencyDays]);

  // Multidimensional Customer Radar Data
  const radarData = useMemo(() => {
    const recencyScore = Math.max(5, Math.min(100, Math.round(100 - (recencyDays / lookbackWindow) * 100)));
    const frequencyScore = Math.min(100, Math.round((orderCount / 6) * 100));
    const spendScore = Math.min(100, Math.round((totalSpend / 800) * 100));
    const recentVelocityScore = Math.min(100, Math.round((ordersRecent90d / Math.max(1, orderCount)) * 100));
    const tenureScore = Math.min(100, Math.round((tenureDays / lookbackWindow) * 100));

    return [
      { subject: 'Recency Velocity', score: recencyScore, fullMark: 100 },
      { subject: 'Order Frequency', score: frequencyScore, fullMark: 100 },
      { subject: 'Spend Volume', score: spendScore, fullMark: 100 },
      { subject: 'Recent Share', score: recentVelocityScore, fullMark: 100 },
      { subject: 'Account Tenure', score: tenureScore, fullMark: 100 },
    ];
  }, [recencyDays, orderCount, totalSpend, ordersRecent90d, tenureDays, lookbackWindow]);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-[#29332B] bg-[#111611] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="crimson" size="sm">
                Prediction Studio
              </Badge>
              <Badge variant="forest" size="sm">
                Live Model Inference
              </Badge>
            </div>
            <span className="text-[10px] font-tech uppercase tracking-[0.2em] text-[#C82038]">
              Interactive Simulation
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-normal text-[#F2F0E8] leading-tight">
              Customer Retention Simulator & Inference Studio
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#A6AEA5] max-w-2xl leading-relaxed">
              Define custom observation horizons, RFM purchase histories, and state origins. The trained Balanced Logistic
              Regression model calculates 90-day repeat purchase probability vs. inactivity risk in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRecencyDays(60);
                setTenureDays(120);
                setOrderCount(1);
                setOrdersRecent90d(1);
                setTotalSpend(120);
                setCustomerState('SP');
                setFreightRatio(0.18);
                setActivePreset('');
                setIsStale(true);
              }}
              className="text-xs text-[#A6AEA5] hover:text-[#F2F0E8]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Inputs
            </Button>
          </div>
        </div>
      </div>

      {/* 2. User-Selected Observation Timeline Bar */}
      <Card className="p-5 border-[#29332B] bg-[#111611]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#171D18] text-[#447A56] border border-[#29332B]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#F2F0E8]">Observation Timeline Bounds</h3>
              <p className="text-xs text-[#A6AEA5]">
                Configure simulation cutoff date and forecasting lookahead horizon
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Snapshot Date Input */}
            <div className="flex items-center gap-2 rounded-md bg-[#090B09] px-3 py-1.5 border border-[#29332B] text-xs text-[#A6AEA5]">
              <Calendar className="h-3.5 w-3.5 text-[#447A56]" />
              <span>Snapshot Date:</span>
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => {
                  setSnapshotDate(e.target.value);
                  setIsStale(true);
                }}
                className="bg-transparent text-[#F2F0E8] font-tech font-medium focus:outline-none cursor-pointer"
              />
            </div>

            {/* Lookback Window Toggle */}
            <div className="flex items-center gap-1.5 rounded-md bg-[#090B09] px-2.5 py-1.5 border border-[#29332B] text-xs text-[#A6AEA5]">
              <span>Lookback:</span>
              {[90, 180, 365].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setLookbackWindow(w);
                    if (recencyDays > w) setRecencyDays(w);
                    if (tenureDays > w) setTenureDays(w);
                    setIsStale(true);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-tech font-medium transition-colors cursor-pointer ${
                    lookbackWindow === w
                      ? 'bg-[#214D35] text-[#F2F0E8]'
                      : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                  }`}
                >
                  {w}d
                </button>
              ))}
            </div>

            {/* Prediction Horizon Selector */}
            <div className="flex items-center gap-1.5 rounded-md bg-[#090B09] px-2.5 py-1.5 border border-[#29332B] text-xs text-[#A6AEA5]">
              <Layers className="h-3.5 w-3.5 text-[#447A56]" />
              <span>Horizon:</span>
              {[30, 60, 90].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPredictionHorizon(h)}
                  className={`px-2 py-0.5 rounded text-xs font-tech font-medium transition-colors cursor-pointer ${
                    predictionHorizon === h
                      ? 'bg-[#214D35] text-[#F2F0E8]'
                      : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                  }`}
                >
                  {h}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Quick Scenario Presets */}
      <div className="space-y-2">
        <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5] block">
          Choose a Starting Customer Archetype:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#102016] border-[#447A56] shadow-sm'
                    : 'bg-[#111611] border-[#29332B] hover:border-[#447A56]/60 hover:bg-[#171D18]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F2F0E8]">{preset.title}</span>
                  {isSelected && (
                    <Badge variant="forest" size="sm">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#A6AEA5] leading-snug">{preset.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Simulation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Timeline & Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Interactive Customer Lifecycle Timeline */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#29332B]">
              <div>
                <h3 className="text-sm font-semibold text-[#F2F0E8] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#447A56]" />
                  <span>Interactive Customer Timeline</span>
                </h3>
                <p className="text-xs text-[#A6AEA5] mt-0.5">
                  Drag the sliders to adjust when this customer joined and when they last ordered
                </p>
              </div>
              <Badge
                variant={recencyDays <= 30 ? 'forest' : recencyDays <= 90 ? 'amber' : 'crimson'}
                size="sm"
              >
                {recencyStatus.label}
              </Badge>
            </div>

            {/* Visual Timeline Diagram */}
            <div className="mt-6 mb-8 pt-4 pb-2 px-2">
              <div className="relative h-14 w-full">
                {/* Lookback Window Bar */}
                <div className="absolute left-0 right-[35%] top-4 h-4 rounded-l-md bg-[#171D18] border-y border-l border-[#29332B] flex items-center justify-between px-3">
                  <span className="text-[10px] font-tech text-[#A6AEA5]">-{lookbackWindow}d Lookback</span>
                  <span className="text-[10px] font-tech text-[#A6AEA5]">Velocity Zone</span>
                </div>

                {/* Future Prediction Horizon Bar */}
                <div className="absolute right-0 w-[35%] top-4 h-4 rounded-r-md bg-[#214D35]/20 border border-dashed border-[#447A56]/60 flex items-center justify-center">
                  <span className="text-[10px] font-tech text-[#447A56] font-semibold">
                    +{predictionHorizon}d Outcome Horizon
                  </span>
                </div>

                {/* Observation Date Cutoff Marker */}
                <div className="absolute right-[35%] -top-1 bottom-0 w-0.5 bg-[#C82038] flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-[#E33B4F] -mt-1 shadow-[0_0_8px_#C82038]" />
                  <span className="text-[9px] font-tech text-[#E33B4F] whitespace-nowrap -mt-6 font-bold uppercase tracking-wider">
                    {snapshotDate} (Cutoff)
                  </span>
                </div>

                {/* Dynamic Last Order Pin */}
                <div
                  className="absolute top-1 flex flex-col items-center transition-all duration-150"
                  style={{
                    left: `${Math.max(5, Math.min(62, 65 - (recencyDays / lookbackWindow) * 65))}%`,
                  }}
                >
                  <div
                    className="h-3 w-3 rounded-full border-2 border-white transition-colors"
                    style={{ backgroundColor: recencyStatus.color }}
                  />
                  <div className="text-[10px] font-tech font-bold mt-1 whitespace-nowrap text-[#F2F0E8] bg-[#090B09] px-1.5 py-0.5 rounded border border-[#29332B] shadow">
                    Last Order: {recencyDays}d ago
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-tech text-[#A6AEA5] pt-2 border-t border-[#29332B]">
                <span>-{lookbackWindow}d First Contact</span>
                <span>-90d Quarter Mark</span>
                <span className="text-[#E33B4F]">Day 0 (Observation)</span>
                <span className="text-[#447A56]">+{predictionHorizon}d Forecast</span>
              </div>
            </div>

            {/* Sliders & Direct Numeric Steppers */}
            <div className="space-y-5 pt-2">
              {/* Recency Slider & Accessible Direct Controls */}
              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F2F0E8]">
                    Days Since Last Order (Recency)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRecencyDays((prev) => Math.max(1, prev - 10))}
                      className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#214D35] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors"
                      title="-10 days"
                    >
                      -10d
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecencyDays((prev) => Math.max(1, prev - 1))}
                      className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#214D35] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors"
                      title="-1 day"
                    >
                      -1d
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={lookbackWindow}
                      value={recencyDays}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(lookbackWindow, parseInt(e.target.value, 10) || 1));
                        setRecencyDays(val);
                        if (val > tenureDays) setTenureDays(val);
                      }}
                      className="w-14 h-6 text-center rounded bg-[#111611] border border-[#29332B] font-tech text-xs text-[#F2F0E8] focus:border-[#447A56] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(lookbackWindow, recencyDays + 1);
                        setRecencyDays(val);
                        if (val > tenureDays) setTenureDays(val);
                      }}
                      className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#214D35] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors"
                      title="+1 day"
                    >
                      +1d
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(lookbackWindow, recencyDays + 10);
                        setRecencyDays(val);
                        if (val > tenureDays) setTenureDays(val);
                      }}
                      className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#214D35] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors"
                      title="+10 days"
                    >
                      +10d
                    </button>
                    <span
                      className="h-2 w-2 rounded-full shrink-0 ml-1"
                      style={{ backgroundColor: recencyStatus.color }}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max={lookbackWindow}
                  step="1"
                  value={recencyDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setRecencyDays(val);
                    if (val > tenureDays) setTenureDays(val);
                  }}
                  className="w-full accent-[#447A56] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
                  <span>1d (Yesterday)</span>
                  <span>90d (Quarter Boundary)</span>
                  <span>{lookbackWindow}d (Severely Lapsed)</span>
                </div>
              </div>

              {/* Tenure Slider & Accessible Direct Input */}
              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F2F0E8]">
                    Account Tenure (Days Since Customer Joined)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max={lookbackWindow}
                      value={tenureDays}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(lookbackWindow, parseInt(e.target.value, 10) || 1));
                        setTenureDays(val);
                        if (val < recencyDays) setRecencyDays(val);
                      }}
                      className="w-16 h-6 text-center rounded bg-[#111611] border border-[#29332B] font-tech text-xs text-[#F2F0E8] focus:border-[#447A56] focus:outline-none"
                    />
                    <span className="text-xs font-tech text-[#A6AEA5]">days</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max={lookbackWindow}
                  step="1"
                  value={tenureDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setTenureDays(val);
                    if (val < recencyDays) setRecencyDays(val);
                  }}
                  className="w-full accent-[#447A56] cursor-pointer"
                />
              </div>
            </div>
          </Card>

          {/* Card: Purchasing Frequency & Spend Controls */}
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#F2F0E8] flex items-center gap-2 border-b border-[#29332B] pb-3">
              <ShoppingBag className="h-4 w-4 text-[#447A56]" />
              <span>Purchasing Cadence & Value</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Count Stepper */}
              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
                <span className="text-xs font-semibold text-[#F2F0E8]">Lifetime Orders</span>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setOrderCount(num);
                        if (ordersRecent90d > num) setOrdersRecent90d(num);
                      }}
                      className={`flex-1 py-1.5 rounded-md text-xs font-tech font-semibold transition-all cursor-pointer ${
                        orderCount === num
                          ? 'bg-[#214D35] text-[#F2F0E8] border border-[#447A56]'
                          : 'bg-[#171D18] text-[#A6AEA5] hover:text-[#F2F0E8]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#A6AEA5]">
                  {orderCount >= 2 ? 'Multi-order buyer (2.3% of platform)' : 'Single purchase buyer'}
                </p>
              </div>

              {/* Orders in Recent Window */}
              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
                <span className="text-xs font-semibold text-[#F2F0E8]">Orders in Recent 90 Days</span>
                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={num > orderCount}
                      onClick={() => setOrdersRecent90d(num)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-tech font-semibold transition-all cursor-pointer ${
                        ordersRecent90d === num
                          ? 'bg-[#214D35] text-[#F2F0E8] border border-[#447A56]'
                          : num > orderCount
                          ? 'opacity-25 pointer-events-none bg-[#171D18] text-[#A6AEA5]'
                          : 'bg-[#171D18] text-[#A6AEA5] hover:text-[#F2F0E8]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#A6AEA5]">
                  Top predictor in permutation importance ranking
                </p>
              </div>
            </div>

            {/* Total Spend Slider & Accessible Numeric Input */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F2F0E8]">Total Lifetime Spend</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-tech text-[#A6AEA5]">$</span>
                  <input
                    type="number"
                    min="20"
                    max="2500"
                    step="10"
                    value={totalSpend}
                    onChange={(e) => setTotalSpend(Math.max(20, Math.min(2500, parseFloat(e.target.value) || 20)))}
                    className="w-20 h-6 text-right px-1.5 rounded bg-[#111611] border border-[#29332B] font-tech text-xs text-[#447A56] font-bold focus:border-[#447A56] focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="20"
                max="2500"
                step="10"
                value={totalSpend}
                onChange={(e) => setTotalSpend(parseFloat(e.target.value))}
                className="w-full accent-[#447A56] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
                <span>$20 (Low basket)</span>
                <span>$106 (Platform Median)</span>
                <span>$2,500+ (High Value)</span>
              </div>
            </div>

            {/* Geographic State Selection */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F2F0E8]">Customer State (UF)</span>
                <span className="font-tech text-xs text-[#447A56]">{customerState}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {POPULAR_STATES.map((st) => (
                  <button
                    key={st.uf}
                    type="button"
                    onClick={() => setCustomerState(st.uf)}
                    className={`px-3 py-1.5 rounded-md text-xs font-tech font-medium border transition-colors cursor-pointer ${
                      customerState === st.uf
                        ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56]'
                        : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B] hover:border-[#447A56]/60 hover:text-[#F2F0E8]'
                    }`}
                  >
                    {st.uf}
                  </button>
                ))}
                <select
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="rounded-md bg-[#171D18] px-2 py-1 text-xs text-[#F2F0E8] border border-[#29332B] font-tech cursor-pointer"
                >
                  {ALL_STATES.map((s) => (
                    <option key={s} value={s} className="bg-[#111611] text-[#F2F0E8]">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions: Recalculate + What-If Baseline Capture */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRunPrediction}
                  disabled={isComputing}
                  className="flex-1 text-sm font-semibold h-12 shadow-xl shadow-[#C82038]/20"
                >
                  {isComputing ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin text-white mr-2" />
                      <span>Remote Server Inference...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      <span>Verify Model Prediction</span>
                    </>
                  )}
                </Button>

                <Button
                  variant={baselineScenario ? 'outline' : 'secondary'}
                  size="lg"
                  onClick={handleSaveBaseline}
                  className="h-12 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-[#447A56] cursor-pointer"
                  title="Capture current inputs as fixed Baseline Scenario A"
                >
                  <GitCompare className="h-4 w-4 text-[#447A56]" />
                  <span>{baselineScenario ? 'Update Baseline (A)' : 'Save as Baseline (A)'}</span>
                </Button>
              </div>

              {/* Status and Telemetry Bar */}
              <div className="flex items-center justify-between text-[11px] text-[#A6AEA5] pt-1 px-1">
                <div className="flex items-center gap-1.5 font-tech">
                  {isDebouncing ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-[#E33B4F] animate-ping" />
                      <span className="text-[#E33B4F]">Calculating 350ms live preview...</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-[#447A56]" />
                      <span className="text-[#447A56]">350ms live preview synchronized</span>
                    </>
                  )}
                </div>
                {baselineScenario && (
                  <span className="font-tech text-[#C48232] flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    Baseline A locked ({baselineScenario.savedAt})
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Visual Charts & Multidimensional Graphs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stale Warning Banner */}
          {isStale && hasRunPrediction && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-[#C48232]/15 border border-[#C48232]/30 p-3.5 text-xs text-[#C48232] flex items-center justify-between gap-3 shadow"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C48232]" />
                <span>Variables modified. Click "Run Model Prediction" to update charts.</span>
              </div>
              <Badge variant="amber" size="sm">
                Unsaved
              </Badge>
            </motion.div>
          )}

          {/* Idle Prompt (Before First Prediction) */}
          {!hasRunPrediction && (
            <Card className="p-8 text-center border-dashed border-[#29332B] bg-[#111611]/70 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171D18] text-[#447A56] border border-[#29332B] shadow-inner">
                <Sliders className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-[#F2F0E8]">Interactive Studio Ready</h3>
                <p className="mt-2 text-xs text-[#A6AEA5] max-w-sm mx-auto leading-relaxed">
                  Adjust the timeline, order cadence, and spend sliders, then click{' '}
                  <span className="text-[#C82038] font-semibold">Run Model Prediction</span> to generate
                  instant risk scores, feature impact waterfalls, radar footprints, and sigmoid curves.
                </p>
              </div>

              {/* Multidimensional Radar Footprint Preview */}
              <div className="pt-4 border-t border-[#29332B]">
                <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5] block mb-2">
                  Live Behavioral Footprint:
                </span>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#29332B" />
                      <PolarAngleAxis dataKey="subject" stroke="#A6AEA5" fontSize={9} />
                      <PolarRadiusAxis domain={[0, 100]} stroke="#29332B" fontSize={8} />
                      <Radar name="Customer" dataKey="score" stroke="#447A56" fill="#447A56" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          )}

          {/* Prediction Results & Interactive Visuals */}
          {predictionResult && (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Stage 4: What-If Scenario Comparison Card (A vs B) */}
                {baselineScenario && (
                  <Card className="border-[#447A56] bg-[#102016]/40 shadow-xl overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#214D35] via-[#447A56] to-[#C82038]" />
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GitCompare className="h-4 w-4 text-[#447A56]" />
                          <CardTitle className="text-base text-[#F2F0E8]">
                            What-If Scenario Comparison
                          </CardTitle>
                          <Badge variant="forest" size="sm">
                            Active Baseline (A)
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetToBaseline}
                            className="h-7 text-xs text-[#A6AEA5] hover:text-[#F2F0E8] cursor-pointer"
                            title="Reset all inputs back to Baseline (Scenario A)"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset to A
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePromoteScenarioB}
                            className="h-7 text-xs text-[#447A56] hover:text-[#F2F0E8] cursor-pointer"
                            title="Promote Scenario B to be the new Baseline A"
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            Promote B
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearBaseline}
                            className="h-7 text-xs text-[#C82038] hover:text-[#E33B4F] cursor-pointer"
                            title="Dismiss comparison"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Evaluating live counterfactual Scenario B divergence against locked Baseline Scenario A
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-1">
                      {/* Side-by-Side Metric Comparison */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Scenario A Card */}
                        <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-tech tracking-wider text-[#A6AEA5]">
                              Scenario A (Baseline)
                            </span>
                            <Badge variant="outline" size="sm" className="text-[9px]">
                              {baselineScenario.savedAt}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A6AEA5] block font-tech">Inactivity Risk:</span>
                            <span className="font-tech text-xl font-bold text-[#E33B4F]">
                              {(baselineScenario.result.inactivityRiskScore * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#A6AEA5] block font-tech">Repeat Prob:</span>
                            <span className="font-tech text-sm font-semibold text-[#447A56]">
                              {(baselineScenario.result.repeatPurchaseProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="pt-1">
                            <Badge
                              variant={baselineScenario.result.predictedClass === 1 ? 'forest' : 'crimson'}
                              size="sm"
                            >
                              {baselineScenario.result.predictedClass === 1 ? 'Repeat' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>

                        {/* Scenario B Card */}
                        <div className="rounded-xl bg-[#111611] p-3.5 border border-[#447A56] space-y-2 relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-tech tracking-wider text-[#447A56] font-semibold">
                              Scenario B (Current)
                            </span>
                            <span className="h-2 w-2 rounded-full bg-[#447A56] animate-pulse" />
                          </div>

                          <div>
                            <span className="text-[10px] text-[#A6AEA5] block font-tech">Inactivity Risk:</span>
                            <div className="flex items-baseline gap-2">
                              <span className="font-tech text-xl font-bold text-[#F2F0E8]">
                                {(predictionResult.inactivityRiskScore * 100).toFixed(1)}%
                              </span>
                              {(() => {
                                const delta = (predictionResult.inactivityRiskScore - baselineScenario.result.inactivityRiskScore) * 100;
                                return (
                                  <span
                                    className={`font-tech text-xs font-bold px-1.5 py-0.5 rounded ${
                                      delta < -0.05
                                        ? 'bg-[#214D35] text-[#F2F0E8]'
                                        : delta > 0.05
                                        ? 'bg-[#C82038]/30 text-[#E33B4F]'
                                        : 'bg-[#171D18] text-[#A6AEA5]'
                                    }`}
                                  >
                                    {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}% pts
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#A6AEA5] block font-tech">Repeat Prob:</span>
                            <div className="flex items-baseline gap-2">
                              <span className="font-tech text-sm font-semibold text-[#447A56]">
                                {(predictionResult.repeatPurchaseProbability * 100).toFixed(1)}%
                              </span>
                              {(() => {
                                const delta = (predictionResult.repeatPurchaseProbability - baselineScenario.result.repeatPurchaseProbability) * 100;
                                return (
                                  <span
                                    className={`font-tech text-[10px] ${
                                      delta > 0.05 ? 'text-[#447A56]' : delta < -0.05 ? 'text-[#C82038]' : 'text-[#A6AEA5]'
                                    }`}
                                  >
                                    ({delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}% pts)
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="pt-1">
                            <Badge
                              variant={predictionResult.predictedClass === 1 ? 'forest' : 'crimson'}
                              size="sm"
                            >
                              {predictionResult.predictedClass === 1 ? 'Repeat' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Feature Parameter Divergence Diff */}
                      <div className="rounded-xl bg-[#090B09] p-3 border border-[#29332B] space-y-2">
                        <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5] block">
                          Parameter Divergence ({featureDiff.length} modified):
                        </span>
                        {featureDiff.length === 0 ? (
                          <p className="text-[11px] text-[#A6AEA5] italic">
                            Scenario B matches Baseline A. Tweak recency, spend, or order cadence on the left to inspect divergence.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {featureDiff.map((diff, i) => (
                              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#29332B]/60 last:border-0">
                                <span className="text-[#A6AEA5] font-medium">{diff.name}</span>
                                <div className="flex items-center gap-2 font-tech">
                                  <span className="text-[#A6AEA5] line-through text-[11px]">{diff.baseVal}</span>
                                  <span className="text-[#F2F0E8] font-bold">{diff.currentVal}</span>
                                  <span
                                    className={`text-[10px] px-1 rounded ${
                                      diff.direction === 'better'
                                        ? 'text-[#447A56] bg-[#214D35]/30'
                                        : diff.direction === 'worse'
                                        ? 'text-[#E33B4F] bg-[#C82038]/20'
                                        : 'text-[#A6AEA5] bg-[#171D18]'
                                    }`}
                                  >
                                    {diff.delta}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Analytical Causal Disclaimer */}
                      <div className="rounded-lg bg-[#090B09]/80 p-2.5 border border-[#29332B] text-[10px] text-[#A6AEA5] leading-relaxed flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-[#447A56] shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-[#F2F0E8]">Analytical Note:</strong> What-If comparison reflects statistical model sensitivity across hypothetical input variations, not empirical causal guarantees of outreach.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 1. Primary Verdict Card with Risk Thermometer */}
                <Card className="overflow-hidden border-[#29332B] shadow-2xl">
                  <div
                    className={`h-2.5 w-full ${
                      predictionResult.predictedClass === 1 ? 'bg-[#447A56]' : 'bg-[#C82038]'
                    }`}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5]">
                        Prediction Verdict
                      </span>
                      <Badge
                        variant={predictionResult.predictedClass === 1 ? 'forest' : 'crimson'}
                        size="md"
                      >
                        {predictionResult.predictedClass === 1
                          ? 'Likely to Repeat'
                          : 'Inactivity / Churn Risk'}
                      </Badge>
                    </div>

                    <CardTitle className="text-xl text-[#F2F0E8] mt-1.5">
                      {predictionResult.predictionLabel}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-5 pt-1">
                    {/* Visual Probability Gauges */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-1.5">
                        <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wide font-tech">
                          Repeat Probability
                        </span>
                        <div className="font-tech text-3xl font-bold text-[#447A56]">
                          {formatPercent(predictionResult.repeatPurchaseProbability, 1)}
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#171D18] overflow-hidden">
                          <div
                            className="h-full bg-[#447A56] rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.max(5, predictionResult.repeatPurchaseProbability * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[#A6AEA5] font-tech">Cutoff: ≥50% for repeat</span>
                      </div>

                      <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-1.5">
                        <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wide font-tech">
                          Inactivity Risk Score
                        </span>
                        <div className="font-tech text-3xl font-bold text-[#E33B4F]">
                          {formatPercent(predictionResult.inactivityRiskScore, 1)}
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#171D18] overflow-hidden">
                          <div
                            className="h-full bg-[#C82038] rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.max(5, predictionResult.inactivityRiskScore * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[#A6AEA5] font-tech">Formula: 1 - P(repeat)</span>
                      </div>
                    </div>

                    {/* Summary Text */}
                    <div className="rounded-xl bg-[#111611] p-4 border border-[#29332B] text-xs text-[#A6AEA5] leading-relaxed">
                      {predictionResult.summary}
                    </div>

                    {/* Actionable Playbook */}
                    <div className="rounded-xl bg-[#102016]/40 p-4 border border-[#214D35] text-xs text-[#A6AEA5] space-y-1">
                      <span className="font-semibold text-[#447A56] block">Recommended Retention Play</span>
                      <p>{predictionResult.recommendedAction}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage 5: Feature Sensitivity Analysis Card */}
                <Card className="p-5 border-[#29332B] bg-[#111611]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#29332B] pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-[#447A56]" />
                        <h4 className="text-xs font-semibold text-[#F2F0E8]">
                          Feature Sensitivity Curve & Non-Linear Gradient
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#A6AEA5] mt-0.5">
                        Single-feature parameter sweep holding all other customer features fixed
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'recency_days' as const, label: 'Recency' },
                        { id: 'total_spend' as const, label: 'Spend' },
                        { id: 'orders_recent_90d' as const, label: '90d Orders' },
                        { id: 'freight_ratio' as const, label: 'Freight %' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSensitivityFeature(tab.id)}
                          className={`px-2 py-1 rounded text-[11px] font-tech font-medium transition-colors cursor-pointer ${
                            sensitivityFeature === tab.id
                              ? 'bg-[#214D35] text-[#F2F0E8] border border-[#447A56]'
                              : 'bg-[#171D18] text-[#A6AEA5] border border-[#29332B] hover:text-[#F2F0E8]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sensitivity Recharts Line Chart */}
                  <div className="h-44 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sensitivityData.curve}
                        margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="val"
                          stroke="#4B554D"
                          fontSize={10}
                          tickFormatter={(v) => (sensitivityFeature === 'freight_ratio' ? `${Math.round(v * 100)}%` : `${v}${sensitivityData.unit}`)}
                        />
                        <YAxis
                          stroke="#4B554D"
                          fontSize={10}
                          domain={[0, 100]}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111611',
                            border: '1px solid #29332B',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#F2F0E8',
                          }}
                          formatter={(val: any, name: any) => [
                            `${val}%`,
                            name === 'riskPct' ? 'Inactivity Risk' : 'Repeat Probability',
                          ]}
                          labelFormatter={(label) => `${sensitivityData.featureLabel}: ${label}${sensitivityData.unit}`}
                        />
                        <ReferenceLine
                          x={sensitivityData.currentVal}
                          stroke="#447A56"
                          strokeWidth={2}
                          label={{ value: 'Current', fill: '#447A56', fontSize: 10, position: 'top' }}
                        />
                        <ReferenceLine
                          y={70}
                          stroke="#C82038"
                          strokeDasharray="3 3"
                          label={{ value: '70% Risk Cutoff', fill: '#E33B4F', fontSize: 9, position: 'right' }}
                        />
                        <ReferenceLine
                          y={50}
                          stroke="#C48232"
                          strokeDasharray="3 3"
                          label={{ value: '50% Cutoff', fill: '#C48232', fontSize: 9, position: 'right' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="riskPct"
                          name="riskPct"
                          stroke="#C82038"
                          strokeWidth={2.5}
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                        <Line
                          type="monotone"
                          dataKey="repeatPct"
                          name="repeatPct"
                          stroke="#447A56"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sensitivity Insights Box */}
                  <div className="mt-3 rounded-lg bg-[#090B09] p-3 border border-[#29332B] text-[11px] text-[#A6AEA5] leading-relaxed space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#F2F0E8]">
                      <span>Gradient & Operational Leverage Insight:</span>
                      <span className="font-tech text-[#447A56]">
                        Current: {sensitivityData.currentVal}{sensitivityData.unit}
                      </span>
                    </div>
                    <p>
                      The model displays maximum slope across{' '}
                      <strong className="text-[#F2F0E8]">
                        {sensitivityData.steepStart}{sensitivityData.unit} to {sensitivityData.steepEnd}{sensitivityData.unit}
                      </strong>{' '}
                      (gradient: <span className="font-tech text-[#C48232]">{sensitivityData.maxSlope.toFixed(2)}% pts / unit</span>).
                      Interventions shifting this customer through this feature window deliver maximum sensitivity impact.
                    </p>
                  </div>
                </Card>

                {/* 2. Interactive What-If Simulation Card */}
                <Card className="p-5 border-[#29332B] bg-[#111611] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#29332B] pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#447A56]" />
                      <h4 className="text-xs font-semibold text-[#F2F0E8]">Direct Coupon Re-engagement Scenario</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimulateIntervention(!simulateIntervention)}
                      className={`px-2.5 py-1 rounded text-xs font-tech font-medium border transition-colors cursor-pointer ${
                        simulateIntervention
                          ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56]'
                          : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B]'
                      }`}
                    >
                      {simulateIntervention ? 'Simulation Active' : 'Simulate Re-engagement'}
                    </button>
                  </div>

                  {simulateIntervention && simulatedResult ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-[#A6AEA5] leading-snug">
                        Simulating customer response to an outreach coupon with an immediate re-order within 12 days:
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B]">
                          <span className="text-[10px] text-[#A6AEA5]">Current Inactivity Risk</span>
                          <p className="font-tech text-lg font-bold text-[#E33B4F] mt-0.5">
                            {formatPercent(predictionResult.inactivityRiskScore, 1)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#102016] p-3 border border-[#214D35]">
                          <span className="text-[10px] text-[#447A56]">Post-Intervention Risk</span>
                          <p className="font-tech text-lg font-bold text-[#F2F0E8] mt-0.5 flex items-center gap-1.5">
                            <span>{formatPercent(simulatedResult.inactivityRiskScore, 1)}</span>
                            <span className="text-xs text-[#447A56] font-semibold">
                              (
                              {formatPercent(
                                simulatedResult.inactivityRiskScore - predictionResult.inactivityRiskScore,
                                1
                              )}
                              )
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#A6AEA5]">
                      Click "Simulate Re-engagement" to see how prompt customer re-activation cuts inactivity risk.
                    </p>
                  )}
                </Card>

                {/* 3. Feature Impact Waterfall Chart */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-[#29332B] pb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-[#F2F0E8]">
                        Feature Impact Waterfall (Log-Odds Contribution)
                      </h4>
                      <p className="text-[11px] text-[#A6AEA5]">
                        Exact mathematical pull of each variable on model output
                      </p>
                    </div>
                    <Badge variant="forest" size="sm">
                      Explainability
                    </Badge>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={predictionResult.contributions}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <XAxis
                          type="number"
                          stroke="#4B554D"
                          fontSize={10}
                          tickFormatter={(val) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          stroke="#A6AEA5"
                          fontSize={10}
                          width={140}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111611',
                            border: '1px solid #29332B',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#F2F0E8',
                          }}
                          formatter={(val: any, name: any, item: any) => [
                            `${Number(val).toFixed(3)} log-odds impact (${item.payload.valueDisplay})`,
                            item.payload.direction === 'repeat' ? 'Pushes to Repeat' : 'Pushes to Inactive',
                          ]}
                        />
                        <ReferenceLine x={0} stroke="#29332B" strokeDasharray="3 3" />
                        <Bar
                          dataKey="impact"
                          radius={[3, 3, 3, 3]}
                          isAnimationActive={true}
                          animationDuration={700}
                          animationEasing="ease-out"
                        >
                          {predictionResult.contributions.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.direction === 'repeat' ? '#447A56' : '#C82038'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#A6AEA5] pt-3 border-t border-[#29332B]">
                    <span className="flex items-center gap-1.5 text-[#E33B4F]">
                      <span className="h-2 w-2 rounded-full bg-[#C82038]" />
                      Pushes to Inactivity / Churn
                    </span>
                    <span className="flex items-center gap-1.5 text-[#447A56]">
                      <span className="h-2 w-2 rounded-full bg-[#447A56]" />
                      Pushes to Repeat Purchase
                    </span>
                  </div>
                </Card>

                {/* 4. Multidimensional Radar Footprint */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-[#F2F0E8]">
                        Multidimensional Behavioral Footprint
                      </h4>
                      <p className="text-[11px] text-[#A6AEA5]">
                        Customer posture across velocity, frequency, spend, and tenure
                      </p>
                    </div>
                    <Badge variant="forest" size="sm">
                      Radar Analysis
                    </Badge>
                  </div>

                  <div className="h-52 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#29332B" />
                        <PolarAngleAxis dataKey="subject" stroke="#A6AEA5" fontSize={10} />
                        <PolarRadiusAxis domain={[0, 100]} stroke="#29332B" fontSize={8} />
                        <Radar
                          name="Customer"
                          dataKey="score"
                          stroke={predictionResult.predictedClass === 1 ? '#447A56' : '#C82038'}
                          fill={predictionResult.predictedClass === 1 ? '#447A56' : '#C82038'}
                          fillOpacity={0.25}
                          isAnimationActive={true}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* 5. Real-Time Logistic Sigmoid Curve */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-[#F2F0E8]">
                        Logistic Sigmoid Probability Curve
                      </h4>
                      <p className="text-[11px] text-[#A6AEA5]">
                        Customer log-odds: <span className="font-tech text-[#F2F0E8]">{predictionResult.logit}</span>
                      </p>
                    </div>
                    <span className="font-tech text-xs text-[#447A56] bg-[#102016] border border-[#214D35] px-2 py-0.5 rounded">
                      P = 1 / (1 + e^-z)
                    </span>
                  </div>

                  <div className="h-40 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={predictionResult.sigmoidPoints}
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                      >
                        <XAxis dataKey="z" stroke="#4B554D" fontSize={10} />
                        <YAxis stroke="#4B554D" fontSize={10} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                        <ReferenceLine y={0.5} stroke="#C48232" strokeDasharray="3 3" label={{ value: '50% Cutoff', fill: '#C48232', fontSize: 10 }} />
                        <ReferenceLine x={predictionResult.logit} stroke="#C82038" strokeWidth={2} label={{ value: 'Score', fill: '#E33B4F', fontSize: 10 }} />
                        <Line
                          type="monotone"
                          dataKey="p"
                          stroke="#447A56"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={700}
                          animationEasing="ease-out"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
