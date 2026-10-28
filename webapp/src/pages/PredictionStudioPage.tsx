import React, { useState, useMemo } from 'react';
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
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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

            {/* Sliders */}
            <div className="space-y-5 pt-2">
              {/* Recency Slider */}
              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F2F0E8]">
                    Days Since Last Order (Recency)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-tech text-sm font-bold text-[#F2F0E8]">{recencyDays} days</span>
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
                  className="w-full accent-[#447A56] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
                  <span>1d (Yesterday)</span>
                  <span>90d (Quarter Boundary)</span>
                  <span>{lookbackWindow}d (Severely Lapsed)</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F2F0E8]">
                    Account Tenure (Days Since Customer Joined)
                  </span>
                  <span className="font-tech text-sm font-bold text-[#F2F0E8]">{tenureDays} days</span>
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
                        setIsStale(true);
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
                      onClick={() => {
                        setOrdersRecent90d(num);
                        setIsStale(true);
                      }}
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

            {/* Total Spend Slider */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F2F0E8]">Total Lifetime Spend</span>
                <span className="font-tech text-sm font-bold text-[#447A56]">
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
                className="w-full accent-[#447A56] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
                <span>R$ 20 (Low basket)</span>
                <span>R$ 106 (Platform Median)</span>
                <span>R$ 2,500+ (High Value)</span>
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
                    onClick={() => {
                      setCustomerState(st.uf);
                      setIsStale(true);
                    }}
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
                  onChange={(e) => {
                    setCustomerState(e.target.value);
                    setIsStale(true);
                  }}
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

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleRunPrediction}
                disabled={isComputing}
                className="w-full text-sm font-semibold h-12 shadow-xl shadow-[#C82038]/20"
              >
                {isComputing ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin text-white mr-2" />
                    <span>Running Machine Learning Inference...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
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

                {/* 2. Interactive What-If Simulation Card */}
                <Card className="p-5 border-[#29332B] bg-[#111611] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#29332B] pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#447A56]" />
                      <h4 className="text-xs font-semibold text-[#F2F0E8]">What-If Retention Simulator</h4>
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
                        <Bar dataKey="impact" radius={[3, 3, 3, 3]}>
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
