import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Sliders,
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Activity,
  Award,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Target,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
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
import { RiskBadge } from '../components/shared/RiskBadge';
import { runLocalModelInference, ClientInferenceResult } from '../lib/data/model-inference-engine';
import { predictCustomer } from '../lib/api/prediction-client';
import { formatPercent, formatCurrency, formatNumber } from '../lib/utils';

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
  const [predictionHorizon, setPredictionHorizon] = useState<number>(90); // 30, 60, 90, 180 days
  const [lookbackWindow, setLookbackWindow] = useState<number>(180); // 90, 180, 365 days

  // 2. Interactive Customer Variables (No forced hardcoded customer defaults)
  const [recencyDays, setRecencyDays] = useState<number>(50);
  const [tenureDays, setTenureDays] = useState<number>(120);
  const [orderCount, setOrderCount] = useState<number>(2);
  const [ordersRecent90d, setOrdersRecent90d] = useState<number>(1);
  const [totalSpend, setTotalSpend] = useState<number>(180);
  const [customerState, setCustomerState] = useState<string>('SP');
  const [freightRatio, setFreightRatio] = useState<number>(0.16);

  // 3. What-If Simulation Toggle
  const [simulateIntervention, setSimulateIntervention] = useState(false);
  const [simulatedRecency, setSimulatedRecency] = useState(12);

  // Active preset
  const [activePreset, setActivePreset] = useState<string>('');

  // Prediction states
  const [predictionResult, setPredictionResult] = useState<ClientInferenceResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [hasRunPrediction, setHasRunPrediction] = useState(false);
  const [isStale, setIsStale] = useState(false);

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

  // What-If Simulated Payload
  const simulatedPayload = useMemo(() => {
    if (!simulateIntervention) return null;
    return buildPayload(simulatedRecency, Math.max(1, ordersRecent90d + 1));
  }, [simulateIntervention, simulatedRecency, recencyDays, tenureDays, orderCount, ordersRecent90d, totalSpend, customerState, freightRatio]);

  // Run model prediction
  const handleRunPrediction = async () => {
    setIsComputing(true);
    setIsStale(false);
    setHasRunPrediction(true);

    // Guaranteed exact mathematical inference
    const localResult = runLocalModelInference(currentPayload);

    // Attempt FastAPI server call
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

  // What-If simulated prediction result
  const simulatedResult = useMemo(() => {
    if (!simulateIntervention || !simulatedPayload) return null;
    return runLocalModelInference(simulatedPayload);
  }, [simulateIntervention, simulatedPayload]);

  // Recency visual indicator
  const recencyStatus = useMemo(() => {
    if (recencyDays <= 30) return { label: 'Fresh Buyer', color: '#69DDA5', stage: 'active' };
    if (recencyDays <= 90) return { label: 'Cooling Off', color: '#F5BD64', stage: 'cooling' };
    return { label: 'Severe Inactivity Danger', color: '#FB7185', stage: 'danger' };
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
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#11182A] via-[#0B1020] to-[#161F34] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="violet" size="sm">
                Prediction Studio
              </Badge>
              <Badge variant="cyan" size="sm">
                Interactive Model Inference
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Customer Retention Simulator & Inference Studio
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Define your own timeline, observation date, and purchasing behavior. The trained Balanced Logistic
              Regression model instantly calculates 90-day repeat purchase probability vs. inactivity risk.
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
              className="text-xs text-slate-300 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Inputs
            </Button>
          </div>
        </div>
      </div>

      {/* 2. User-Selected Observation Timeline Bar */}
      <Card className="p-5 border-[#8B7CFF]/20 bg-[#11182A]/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Select Observation Timeline</h3>
              <p className="text-xs text-slate-400">
                Configure your snapshot date and forecasting horizon for this simulation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Snapshot Date Input */}
            <div className="flex items-center gap-2 rounded-lg bg-[#080B14] px-3 py-1.5 border border-white/10 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-[#53DDE0]" />
              <span className="text-slate-400">Snapshot Date:</span>
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => {
                  setSnapshotDate(e.target.value);
                  setIsStale(true);
                }}
                className="bg-transparent text-white font-mono font-medium focus:outline-none cursor-pointer"
              />
            </div>

            {/* Lookback Window Toggle */}
            <div className="flex items-center gap-1.5 rounded-lg bg-[#080B14] px-2.5 py-1.5 border border-white/10 text-xs text-slate-300">
              <span className="text-slate-400">Lookback:</span>
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
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                    lookbackWindow === w
                      ? 'bg-[#8B7CFF] text-[#080B14]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {w}d
                </button>
              ))}
            </div>

            {/* Prediction Horizon Selector */}
            <div className="flex items-center gap-1.5 rounded-lg bg-[#080B14] px-2.5 py-1.5 border border-white/10 text-xs text-slate-300">
              <Layers className="h-3.5 w-3.5 text-[#69DDA5]" />
              <span className="text-slate-400">Horizon:</span>
              {[30, 60, 90].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPredictionHorizon(h)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                    predictionHorizon === h
                      ? 'bg-[#69DDA5] text-[#080B14]'
                      : 'text-slate-400 hover:text-white'
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
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Choose a Starting Customer Scenario:
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
                    ? 'bg-[#161F34] border-[#8B7CFF] shadow-lg shadow-[#8B7CFF]/15'
                    : 'bg-[#0B1020]/90 border-white/5 hover:border-white/20 hover:bg-[#11182A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{preset.title}</span>
                  {isSelected && (
                    <Badge variant="violet" size="sm">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">{preset.tagline}</p>
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
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#8B7CFF]" />
                  <span>Interactive Customer Timeline</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drag the sliders to adjust when this customer joined and when they last ordered
                </p>
              </div>
              <Badge
                variant={recencyDays <= 30 ? 'mint' : recencyDays <= 90 ? 'amber' : 'coral'}
                size="sm"
              >
                {recencyStatus.label}
              </Badge>
            </div>

            {/* Visual Timeline Diagram */}
            <div className="mt-6 mb-8 pt-4 pb-2 px-2">
              <div className="relative h-14 w-full">
                {/* Lookback Window Bar */}
                <div className="absolute left-0 right-[35%] top-4 h-4 rounded-l-lg bg-gradient-to-r from-slate-800 to-[#161F34] border-y border-l border-white/10 flex items-center justify-between px-3">
                  <span className="text-[10px] font-mono text-slate-400">-{lookbackWindow}d Lookback</span>
                  <span className="text-[10px] font-mono text-slate-400">Velocity Zone</span>
                </div>

                {/* Future Prediction Horizon Bar */}
                <div className="absolute right-0 w-[35%] top-4 h-4 rounded-r-lg bg-[#8B7CFF]/15 border border-dashed border-[#8B7CFF]/40 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-[#8B7CFF] font-semibold">
                    +{predictionHorizon}d Outcome Horizon
                  </span>
                </div>

                {/* Observation Date Cutoff Marker */}
                <div className="absolute right-[35%] -top-1 bottom-0 w-0.5 bg-[#53DDE0] flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-[#53DDE0] -mt-1 shadow-[0_0_8px_#53DDE0]" />
                  <span className="text-[9px] font-mono text-[#53DDE0] whitespace-nowrap -mt-6 font-bold uppercase tracking-wider">
                    {snapshotDate} (Now)
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
                  <div className="text-[10px] font-mono font-bold mt-1 whitespace-nowrap text-white bg-[#0B1020] px-1.5 py-0.5 rounded border border-white/10 shadow">
                    Last Order: {recencyDays}d ago
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                <span>-{lookbackWindow}d First Contact</span>
                <span>-90d Quarter Mark</span>
                <span className="text-[#53DDE0]">Day 0 (Observation)</span>
                <span className="text-[#8B7CFF]">+{predictionHorizon}d Forecast</span>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-5 pt-2">
              {/* Recency Slider */}
              <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Days Since Last Order (Recency)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{recencyDays} days</span>
                    <span
                      className="h-2 w-2 rounded-full"
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
                    setIsStale(true);
                  }}
                  className="w-full accent-[#8B7CFF] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1d (Bought Yesterday)</span>
                  <span>90d (Quarter Boundary)</span>
                  <span>{lookbackWindow}d (Severely Lapsed)</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Account Tenure (Days Since Customer Joined)
                  </span>
                  <span className="font-mono text-sm font-bold text-white">{tenureDays} days</span>
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
                    setIsStale(true);
                  }}
                  className="w-full accent-[#53DDE0] cursor-pointer"
                />
              </div>
            </div>
          </Card>

          {/* Card: Purchasing Frequency & Spend Controls */}
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <ShoppingBag className="h-4 w-4 text-[#53DDE0]" />
              <span>Purchasing Cadence & Value</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Count Stepper */}
              <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-slate-200">Lifetime Orders</span>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setOrderCount(num);
                        if (ordersRecent90d > num) setOrdersRecent90d(num);
                        setIsStale(true);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        orderCount === num
                          ? 'bg-[#8B7CFF] text-[#080B14] shadow'
                          : 'bg-[#11182A] text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  {orderCount >= 2 ? 'Multi-order buyer (2.3% of platform)' : 'Single purchase buyer'}
                </p>
              </div>

              {/* Orders in Recent Window */}
              <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-slate-200">Orders in Recent 90 Days</span>
                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={num > orderCount}
                      onClick={() => {
                        setOrdersRecent90d(num);
                        setIsStale(true);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        ordersRecent90d === num
                          ? 'bg-[#53DDE0] text-[#080B14] shadow'
                          : num > orderCount
                          ? 'opacity-25 pointer-events-none bg-[#11182A] text-slate-600'
                          : 'bg-[#11182A] text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Top predictor in feature importance ranking
                </p>
              </div>
            </div>

            {/* Total Spend Slider */}
            <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Total Lifetime Spend</span>
                <span className="font-mono text-sm font-bold text-[#69DDA5]">
                  {formatCurrency(totalSpend)}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="2500"
                step="10"
                value={totalSpend}
                onChange={(e) => {
                  setTotalSpend(parseFloat(e.target.value));
                  setIsStale(true);
                }}
                className="w-full accent-[#69DDA5] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>R$ 20 (Low basket)</span>
                <span>R$ 106 (Platform Median)</span>
                <span>R$ 2,500+ (High Value)</span>
              </div>
            </div>

            {/* Geographic State Selection */}
            <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Customer State (UF)</span>
                <span className="font-mono text-xs text-[#8B7CFF]">{customerState}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {POPULAR_STATES.map((st) => (
                  <button
                    key={st.uf}
                    type="button"
                    onClick={() => {
                      setCustomerState(st.uf);
                      setIsStale(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                      customerState === st.uf
                        ? 'bg-[#8B7CFF]/25 text-[#8B7CFF] border-[#8B7CFF]/50'
                        : 'bg-[#11182A] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {st.uf}
                  </button>
                ))}
                <select
                  value={customerState}
                  onChange={(e) => {
                    setCustomerState(e.target.value);
                    setIsStale(true);
                  }}
                  className="rounded-lg bg-[#11182A] px-2 py-1 text-xs text-slate-300 border border-white/10 font-mono"
                >
                  {ALL_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleRunPrediction}
                disabled={isComputing}
                className="w-full text-sm font-semibold h-12 shadow-xl shadow-[#8B7CFF]/20"
              >
                {isComputing ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin text-[#080B14]" />
                    <span>Running Machine Learning Inference...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-[#080B14] text-[#080B14]" />
                    <span>Run Model Prediction for this Customer</span>
                  </>
                )}
              </Button>
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
              className="rounded-xl bg-[#F5BD64]/15 border border-[#F5BD64]/30 p-3.5 text-xs text-[#F5BD64] flex items-center justify-between gap-3 shadow"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#F5BD64]" />
                <span>Variables modified. Click "Run Model Prediction" to update charts.</span>
              </div>
              <Badge variant="amber" size="sm">
                Unsaved
              </Badge>
            </motion.div>
          )}

          {/* Idle Prompt (Before First Prediction) */}
          {!hasRunPrediction && (
            <Card className="p-8 text-center border-dashed border-white/10 bg-[#0B1020]/70 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 shadow-inner">
                <Sliders className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Interactive Studio Ready</h3>
                <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Adjust the timeline, order cadence, and spend sliders, then click{' '}
                  <span className="text-[#8B7CFF] font-semibold">Run Model Prediction</span> to generate
                  instant risk scores, feature impact waterfalls, radar footprints, and sigmoid curves.
                </p>
              </div>

              {/* Multidimensional Radar Footprint Preview */}
              <div className="pt-4 border-t border-white/5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Live Behavioral Footprint:
                </span>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={9} />
                      <PolarRadiusAxis domain={[0, 100]} stroke="#475569" fontSize={8} />
                      <Radar name="Customer" dataKey="score" stroke="#8B7CFF" fill="#8B7CFF" fillOpacity={0.25} />
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
                {/* 1. Primary Verdict Card with Risk Thermometer */}
                <Card className="overflow-hidden border-white/10 shadow-2xl">
                  <div
                    className={`h-2.5 w-full ${
                      predictionResult.predictedClass === 1 ? 'bg-[#69DDA5]' : 'bg-[#FB7185]'
                    }`}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Prediction Verdict
                      </span>
                      <Badge
                        variant={predictionResult.predictedClass === 1 ? 'mint' : 'coral'}
                        size="md"
                      >
                        {predictionResult.predictedClass === 1
                          ? 'Likely to Repeat'
                          : 'Inactivity / Churn Risk'}
                      </Badge>
                    </div>

                    <CardTitle className="text-xl text-white mt-1.5">
                      {predictionResult.predictionLabel}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-5 pt-1">
                    {/* Visual Probability Gauges */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-1.5">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                          Repeat Probability
                        </span>
                        <div className="font-mono text-3xl font-bold text-[#53DDE0]">
                          {formatPercent(predictionResult.repeatPurchaseProbability, 1)}
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#53DDE0] rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.max(5, predictionResult.repeatPurchaseProbability * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Cutoff: ≥50% for repeat</span>
                      </div>

                      <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-1.5">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                          Inactivity Risk Score
                        </span>
                        <div className="font-mono text-3xl font-bold text-[#FB7185]">
                          {formatPercent(predictionResult.inactivityRiskScore, 1)}
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#FB7185] rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.max(5, predictionResult.inactivityRiskScore * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Formula: 1 - P(repeat)</span>
                      </div>
                    </div>

                    {/* Summary Text */}
                    <div className="rounded-xl bg-[#11182A] p-4 border border-white/5 text-xs text-slate-300 leading-relaxed">
                      {predictionResult.summary}
                    </div>

                    {/* Actionable Playbook */}
                    <div className="rounded-xl bg-[#8B7CFF]/10 p-4 border border-[#8B7CFF]/20 text-xs text-slate-300 space-y-1">
                      <span className="font-semibold text-[#8B7CFF] block">Recommended Retention Play</span>
                      <p>{predictionResult.recommendedAction}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Interactive What-If Simulation Card */}
                <Card className="p-5 border-[#53DDE0]/20 bg-[#0B1020]/90 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#53DDE0]" />
                      <h4 className="text-xs font-semibold text-white">What-If Retention Simulator</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimulateIntervention(!simulateIntervention)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                        simulateIntervention
                          ? 'bg-[#53DDE0]/20 text-[#53DDE0] border-[#53DDE0]/40'
                          : 'bg-[#11182A] text-slate-400 border-white/10'
                      }`}
                    >
                      {simulateIntervention ? 'Simulation Active' : 'Simulate Re-engagement'}
                    </button>
                  </div>

                  {simulateIntervention && simulatedResult ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-slate-300 leading-snug">
                        Simulating customer response to an outreach coupon with an immediate re-order within 12 days:
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="rounded-lg bg-[#080B14] p-3 border border-white/5">
                          <span className="text-[10px] text-slate-400">Current Inactivity Risk</span>
                          <p className="font-mono text-lg font-bold text-[#FB7185] mt-0.5">
                            {formatPercent(predictionResult.inactivityRiskScore, 1)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#69DDA5]/10 p-3 border border-[#69DDA5]/20">
                          <span className="text-[10px] text-[#69DDA5]">Post-Intervention Risk</span>
                          <p className="font-mono text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                            <span>{formatPercent(simulatedResult.inactivityRiskScore, 1)}</span>
                            <span className="text-xs text-[#69DDA5] font-semibold">
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
                    <p className="text-[11px] text-slate-400">
                      Click "Simulate Re-engagement" to see how prompt customer re-activation cuts inactivity risk.
                    </p>
                  )}
                </Card>

                {/* 3. Feature Impact Waterfall Chart */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        Feature Impact Waterfall (Log-Odds Contribution)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Exact mathematical pull of each variable on model output
                      </p>
                    </div>
                    <Badge variant="violet" size="sm">
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
                          stroke="#64748B"
                          fontSize={10}
                          tickFormatter={(val) => (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2))}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          stroke="#94A3B8"
                          fontSize={10}
                          width={140}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0B1020',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                          formatter={(val: any, name: any, item: any) => [
                            `${Number(val).toFixed(3)} log-odds impact (${item.payload.valueDisplay})`,
                            item.payload.direction === 'repeat' ? 'Pushes to Repeat' : 'Pushes to Inactive',
                          ]}
                        />
                        <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                        <Bar dataKey="impact" radius={[3, 3, 3, 3]}>
                          {predictionResult.contributions.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.direction === 'repeat' ? '#69DDA5' : '#FB7185'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1.5 text-[#FB7185]">
                      <span className="h-2 w-2 rounded-full bg-[#FB7185]" />
                      Pushes to Inactivity / Churn
                    </span>
                    <span className="flex items-center gap-1.5 text-[#69DDA5]">
                      <span className="h-2 w-2 rounded-full bg-[#69DDA5]" />
                      Pushes to Repeat Purchase
                    </span>
                  </div>
                </Card>

                {/* 4. Multidimensional Radar Footprint */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        Multidimensional Behavioral Footprint
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Customer posture across velocity, frequency, spend, and tenure
                      </p>
                    </div>
                    <Badge variant="cyan" size="sm">
                      Radar Analysis
                    </Badge>
                  </div>

                  <div className="h-52 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={10} />
                        <PolarRadiusAxis domain={[0, 100]} stroke="#475569" fontSize={8} />
                        <Radar
                          name="Customer"
                          dataKey="score"
                          stroke={predictionResult.predictedClass === 1 ? '#69DDA5' : '#FB7185'}
                          fill={predictionResult.predictedClass === 1 ? '#69DDA5' : '#FB7185'}
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* 5. Real-Time Logistic Sigmoid Curve */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        Logistic Sigmoid Probability Curve
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Customer log-odds: <span className="font-mono text-white">{predictionResult.logit}</span>
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#53DDE0] bg-[#53DDE0]/10 px-2 py-0.5 rounded">
                      P = 1 / (1 + e^-z)
                    </span>
                  </div>

                  <div className="h-40 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={predictionResult.sigmoidPoints}
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                      >
                        <XAxis dataKey="z" stroke="#64748B" fontSize={10} />
                        <YAxis stroke="#64748B" fontSize={10} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                        <ReferenceLine y={0.5} stroke="#F5BD64" strokeDasharray="3 3" label={{ value: '50% Cutoff', fill: '#F5BD64', fontSize: 10 }} />
                        <ReferenceLine x={predictionResult.logit} stroke="#8B7CFF" strokeWidth={2} label={{ value: 'Customer Score', fill: '#8B7CFF', fontSize: 10 }} />
                        <Line
                          type="monotone"
                          dataKey="p"
                          stroke="#53DDE0"
                          strokeWidth={2}
                          dot={false}
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
