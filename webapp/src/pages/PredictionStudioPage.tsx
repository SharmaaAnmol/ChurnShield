import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  MapPin,
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

// Complete Brazilian Federative Units dictionary with full names, regions, economic role, and volume share
const BRAZILIAN_STATES_METADATA: Record<
  string,
  { name: string; region: string; role: string; share: string }
> = {
  SP: { name: 'São Paulo', region: 'Southeast', role: 'Commercial & financial hub; dominant order volume', share: '41.8%' },
  RJ: { name: 'Rio de Janeiro', region: 'Southeast', role: 'Major coastal metro market; 2nd largest volume', share: '12.8%' },
  MG: { name: 'Minas Gerais', region: 'Southeast', role: 'Key inland manufacturing & consumer hub', share: '11.6%' },
  RS: { name: 'Rio Grande do Sul', region: 'South', role: 'Southern industrial & agribusiness center', share: '5.5%' },
  PR: { name: 'Paraná', region: 'South', role: 'Southern trade & agricultural corridor', share: '5.0%' },
  SC: { name: 'Santa Catarina', region: 'South', role: 'Southern high-income coastal region', share: '3.6%' },
  BA: { name: 'Bahia', region: 'Northeast', role: 'Northeastern economic & cultural center', share: '3.4%' },
  DF: { name: 'Distrito Federal (Brasília)', region: 'Central-West', role: 'National capital territory; highest per-capita GDP', share: '2.1%' },
  ES: { name: 'Espírito Santo', region: 'Southeast', role: 'Southeastern coastal port & shipping corridor', share: '2.0%' },
  GO: { name: 'Goiás', region: 'Central-West', role: 'Central agribusiness & transportation crossroads', share: '2.0%' },
  PE: { name: 'Pernambuco', region: 'Northeast', role: 'Northeastern commercial & technology center', share: '1.7%' },
  CE: { name: 'Ceará', region: 'Northeast', role: 'Northeastern maritime & manufacturing hub', share: '1.3%' },
  PA: { name: 'Pará', region: 'North', role: 'Northern Amazonian economic & mineral gateway', share: '1.0%' },
  MT: { name: 'Mato Grosso', region: 'Central-West', role: 'National agricultural export powerhouse', share: '0.9%' },
  MA: { name: 'Maranhão', region: 'Northeast', role: 'Northeastern coastal transit corridor', share: '0.7%' },
  MS: { name: 'Mato Grosso do Sul', region: 'Central-West', role: 'Southern central-west trading hub', share: '0.7%' },
  PB: { name: 'Paraíba', region: 'Northeast', role: 'Northeastern commercial & coastal state', share: '0.5%' },
  PI: { name: 'Piauí', region: 'Northeast', role: 'Northeastern agricultural transition territory', share: '0.5%' },
  RN: { name: 'Rio Grande do Norte', region: 'Northeast', role: 'Northeastern coastal & renewable energy hub', share: '0.5%' },
  AL: { name: 'Alagoas', region: 'Northeast', role: 'Northeastern coastal state', share: '0.4%' },
  SE: { name: 'Sergipe', region: 'Northeast', role: 'Smallest northeastern federative unit', share: '0.3%' },
  TO: { name: 'Tocantins', region: 'North', role: 'Central-northern inland crossroads', share: '0.3%' },
  RO: { name: 'Rondônia', region: 'North', role: 'Western Amazonian trade corridor', share: '0.3%' },
  AM: { name: 'Amazonas', region: 'North', role: 'Northern industrial free trade zone (Manaus)', share: '0.2%' },
  AC: { name: 'Acre', region: 'North', role: 'Western border Amazonian territory', share: '0.1%' },
  AP: { name: 'Amapá', region: 'North', role: 'Northern equatorial coastal territory', share: '0.1%' },
  RR: { name: 'Roraima', region: 'North', role: 'Northernmost federal territory', share: '0.1%' },
};

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

  // Deep Diagnostic Tab State ('waterfall' | 'reengagement' | 'sigmoid')
  const [diagnosticTab, setDiagnosticTab] = useState<'waterfall' | 'reengagement' | 'sigmoid'>('waterfall');

  // Customer State Hover Exploration
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const activeStateInfo = useMemo(() => {
    const target = hoveredState || customerState;
    return BRAZILIAN_STATES_METADATA[target] || {
      name: target,
      region: 'Brazil',
      role: 'Federative Unit',
      share: '—',
    };
  }, [hoveredState, customerState]);

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

  // Interactive Timeline Track Pointer Scrubbing
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const handleTimelinePointerScrub = (clientX: number) => {
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relX / rect.width));
    const cutoffRatio = 0.65;
    const clampedRatio = Math.min(cutoffRatio, Math.max(0.005, ratio));
    const lookbackFraction = (cutoffRatio - clampedRatio) / cutoffRatio;
    const targetRecency = Math.max(1, Math.min(lookbackWindow, Math.round(lookbackFraction * lookbackWindow)));

    setRecencyDays(targetRecency);
    if (targetRecency > tenureDays) {
      setTenureDays(targetRecency);
    }
    setIsStale(true);
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handleTimelinePointerScrub(e.clientX);
    setIsScrubbing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      handleTimelinePointerScrub(e.clientX);
    }
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // safe fallback
      }
    }
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

  // Visual Timeline Metric Coordinate Mapping
  const cutoffPct = 65;
  const recencyPct = useMemo(() => {
    return Math.max(0.5, Math.min(cutoffPct - 0.2, cutoffPct - (recencyDays / lookbackWindow) * cutoffPct));
  }, [recencyDays, lookbackWindow]);

  const tenurePct = useMemo(() => {
    return Math.max(0, Math.min(cutoffPct - 0.2, cutoffPct - (tenureDays / lookbackWindow) * cutoffPct));
  }, [tenureDays, lookbackWindow]);

  return (
    <div className="space-y-8">
      {/* 1. Sleek Studio Header */}
      <div className="rounded-2xl border border-[#29332B] bg-[#111611] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="crimson" size="sm">
                Prediction Studio
              </Badge>
              <Badge variant="forest" size="sm">
                Balanced Logistic Regression
              </Badge>
              <span className="text-[10px] font-tech text-[#A6AEA5]">
                Observation Decision Cutoff ≥ 50%
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F2F0E8] leading-tight">
              Customer Retention Simulator & Inference Studio
            </h1>
            <p className="text-xs text-[#A6AEA5] max-w-2xl leading-relaxed">
              Real-time temporal simulation of 90-day repeat purchase probability vs. inactivity risk.
              Drag the crimson draggers or click anywhere on the timeline to test churn velocity.
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
              className="text-xs text-[#A6AEA5] hover:text-[#F2F0E8] border-[#29332B]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Inputs
            </Button>
          </div>
        </div>
      </div>

      {/* 2. FLAGSHIP HERO: Interactive Customer Timeline (First thing user sees on entry!) */}
      <Card className="p-6 border-[#29332B] bg-[#111611] shadow-2xl relative overflow-hidden">
        {/* Top Control Deck: Presets + Observation Bounds */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#29332B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171D18] text-[#C82038] border border-[#29332B]">
                <Calendar className="h-4 w-4 text-[#E33B4F]" />
              </div>
              <h2 className="text-lg font-serif font-semibold text-[#F2F0E8] flex items-center gap-2">
                <span>Interactive Customer Timeline</span>
              </h2>
              <Badge
                variant={recencyDays <= 30 ? 'forest' : recencyDays <= 90 ? 'amber' : 'crimson'}
                size="sm"
              >
                {recencyStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-[#A6AEA5]">
              Directly scrub the track or drag the crimson draggers to inspect how customer inactivity days change churn posture
            </p>
          </div>

          {/* Archetype Quick Selectors & Timeline Bounds Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Archetype Presets */}
            <div className="flex items-center gap-1.5 bg-[#090B09] p-1 rounded-lg border border-[#29332B]">
              <span className="text-[10px] font-tech text-[#A6AEA5] px-1.5">Preset:</span>
              {SCENARIO_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`px-2 py-1 rounded text-xs font-tech font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#214D35] text-[#F2F0E8] border border-[#447A56] shadow-sm'
                        : 'text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#171D18]'
                    }`}
                    title={preset.tagline}
                  >
                    {preset.title.split(' ')[0]} ({preset.recency}d)
                  </button>
                );
              })}
            </div>

            {/* Lookback Window Toggle */}
            <div className="flex items-center gap-1 bg-[#090B09] p-1 rounded-lg border border-[#29332B] text-xs text-[#A6AEA5]">
              <span className="text-[10px] font-tech px-1.5">Lookback:</span>
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
                      ? 'bg-[#C82038] text-[#F2F0E8] font-bold'
                      : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                  }`}
                >
                  {w}d
                </button>
              ))}
            </div>

            {/* Prediction Horizon Selector */}
            <div className="flex items-center gap-1 bg-[#090B09] p-1 rounded-lg border border-[#29332B] text-xs text-[#A6AEA5]">
              <Layers className="h-3 w-3 text-[#447A56]" />
              <span className="text-[10px] font-tech px-1">Horizon:</span>
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

            {/* Snapshot Date Input */}
            <div className="flex items-center gap-1.5 rounded-lg bg-[#090B09] px-2.5 py-1.5 border border-[#29332B] text-xs text-[#A6AEA5]">
              <Clock className="h-3.5 w-3.5 text-[#E33B4F]" />
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => {
                  setSnapshotDate(e.target.value);
                  setIsStale(true);
                }}
                className="bg-transparent text-[#F2F0E8] font-tech font-medium focus:outline-none cursor-pointer"
                title="Simulation Cutoff Date"
              />
            </div>
          </div>
        </div>

        {/* Enlarged Visual Interactive Timeline Canvas */}
        <div className="mt-4 mb-4 select-none">
          {/* Main Interactive Scrubbing Track */}
          <div
            ref={timelineTrackRef}
            onPointerDown={handleTrackPointerDown}
            onPointerMove={handleTrackPointerMove}
            onPointerUp={handleTrackPointerUp}
            className="relative h-20 sm:h-22 w-full rounded-xl bg-[#090B09] border border-[#29332B] cursor-crosshair px-2 shadow-inner group"
          >
            {/* Top Region Labels */}
            <div className="absolute top-1.5 left-3 right-3 flex items-center justify-between text-[10px] font-tech pointer-events-none z-0">
              <span className="text-[#A6AEA5] tracking-wide flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#447A56]" />
                Past Lifespan (-{lookbackWindow}d)
              </span>
              <span className="text-[#447A56] tracking-wide font-medium flex items-center gap-1.5">
                Forecast (+{predictionHorizon}d)
                <span className="h-1.5 w-1.5 rounded-full bg-[#447A56] animate-pulse" />
              </span>
            </div>

            {/* Horizontal Timeline Center Rail */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-7 sm:h-8 flex pointer-events-none">
              {/* 1. Inactive/Historical Background Rail (0% to 65%) */}
              <div
                className="h-full bg-[#111611] border-y border-l border-[#29332B] relative flex items-center overflow-hidden"
                style={{ width: '65%' }}
              >
                {/* Micro tick marks across lookback rail */}
                <div className="absolute inset-0 flex justify-between px-2 opacity-25">
                  {Array.from({ length: 13 }).map((_, i) => (
                    <div key={i} className="h-full w-px bg-[#29332B]" />
                  ))}
                </div>

                {/* Active Lifespan Fill (Tenure to Last Order) */}
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-sm bg-gradient-to-r from-[#214D35]/35 to-[#447A56]/50 border-y border-[#447A56]/60 flex items-center justify-center transition-all duration-75"
                  style={{
                    left: `${(tenurePct / 0.65) * 100}%`,
                    width: `${Math.max(1, ((recencyPct - tenurePct) / 0.65) * 100)}%`,
                  }}
                >
                  <span className="text-[8.5px] font-tech text-[#F2F0E8]/90 font-medium whitespace-nowrap px-1 truncate">
                    Active ({Math.max(0, tenureDays - recencyDays)}d)
                  </span>
                </div>

                {/* Dormancy / Inactivity Hazard Gap (Last Order to Day 0 Cutoff) */}
                <div
                  className={`absolute top-0.5 bottom-0.5 right-0 rounded-sm flex items-center justify-center transition-all duration-75 ${
                    recencyDays <= 30
                      ? 'bg-[#447A56]/25 border border-[#447A56]/70'
                      : recencyDays <= 90
                      ? 'hazard-stripes-amber border border-[#C48232]/70'
                      : 'hazard-stripes-crimson border border-[#C82038]/80 shadow-[inset_0_0_10px_rgba(200,32,56,0.3)]'
                  }`}
                  style={{
                    left: `${(recencyPct / 0.65) * 100}%`,
                  }}
                >
                  <span
                    className={`text-[9px] font-tech font-bold uppercase tracking-wider px-1.5 truncate ${
                      recencyDays <= 30
                        ? 'text-[#447A56]'
                        : recencyDays <= 90
                        ? 'text-[#C48232]'
                        : 'text-[#E33B4F]'
                    }`}
                  >
                    {recencyDays <= 30
                      ? `${recencyDays}d Active`
                      : recencyDays <= 90
                      ? `${recencyDays}d Cooling`
                      : `${recencyDays}d Dormancy`}
                  </span>
                </div>
              </div>

              {/* 2. Prediction Outcome Horizon Rail (65% to 100%) */}
              <div
                className="h-full rounded-r-md bg-gradient-to-r from-[#214D35]/20 to-[#102016]/30 border border-dashed border-[#447A56]/60 relative flex items-center justify-center overflow-hidden"
                style={{ width: '35%' }}
              >
                <div className="text-center px-1">
                  <span className="text-[9.5px] font-tech text-[#447A56] font-semibold">
                    {predictionResult ? (predictionResult.repeatPurchaseProbability >= 0.5 ? 'Repeat Forecast' : 'Churn Predicted') : 'Model Scoring'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Join Pin (Tenure) */}
            <div
              className="absolute top-2 bottom-2 pointer-events-none flex flex-col items-center z-10 transition-all duration-75"
              style={{ left: `${tenurePct}%` }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-[#102016] border border-[#447A56] flex items-center justify-center shadow">
                <div className="h-1 w-1 rounded-full bg-[#447A56]" />
              </div>
              <div className="w-px h-full bg-[#447A56]/50 mt-0.5" />
              <span className="text-[8px] font-tech text-[#A6AEA5] bg-[#090B09] px-1 rounded border border-[#29332B] whitespace-nowrap -mt-0.5 shadow">
                Joined -{tenureDays}d
              </span>
            </div>

            {/* Day 0 Cutoff Beam (65%) */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center z-20"
              style={{ left: '65%' }}
            >
              <div className="absolute -top-5 -translate-x-1/2 flex items-center gap-1 bg-[#171D18] px-1.5 py-0.5 rounded border border-[#C82038] shadow-[0_0_8px_rgba(200,32,56,0.3)]">
                <span className="h-1 w-1 rounded-full bg-[#E33B4F] animate-pulse" />
                <span className="text-[8.5px] font-tech text-[#E33B4F] font-bold uppercase tracking-wider whitespace-nowrap">
                  Cutoff (Day 0)
                </span>
              </div>
              <div className="w-px h-full bg-[#C82038] shadow-[0_0_8px_#C82038]" />
              <div className="h-1.5 w-1.5 rotate-45 bg-[#C82038] -mt-0.5 shadow-[0_0_6px_#C82038]" />
            </div>

            {/* Clamped Floating Readout Chip (Guaranteed to NEVER bleed off-screen) */}
            <div
              className="absolute -top-7 -translate-x-1/2 pointer-events-none transition-all duration-75 z-30"
              style={{
                left: `${Math.max(12, Math.min(54, recencyPct))}%`,
              }}
            >
              <div className="rounded-md bg-[#090B09]/95 border border-[#C82038] px-2 py-0.5 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-[10px] font-tech font-bold text-[#F2F0E8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E33B4F] animate-pulse" />
                <span>Last Order: {recencyDays}d ago</span>
                <span className="text-[#A6AEA5]">|</span>
                <span
                  className={
                    (predictionResult?.inactivityRiskScore || 0) >= 0.5 ? 'text-[#E33B4F]' : 'text-[#447A56]'
                  }
                >
                  Risk: {((predictionResult?.inactivityRiskScore || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-0 h-0 border-x-[3px] border-x-transparent border-t-[3px] border-t-[#C82038] mx-auto" />
            </div>

            {/* TACTILE CRIMSON DRAGGER PIN */}
            <div
              className="absolute top-0 bottom-0 z-20 transition-all duration-75 flex flex-col items-center pointer-events-none"
              style={{ left: `${recencyPct}%` }}
            >
              {/* Vertical Laser Hairline */}
              <div className="w-px h-full bg-[#E33B4F]/90 shadow-[0_0_6px_#E33B4F]" />

              {/* Precision Crimson Dragger Head */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-white shadow-[0_0_14px_rgba(200,32,56,0.95)] cursor-grab active:cursor-grabbing hover:scale-120 transition-transform flex items-center justify-center pointer-events-auto"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #FF5A70 0%, #C82038 60%, #7A0B1A 100%)',
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>

          {/* Timeline Bottom Axis Labels */}
          <div className="flex justify-between text-[10px] font-tech text-[#A6AEA5] pt-1.5 px-1">
            <span>-{lookbackWindow}d Lookback</span>
            <span>-90d Quarter Mark</span>
            <span className="text-[#E33B4F] font-semibold">Day 0 (Cutoff)</span>
            <span className="text-[#447A56] font-semibold">+{predictionHorizon}d Forecast</span>
          </div>
        </div>

        {/* Milestone Quick Jump Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 pb-3 border-t border-[#29332B]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5] flex items-center gap-1 mr-1">
              <Zap className="h-3 w-3 text-[#E33B4F]" />
              <span>Milestones:</span>
            </span>
            {[
              { label: '⚡ 7d Immediate', days: 7 },
              { label: '🟢 21d Fresh Buyer', days: 21 },
              { label: '🟡 45d Cooling Window', days: 45 },
              { label: '🟠 90d Quarter Mark', days: 90 },
              { label: '🔴 135d High Churn Risk', days: 135 },
              { label: `⛔ ${lookbackWindow}d Severely Lapsed`, days: lookbackWindow },
            ].map((m) => (
              <button
                key={m.days}
                type="button"
                onClick={() => {
                  setRecencyDays(m.days);
                  if (m.days > tenureDays) setTenureDays(m.days);
                  setIsStale(true);
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] font-tech font-medium transition-all cursor-pointer border ${
                  recencyDays === m.days
                    ? 'bg-[#C82038] text-white border-[#E33B4F] shadow-[0_0_10px_rgba(200,32,56,0.6)] font-bold'
                    : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B] hover:text-[#F2F0E8] hover:border-[#447A56]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-tech text-[#A6AEA5] italic hidden sm:inline">
            Click or scrub directly on the timeline track
          </span>
        </div>

        {/* Sliders: Recency (Crimson Red) & Account Tenure (Forest Green) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#29332B]">
          {/* Recency Slider: TACTILE CRIMSON RED DRAGGER */}
          <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C82038]" />
                <span>Days Since Last Order (Recency)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRecencyDays((prev) => Math.max(1, prev - 10))}
                  className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#C82038] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors cursor-pointer"
                  title="-10 days"
                >
                  -10d
                </button>
                <button
                  type="button"
                  onClick={() => setRecencyDays((prev) => Math.max(1, prev - 1))}
                  className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#C82038] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors cursor-pointer"
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
                  className="w-14 h-6 text-center rounded bg-[#111611] border border-[#29332B] font-tech text-xs text-[#E33B4F] font-bold focus:border-[#C82038] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = Math.min(lookbackWindow, recencyDays + 1);
                    setRecencyDays(val);
                    if (val > tenureDays) setTenureDays(val);
                  }}
                  className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#C82038] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors cursor-pointer"
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
                  className="h-6 px-1.5 rounded bg-[#171D18] hover:bg-[#C82038] text-[10px] font-tech text-[#A6AEA5] hover:text-[#F2F0E8] border border-[#29332B] transition-colors cursor-pointer"
                  title="+10 days"
                >
                  +10d
                </button>
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
              className="w-full slider-crimson accent-[#C82038] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
              <span>1d (Yesterday)</span>
              <span>90d (Quarter Boundary)</span>
              <span>{lookbackWindow}d (Severely Lapsed)</span>
            </div>
          </div>

          {/* Account Tenure Slider: TACTILE FOREST GREEN DRAGGER (Requested by user) */}
          <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#447A56]" />
                <span>Account Tenure (Days Since Joined)</span>
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
              className="w-full slider-forest accent-[#447A56] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
              <span>Customer joined {tenureDays}d ago</span>
              <span>Active span: {Math.max(0, tenureDays - recencyDays)}d</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Deep Predictive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Purchasing Cadence & Actions */}
        <div className="lg:col-span-5 space-y-6">
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
                className="w-full slider-crimson accent-[#C82038] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
                <span>$20 (Low basket)</span>
                <span>$106 (Platform Median)</span>
                <span>$2,500+ (High Value)</span>
              </div>
            </div>

            {/* Geographic State Selection with Full Forms & Interactive Tooltips */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#447A56]" />
                    <span>Customer State (Federative Unit — UF)</span>
                  </span>
                  <span className="text-[10px] text-[#A6AEA5]">
                    Hover over or click any acronym to reveal full state name & regional profile
                  </span>
                </div>
                <Badge variant="forest" size="sm">
                  {customerState}
                </Badge>
              </div>

              {/* State Buttons with Full Tooltips & Hover Callouts */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {POPULAR_STATES.map((st) => {
                  const meta = BRAZILIAN_STATES_METADATA[st.uf] || { name: st.name, region: 'Brazil', role: '', share: '' };
                  const isSelected = customerState === st.uf;

                  return (
                    <div key={st.uf} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerState(st.uf);
                          setIsStale(true);
                        }}
                        onMouseEnter={() => setHoveredState(st.uf)}
                        onMouseLeave={() => setHoveredState(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-tech font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56] shadow-[0_0_12px_rgba(68,122,86,0.3)]'
                            : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B] hover:border-[#447A56]/70 hover:text-[#F2F0E8] hover:bg-[#111611]'
                        }`}
                        title={`${st.uf}: ${meta.name} (${meta.region}) — ${meta.role}`}
                      >
                        {st.uf}
                      </button>

                      {/* Floating Hover Popover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                        <div className="rounded-lg bg-[#111611] border border-[#447A56] px-2.5 py-1.5 shadow-2xl text-center whitespace-nowrap min-w-[130px]">
                          <div className="text-[11px] font-semibold text-[#F2F0E8] font-tech">
                            {st.uf} — {meta.name}
                          </div>
                          <div className="text-[9.5px] text-[#447A56] font-medium">
                            {meta.region} Region • {meta.share}
                          </div>
                          <div className="text-[8.5px] text-[#A6AEA5] max-w-[170px] truncate">
                            {meta.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Dropdown for All 27 States with Full Names */}
                <div className="relative">
                  <select
                    value={customerState}
                    onChange={(e) => {
                      setCustomerState(e.target.value);
                      setIsStale(true);
                    }}
                    onFocus={() => setHoveredState(null)}
                    className="rounded-lg bg-[#171D18] px-3 py-1.5 text-xs text-[#F2F0E8] border border-[#29332B] font-tech cursor-pointer hover:border-[#447A56]/70 focus:outline-none"
                    aria-label="Select from all 27 Brazilian States"
                  >
                    {ALL_STATES.map((s) => {
                      const meta = BRAZILIAN_STATES_METADATA[s];
                      return (
                        <option key={s} value={s} className="bg-[#111611] text-[#F2F0E8]">
                          {s} — {meta?.name || s} ({meta?.region || 'Brazil'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dynamic State Descriptor Card (Shows upon Click or Hover) */}
              <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B] text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#171D18] border border-[#29332B] text-[#447A56] font-tech font-bold text-xs">
                    {hoveredState || customerState}
                  </div>
                  <div>
                    <div className="font-semibold text-[#F2F0E8] text-xs flex items-center gap-1.5">
                      <span>{activeStateInfo.name} ({hoveredState || customerState})</span>
                      <span className="text-[10px] text-[#447A56] font-tech">[{activeStateInfo.region}]</span>
                    </div>
                    <p className="text-[10px] text-[#A6AEA5] leading-snug mt-0.5">
                      {activeStateInfo.role}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-[#A6AEA5] block font-tech uppercase tracking-wider">E-Commerce Share</span>
                  <span className="font-tech text-xs font-semibold text-[#F2F0E8]">{activeStateInfo.share}</span>
                </div>
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
        <div className="lg:col-span-7 space-y-6">
          {/* Stale Warning Banner */}
          {isStale && hasRunPrediction && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-[#C48232]/15 border border-[#C48232]/30 p-3.5 text-xs text-[#C48232] flex items-center justify-between gap-3 shadow"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C48232]" />
                <span>Variables modified. Recalculating live inference & radar footprint...</span>
              </div>
              <Badge variant="amber" size="sm">
                Live Preview
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
                  Adjust the timeline, order cadence, and spend sliders, then inspect real-time risk scores, radar footprints, sensitivity sweeps, and sigmoid curves.
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

                {/* 1. Flagship Executive Intelligence & Behavioral Radar Hub (Unified Top Card) */}
                <Card className="overflow-hidden border-[#29332B] shadow-2xl bg-[#111611]">
                  <div
                    className={`h-2.5 w-full ${
                      predictionResult.predictedClass === 1 ? 'bg-[#447A56]' : 'bg-[#C82038]'
                    }`}
                  />

                  <CardHeader className="pb-3 border-b border-[#29332B]/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5]">
                          Executive Inference & Behavioral Posture
                        </span>
                        <span className="h-2 w-2 rounded-full bg-[#447A56] animate-pulse" />
                      </div>
                      <Badge
                        variant={predictionResult.predictedClass === 1 ? 'forest' : 'crimson'}
                        size="md"
                      >
                        {predictionResult.predictedClass === 1
                          ? 'Likely to Repeat'
                          : 'Inactivity / Churn Risk'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                      {/* Column A: Prediction Verdict & Probability Metrics */}
                      <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5]">
                            Forecasted Verdict
                          </span>
                          <h3 className="text-xl font-serif font-semibold text-[#F2F0E8] mt-0.5 leading-snug">
                            {predictionResult.predictionLabel}
                          </h3>
                        </div>

                        {/* Visual Probability Gauges */}
                        <div className="space-y-3">
                          <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wide font-tech">
                                Repeat Probability
                              </span>
                              <span className="text-[10px] text-[#447A56] font-tech font-semibold">Cutoff ≥ 50%</span>
                            </div>
                            <div className="font-tech text-3xl font-bold text-[#447A56]">
                              {formatPercent(predictionResult.repeatPurchaseProbability, 1)}
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#171D18] overflow-hidden">
                              <div
                                className="h-full bg-[#447A56] rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.max(5, predictionResult.repeatPurchaseProbability * 100))}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wide font-tech">
                                Inactivity Risk Score
                              </span>
                              <span className="text-[10px] text-[#E33B4F] font-tech font-semibold">1 - P(repeat)</span>
                            </div>
                            <div className="font-tech text-3xl font-bold text-[#E33B4F]">
                              {formatPercent(predictionResult.inactivityRiskScore, 1)}
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#171D18] overflow-hidden">
                              <div
                                className="h-full bg-[#C82038] rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.max(5, predictionResult.inactivityRiskScore * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Summary & Recommended Dynamic Action */}
                        <div
                          className={`rounded-xl p-4 border text-xs space-y-2 transition-colors duration-300 ${
                            predictionResult.predictedClass === 1
                              ? 'bg-[#102016]/60 border-[#214D35]'
                              : predictionResult.inactivityRiskScore >= 0.7
                              ? 'bg-[#C82038]/10 border-[#C82038]/40'
                              : 'bg-[#C48232]/10 border-[#C48232]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-semibold flex items-center gap-1.5 text-xs ${
                                predictionResult.predictedClass === 1
                                  ? 'text-[#447A56]'
                                  : predictionResult.inactivityRiskScore >= 0.7
                                  ? 'text-[#E33B4F]'
                                  : 'text-[#C48232]'
                              }`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>{predictionResult.recommendedPlayTitle || 'Dynamic Retention Play'}</span>
                            </span>
                            {predictionResult.recommendedPlayChannel && (
                              <span className="text-[10px] font-tech text-[#A6AEA5] bg-[#090B09] px-2 py-0.5 rounded border border-[#29332B]">
                                {predictionResult.recommendedPlayChannel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-[#F2F0E8]/90 font-medium">
                            {predictionResult.recommendedAction}
                          </p>
                        </div>
                      </div>

                      {/* Column B: Live Multidimensional Behavioral Radar Footprint */}
                      <div className="md:col-span-6 flex flex-col justify-between rounded-xl bg-[#090B09] p-4 border border-[#29332B]">
                        <div className="flex items-center justify-between pb-2 border-b border-[#29332B]/60">
                          <div>
                            <h4 className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-1.5">
                              <span>Behavioral Radar Footprint</span>
                            </h4>
                            <p className="text-[10px] text-[#A6AEA5]">
                              Live multi-axial posture across customer dimensions
                            </p>
                          </div>
                          <Badge variant="forest" size="sm">
                            Live Reactive
                          </Badge>
                        </div>

                        {/* Live Radar Chart */}
                        <div className="h-52 w-full py-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="#29332B" />
                              <PolarAngleAxis dataKey="subject" stroke="#A6AEA5" fontSize={9} />
                              <PolarRadiusAxis domain={[0, 100]} stroke="#29332B" fontSize={8} />
                              <Radar
                                name="Customer"
                                dataKey="score"
                                stroke={predictionResult.predictedClass === 1 ? '#447A56' : '#C82038'}
                                fill={predictionResult.predictedClass === 1 ? '#447A56' : '#C82038'}
                                fillOpacity={0.3}
                                isAnimationActive={true}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Dimension metric chips */}
                        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[#29332B]/60 text-center">
                          <div className="rounded bg-[#111611] p-1.5 border border-[#29332B]">
                            <span className="text-[9px] text-[#A6AEA5] block font-tech">Recency</span>
                            <span className="text-[11px] font-bold text-[#F2F0E8] font-tech">{recencyDays}d</span>
                          </div>
                          <div className="rounded bg-[#111611] p-1.5 border border-[#29332B]">
                            <span className="text-[9px] text-[#A6AEA5] block font-tech">Orders</span>
                            <span className="text-[11px] font-bold text-[#F2F0E8] font-tech">{orderCount}</span>
                          </div>
                          <div className="rounded bg-[#111611] p-1.5 border border-[#29332B]">
                            <span className="text-[9px] text-[#A6AEA5] block font-tech">Spend</span>
                            <span className="text-[11px] font-bold text-[#F2F0E8] font-tech">{formatCurrency(totalSpend)}</span>
                          </div>
                          <div className="rounded bg-[#111611] p-1.5 border border-[#29332B]">
                            <span className="text-[9px] text-[#A6AEA5] block font-tech">Recent 90d</span>
                            <span className="text-[11px] font-bold text-[#F2F0E8] font-tech">{ordersRecent90d}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Feature Sensitivity Analysis Card */}
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
                          className={`px-2.5 py-1 rounded text-[11px] font-tech font-medium transition-colors cursor-pointer ${
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
                  <div className="h-48 w-full pt-1">
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
                            border: '1px solid #C82038',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#E33B4F',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                          }}
                          itemStyle={{
                            color: '#E33B4F',
                            fontWeight: 600,
                          }}
                          labelStyle={{
                            color: '#F2F0E8',
                            fontWeight: 600,
                            marginBottom: '4px',
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

                {/* 3. Deep Explanatory & Simulation Diagnostics (Tabs) */}
                <Card className="border-[#29332B] bg-[#111611] overflow-hidden">
                  <div className="border-b border-[#29332B] bg-[#171D18]/50 p-3 sm:px-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-2">
                          <Layers className="h-4 w-4 text-[#447A56]" />
                          <span>Deep Model Diagnostics & Explainability</span>
                        </h4>
                        <p className="text-[11px] text-[#A6AEA5] mt-0.5">
                          Inspect mathematical contributions, coupon simulation, or sigmoid probability mapping
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#090B09] p-1 rounded-lg border border-[#29332B]">
                        <button
                          type="button"
                          onClick={() => setDiagnosticTab('waterfall')}
                          className={`px-3 py-1 rounded text-xs font-tech font-medium transition-colors cursor-pointer ${
                            diagnosticTab === 'waterfall'
                              ? 'bg-[#214D35] text-[#F2F0E8] shadow-sm'
                              : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                          }`}
                        >
                          Log-Odds Waterfall
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiagnosticTab('reengagement')}
                          className={`px-3 py-1 rounded text-xs font-tech font-medium transition-colors cursor-pointer ${
                            diagnosticTab === 'reengagement'
                              ? 'bg-[#214D35] text-[#F2F0E8] shadow-sm'
                              : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                          }`}
                        >
                          Coupon Simulation
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiagnosticTab('sigmoid')}
                          className={`px-3 py-1 rounded text-xs font-tech font-medium transition-colors cursor-pointer ${
                            diagnosticTab === 'sigmoid'
                              ? 'bg-[#214D35] text-[#F2F0E8] shadow-sm'
                              : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                          }`}
                        >
                          Logistic Sigmoid
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Tab 1: Feature Impact Waterfall */}
                    {diagnosticTab === 'waterfall' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#A6AEA5]">
                            Exact mathematical pull of each variable on model output (Log-Odds Contribution)
                          </span>
                          <Badge variant="forest" size="sm">
                            Explainability
                          </Badge>
                        </div>

                        <div className="h-64 w-full pt-2">
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
                                  border: '1px solid #C82038',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  color: '#E33B4F',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                                }}
                                itemStyle={{
                                  color: '#E33B4F',
                                  fontWeight: 600,
                                }}
                                labelStyle={{
                                  color: '#F2F0E8',
                                  fontWeight: 600,
                                  marginBottom: '4px',
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
                      </div>
                    )}

                    {/* Tab 2: Coupon Re-engagement */}
                    {diagnosticTab === 'reengagement' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[#29332B]">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#447A56]" />
                            <span className="text-xs font-semibold text-[#F2F0E8]">Direct Coupon Re-engagement Scenario</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSimulateIntervention(!simulateIntervention)}
                            className={`px-3 py-1.5 rounded text-xs font-tech font-medium border transition-colors cursor-pointer ${
                              simulateIntervention
                                ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56]'
                                : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B]'
                            }`}
                          >
                            {simulateIntervention ? 'Simulation Active' : 'Simulate Re-engagement'}
                          </button>
                        </div>

                        {simulateIntervention && simulatedResult ? (
                          <div className="space-y-4 pt-1">
                            <p className="text-xs text-[#A6AEA5] leading-relaxed">
                              Simulating customer response to an outreach coupon that drives an immediate repeat purchase within 12 days:
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B]">
                                <span className="text-[10px] text-[#A6AEA5] font-tech uppercase tracking-wider">Current Inactivity Risk</span>
                                <p className="font-tech text-2xl font-bold text-[#E33B4F] mt-1">
                                  {formatPercent(predictionResult.inactivityRiskScore, 1)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#102016] p-4 border border-[#214D35]">
                                <span className="text-[10px] text-[#447A56] font-tech uppercase tracking-wider">Post-Intervention Risk</span>
                                <p className="font-tech text-2xl font-bold text-[#F2F0E8] mt-1 flex items-center gap-2">
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
                          <div className="p-6 text-center rounded-xl bg-[#090B09] border border-[#29332B] space-y-2">
                            <Sparkles className="h-6 w-6 text-[#447A56] mx-auto" />
                            <p className="text-xs text-[#F2F0E8] font-medium">Test hypothetical coupon outreach response</p>
                            <p className="text-[11px] text-[#A6AEA5] max-w-md mx-auto">
                              Click "Simulate Re-engagement" above to see how prompt customer re-activation cuts inactivity risk and restores repeat velocity.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Logistic Sigmoid Probability Curve */}
                    {diagnosticTab === 'sigmoid' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-[#A6AEA5]">
                              Customer log-odds score: <span className="font-tech text-[#F2F0E8]">{predictionResult.logit}</span>
                            </span>
                          </div>
                          <span className="font-tech text-xs text-[#447A56] bg-[#102016] border border-[#214D35] px-2 py-0.5 rounded">
                            P = 1 / (1 + e^-z)
                          </span>
                        </div>

                        <div className="h-48 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={predictionResult.sigmoidPoints}
                              margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
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
                      </div>
                    )}
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
