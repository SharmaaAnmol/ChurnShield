import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Percent,
  Award,
  Target,
  ArrowRight,
  Zap,
  Calendar,
  HelpCircle,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Filter,
  X,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { KpiCard } from '../components/shared/KpiCard';
import { RiskBadge } from '../components/shared/RiskBadge';
import { CustomerDrawer } from '../components/shared/CustomerDrawer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SplitText } from '../components/ui/SplitText';
import { ShinyText } from '../components/ui/ShinyText';
import { NumberTicker } from '../components/ui/NumberTicker';
import { BorderBeam } from '../components/ui/BorderBeam';
import { Spotlight } from '../components/ui/Spotlight';
import { AnalyticalContourVisual } from '../components/shared/AnalyticalContourVisual';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { useTimeline, TIMELINE_OPTIONS } from '../lib/context/TimelineContext';
import { loadCustomerPredictions, loadModelSummary } from '../lib/data/data-client';
import { CustomerPrediction, ModelSummary } from '../lib/data/types';
import { formatNumber, formatPercent, formatCurrency, truncateId } from '../lib/utils';

export function OverviewPage() {
  const { activeTimeline, setActiveTimeline, timelineMetrics, currentMetrics, isLoading: isTimelineLoading } = useTimeline();

  const [loading, setLoading] = useState(true);
  const [modelSummary, setModelSummary] = useState<ModelSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerPrediction[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPrediction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Interactive Risk Tier Filter from Chart
  const [riskTierFilter, setRiskTierFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all');

  // Interactive Operational Cutoff Threshold Slider (30% to 90%, default 70%)
  const [operationalCutoff, setOperationalCutoff] = useState<number>(70);

  const fetchData = async () => {
    setLoading(true);
    const [modelRes, custRes] = await Promise.all([
      loadModelSummary(),
      loadCustomerPredictions(),
    ]);

    if (modelRes.status === 'success') setModelSummary(modelRes.data);
    if (custRes.status === 'success') setCustomers(custRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCustomerClick = (c: CustomerPrediction) => {
    setSelectedCustomer(c);
    setIsDrawerOpen(true);
  };

  // Dynamic Timeline Metrics (falls back safely if still loading)
  const activeData = useMemo(() => {
    if (currentMetrics) return currentMetrics;
    return (
      timelineMetrics['all'] ||
      timelineMetrics['2018-06-01'] || {
        timelineId: 'all',
        label: 'All Timelines',
        quarterLabel: '2017 - 2018 Cumulative',
        totalCustomersEvaluated: 130914,
        actualRepeatPurchasers: 1077,
        actualInactiveCustomers: 129837,
        baseRepeatPurchaseRate: 0.008227,
        baseInactivityRate: 0.991773,
        prAuc: 0.0185,
        rocAuc: 0.582,
        recall: 0.468,
        balancedAccuracy: 0.551,
        prAucLiftOverDummy: 2.2,
        recommendedContactCount: 26183,
        riskDistribution: {
          highRisk: 3193,
          moderateRisk: 123999,
          lowRisk: 3722,
        },
        confusionMatrix: { tn: 88600, fp: 41238, fn: 573, tp: 504 },
      }
    );
  }, [currentMetrics, timelineMetrics]);

  // Chart data for risk distribution dynamically reflecting selected timeline
  const riskChartData = useMemo(() => {
    const dist = activeData.riskDistribution;
    return [
      { name: 'High Inactivity Risk (≥70%)', tier: 'high' as const, count: dist.highRisk, color: '#C82038' },
      { name: 'Moderate Risk (40-69%)', tier: 'moderate' as const, count: dist.moderateRisk, color: '#C48232' },
      { name: 'Low Inactivity Risk (<40%)', tier: 'low' as const, count: dist.lowRisk, color: '#447A56' },
    ];
  }, [activeData]);

  // Filter preview customers by selected timeline AND active riskTierFilter
  const highRiskPreview = useMemo(() => {
    let pool = [...customers];
    if (activeTimeline !== 'all') {
      pool = pool.filter((c) => c.observationDate === activeTimeline);
    }
    if (riskTierFilter !== 'all') {
      pool = pool.filter((c) => c.riskTier === riskTierFilter);
    }
    return pool
      .sort((a, b) => b.inactivityRiskScore - a.inactivityRiskScore)
      .slice(0, 6);
  }, [customers, activeTimeline, riskTierFilter]);

  // Financial calculations dynamically scaled to operationalCutoff slider & timeline population
  // Cutoff 70% corresponds to standard top 20% capacity. Lower cutoff includes more customers.
  const dynamicContactRatio = useMemo(() => {
    // Linear mapping: 90% cutoff -> 5% contact; 70% cutoff -> 20% contact; 30% cutoff -> 50% contact
    const ratio = 0.20 + (70 - operationalCutoff) * 0.0075;
    return Math.max(0.03, Math.min(0.60, ratio));
  }, [operationalCutoff]);

  const simulatedContactCount = Math.round(activeData.totalCustomersEvaluated * dynamicContactRatio);
  const campaignBudget = simulatedContactCount * 5.0; // $5 per contact
  const estimatedRetained = Math.round(simulatedContactCount * 0.05); // 5% conversion
  const marginPreserved = estimatedRetained * (40.0 * 3); // $40/month for 3 months ($120)
  const netBenefit = marginPreserved - campaignBudget;
  const roiRatio = campaignBudget > 0 ? netBenefit / campaignBudget : 0.195;

  const cutoffPolicyLabel = useMemo(() => {
    if (operationalCutoff >= 80) return { label: 'Conservative (High Conviction)', variant: 'forest' as const };
    if (operationalCutoff >= 65) return { label: 'Balanced Policy (Recommended)', variant: 'crimson' as const };
    return { label: 'Aggressive Coverage', variant: 'amber' as const };
  }, [operationalCutoff]);

  const handleBarClick = (entry: any) => {
    if (!entry) return;
    const tier = entry.tier || (entry.name?.includes('High') ? 'high' : entry.name?.includes('Moderate') ? 'moderate' : 'low');
    setRiskTierFilter((prev) => (prev === tier ? 'all' : tier));
  };

  return (
    <div className="space-y-10 relative">
      {/* 1. Dramatic Editorial Hero Section with Asymmetric Analytical Visual */}
      <div className="relative rounded-2xl border border-[#29332B] bg-[#111611]/80 backdrop-blur-md p-6 sm:p-10 overflow-hidden">
        <Spotlight className="-top-24 left-1/3" fill="#214D35" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Analytical Generative Visual with HUD Telemetry */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
            <AnalyticalContourVisual />
          </div>

          {/* Right Column: Editorial Typography & Actions */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant="forest" size="sm">
                Champion Production Pipeline
              </Badge>
              <Badge variant="default" size="sm">
                Olist E-Commerce Dataset
              </Badge>
              <div className="flex items-center gap-1.5 text-[11px] font-tech text-[#A6AEA5]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#447A56] animate-pulse" />
                <ShinyText text="Continuous Telemetry Active" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-tech uppercase tracking-[0.22em] text-[#C82038] font-semibold">
                Customer Retention Intelligence
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#F2F0E8] leading-[1.08]">
                <SplitText text="SEE RISK." className="text-[#C82038] font-medium mr-3 inline-block" />
                <SplitText text="ACT EARLY." className="text-[#F2F0E8] inline-block" delay={30} />
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#A6AEA5] max-w-xl leading-relaxed">
              Identifying previously active buyers unlikely to make another purchase in the next 90 days.
              Using temporal cutoff simulation and calibrated logistic regression to capture margin before churn locks in.
            </p>

            <div className="pt-2 flex items-center gap-4 flex-wrap">
              <Link to="/prediction-studio">
                <Button variant="primary" size="lg" className="group">
                  <Zap className="h-4 w-4 mr-1 text-[#F2F0E8]" />
                  <span>Launch Prediction Studio</span>
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/customers">
                <Button variant="outline" size="lg">
                  <span>Explore Scored Cohorts</span>
                  <span className="font-tech text-xs ml-1.5 opacity-70">
                    ({formatNumber(activeData.totalCustomersEvaluated)})
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Timeline Snapshot Selector Bar */}
      <div className="rounded-xl border border-[#29332B] bg-[#111611] p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#171D18] text-[#447A56] border border-[#29332B]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F2F0E8]">
                Observation Timeline Snapshot
              </span>
              <p className="text-[11px] text-[#A6AEA5]">
                Switch historical cutoff to audit model behavior across seasonal cohorts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TIMELINE_OPTIONS.map((opt) => {
              const isSelected = activeTimeline === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveTimeline(opt.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56] shadow-sm shadow-[#214D35]/50'
                      : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B] hover:border-[#447A56]/60 hover:text-[#F2F0E8]'
                  }`}
                >
                  <span className={isSelected ? 'font-semibold text-white' : ''}>{opt.quarterLabel}</span>
                  <span
                    className={`text-[10px] font-tech px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-[#111611]/60 text-[#F2F0E8]' : 'bg-[#111611] text-[#A6AEA5]'
                    }`}
                  >
                    {opt.id === 'all' ? '130k' : opt.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanatory Context Note: What this page shows and implies */}
        <div className="mt-4 pt-3.5 border-t border-[#29332B] flex items-start gap-2.5 text-xs text-[#A6AEA5] leading-relaxed">
          <HelpCircle className="h-4 w-4 text-[#447A56] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#F2F0E8]">Cohort Context: </span>
            This dashboard models <span className="font-tech text-[#F2F0E8] font-semibold">{formatNumber(activeData.totalCustomersEvaluated)}</span> active
            buyers from the <span className="text-[#447A56] font-semibold">{activeData.quarterLabel}</span> snapshot.
            In Brazilian e-commerce, only <span className="text-[#447A56] font-semibold">{formatPercent(activeData.baseRepeatPurchaseRate, 2)}</span> of
            buyers reorder within 90 days ({formatNumber(activeData.actualRepeatPurchasers)} customers). The champion pipeline flags
            the <span className="text-[#C82038] font-semibold">Top 20% highest-risk decile</span> ({formatNumber(activeData.recommendedContactCount)} customers)
            to maximize campaign efficiency without burning ad spend on organic repeaters.
          </div>
        </div>
      </div>

      {/* 3. KPI Cards Grid — Dynamically Updating to Selected Timeline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTimeline}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Active Customers Evaluated (with subtle BorderBeam highlight) */}
          <div className="relative group rounded-xl">
            <KpiCard
              label="Active Customers Evaluated"
              value={formatNumber(activeData.totalCustomersEvaluated)}
              subtitle={`${activeData.quarterLabel} (${activeData.timelineId})`}
              icon={<Users className="h-4 w-4 text-[#447A56]" />}
              isLoading={loading || isTimelineLoading}
              delay={0.05}
            />
            <BorderBeam size={100} duration={12} delay={0} colorFrom="#447A56" colorTo="#214D35" borderWidth={1.5} />
          </div>

          <KpiCard
            label="Base Repeat Rate (90d)"
            value={formatPercent(activeData.baseRepeatPurchaseRate, 2)}
            subtitle={`Macro Inactivity: ${formatPercent(activeData.baseInactivityRate, 1)}`}
            icon={<Percent className="h-4 w-4 text-[#447A56]" />}
            lift={`${formatNumber(activeData.actualRepeatPurchasers)} Repeats`}
            liftType="neutral"
            isLoading={loading || isTimelineLoading}
            delay={0.1}
          />

          <KpiCard
            label="Champion Model PR-AUC"
            value={activeData.prAuc.toFixed(4)}
            subtitle={`Baseline Rate: ${activeData.baseRepeatPurchaseRate.toFixed(4)}`}
            icon={<Award className="h-4 w-4 text-[#447A56]" />}
            lift={`+${Math.round((activeData.prAucLiftOverDummy - 1) * 100)}% Lift`}
            liftType="accent"
            isLoading={loading || isTimelineLoading}
            delay={0.15}
          />

          <KpiCard
            label="Recommended Priority Outreach"
            value={formatNumber(activeData.recommendedContactCount)}
            subtitle="Top 20% highest inactivity risk tier"
            icon={<Target className="h-4 w-4 text-[#C82038]" />}
            lift="Action Tier"
            liftType="danger"
            isLoading={loading || isTimelineLoading}
            delay={0.2}
          />
        </motion.div>
      </AnimatePresence>

      {/* 4. Risk Stratification Chart & Retention Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Inactivity Risk Distribution</CardTitle>
                <CardDescription>
                  Click any tier below or in the chart to filter the customer queue table
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {riskTierFilter !== 'all' && (
                  <button
                    onClick={() => setRiskTierFilter('all')}
                    className="flex items-center gap-1 text-[11px] font-tech text-[#C82038] hover:text-[#E33B4F] bg-[#C82038]/10 px-2 py-0.5 rounded border border-[#C82038]/30 transition-colors cursor-pointer"
                  >
                    <span>Reset Filter</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
                <Badge variant="forest" size="sm">
                  {formatNumber(activeData.totalCustomersEvaluated)} Customers
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        handleBarClick(state.activePayload[0].payload);
                      }
                    }}
                  >
                    <XAxis
                      type="number"
                      stroke="#4B554D"
                      fontSize={11}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                    />
                    <YAxis type="category" dataKey="name" stroke="#A6AEA5" fontSize={11} width={180} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111611',
                        border: '1px solid #C82038',
                        borderRadius: '8px',
                        fontSize: '12px',
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
                      formatter={(val: any) => [`${formatNumber(val)} customers (Click to filter)`, 'Count']}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={true}
                      animationDuration={900}
                      animationEasing="ease-out"
                      className="cursor-pointer"
                    >
                      {riskChartData.map((entry, index) => {
                        const isSelected = riskTierFilter === entry.tier;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            opacity={riskTierFilter === 'all' || isSelected ? 1 : 0.4}
                            stroke={isSelected ? '#F2F0E8' : 'none'}
                            strokeWidth={isSelected ? 1.5 : 0}
                            className="cursor-pointer transition-opacity duration-200"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Interactive Breakdown Legend (Click to filter) */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#29332B] text-center">
                <button
                  type="button"
                  onClick={() => setRiskTierFilter((prev) => (prev === 'high' ? 'all' : 'high'))}
                  className={`rounded-lg p-2.5 border transition-all cursor-pointer text-left ${
                    riskTierFilter === 'high'
                      ? 'bg-[#C82038]/25 border-[#E33B4F] shadow-sm shadow-[#C82038]/50 ring-1 ring-[#E33B4F]'
                      : 'bg-[#C82038]/10 border-[#C82038]/30 hover:border-[#C82038]/60 hover:bg-[#C82038]/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#E33B4F] font-medium">High Risk (≥70%)</span>
                    {riskTierFilter === 'high' && <span className="text-[9px] font-tech text-[#E33B4F]">Active</span>}
                  </div>
                  <p className="mt-1 font-tech text-base font-bold text-[#F2F0E8]">
                    {formatNumber(activeData.riskDistribution.highRisk)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRiskTierFilter((prev) => (prev === 'moderate' ? 'all' : 'moderate'))}
                  className={`rounded-lg p-2.5 border transition-all cursor-pointer text-left ${
                    riskTierFilter === 'moderate'
                      ? 'bg-[#C48232]/25 border-[#C48232] shadow-sm ring-1 ring-[#C48232]'
                      : 'bg-[#C48232]/10 border-[#C48232]/30 hover:border-[#C48232]/60 hover:bg-[#C48232]/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#C48232] font-medium">Moderate (40-69%)</span>
                    {riskTierFilter === 'moderate' && <span className="text-[9px] font-tech text-[#C48232]">Active</span>}
                  </div>
                  <p className="mt-1 font-tech text-base font-bold text-[#F2F0E8]">
                    {formatNumber(activeData.riskDistribution.moderateRisk)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRiskTierFilter((prev) => (prev === 'low' ? 'all' : 'low'))}
                  className={`rounded-lg p-2.5 border transition-all cursor-pointer text-left ${
                    riskTierFilter === 'low'
                      ? 'bg-[#214D35]/40 border-[#447A56] shadow-sm ring-1 ring-[#447A56]'
                      : 'bg-[#214D35]/20 border-[#214D35] hover:border-[#447A56]/60 hover:bg-[#214D35]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#447A56] font-medium">Low Risk (&lt;40%)</span>
                    {riskTierFilter === 'low' && <span className="text-[9px] font-tech text-[#447A56]">Active</span>}
                  </div>
                  <p className="mt-1 font-tech text-base font-bold text-[#F2F0E8]">
                    {formatNumber(activeData.riskDistribution.lowRisk)}
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retention Strategy & Impact Card (With Interactive Operational Cutoff Slider) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Retention Campaign Economics</CardTitle>
                  <Badge variant={cutoffPolicyLabel.variant} size="sm">
                    {cutoffPolicyLabel.label}
                  </Badge>
                </div>
                <CardDescription>
                  Simulate intervention ROI under flexible decision cutoff policies
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                {/* Interactive Operational Cutoff Slider */}
                <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-[#447A56]" />
                      <span className="text-xs font-semibold text-[#F2F0E8]">
                        Operational Risk Cutoff Threshold
                      </span>
                    </div>
                    <span className="font-tech text-xs font-bold text-[#447A56] bg-[#102016] px-2 py-0.5 rounded border border-[#214D35]">
                      ≥ {operationalCutoff}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="5"
                    value={operationalCutoff}
                    onChange={(e) => setOperationalCutoff(parseInt(e.target.value, 10))}
                    className="w-full slider-crimson accent-[#C82038] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#A6AEA5] font-tech">
                    <span>30% (High Volume)</span>
                    <span>70% (Top 20% Standard)</span>
                    <span>90% (Strict Focus)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#29332B]">
                    <span className="text-[#A6AEA5]">Prioritized Outreach Cohort:</span>
                    <span className="font-tech text-[#F2F0E8] font-medium">
                      {formatNumber(simulatedContactCount)} buyers ({(dynamicContactRatio * 100).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#29332B]">
                    <span className="text-[#A6AEA5]">Outreach Cost ($5.00/user):</span>
                    <span className="font-tech text-[#F2F0E8] font-medium">
                      {formatCurrency(campaignBudget)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#29332B]">
                    <span className="text-[#A6AEA5]">Estimated Re-Activated Buyers:</span>
                    <span className="font-tech text-[#447A56] font-medium">
                      {formatNumber(estimatedRetained)} buyers (5% conv.)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#29332B]">
                    <span className="text-[#A6AEA5]">Gross Margin Preserved (3 mos):</span>
                    <span className="font-tech text-[#447A56] font-bold">
                      {formatCurrency(marginPreserved)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5">
                    <span className="text-[#A6AEA5]">Net Scenario Benefit & ROI:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-tech text-[#447A56] font-bold">
                        +{formatCurrency(netBenefit)}
                      </span>
                      <Badge variant="forest" size="sm">
                        {formatPercent(roiRatio)} ROI
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#090B09] p-2.5 border border-[#29332B] text-[11px] text-[#A6AEA5] leading-relaxed">
                  <span className="text-[#C48232] font-medium">Causal Caution:</span> Projections assume a 5% response
                  rate on contactable churners. ML scores prioritize customers by risk rank; true incremental lift requires randomized control trials.
                </div>
              </CardContent>
            </div>

            <div className="p-5 pt-0">
              <Link to="/prediction-studio">
                <Button variant="secondary" size="sm" className="w-full">
                  <Zap className="h-3.5 w-3.5 text-[#C82038]" />
                  <span>Test Individual Customers in Prediction Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Editorial Narrative Section with React Bits Scroll Reveal */}
      <div className="py-2">
        <ScrollReveal
          baseOpacity={0.15}
          enableBlur={true}
          baseRotation={2}
          blurStrength={4}
          containerClassName="my-3 text-center max-w-3xl mx-auto"
          textClassName="font-serif text-lg sm:text-2xl text-[#F2F0E8] font-normal leading-relaxed tracking-wide"
        >
          Precision retention modeling preserves enterprise margin by identifying dormant buyers before defection becomes permanent.
        </ScrollReveal>
      </div>

      {/* 5. Highest Inactivity Risk Customers Preview (Filtered to Timeline & Active Risk Tier) */}
      {highRiskPreview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Customer Cohort Queue ({activeData.quarterLabel})</CardTitle>
                {riskTierFilter !== 'all' && (
                  <Badge
                    variant={riskTierFilter === 'high' ? 'crimson' : riskTierFilter === 'moderate' ? 'amber' : 'forest'}
                    size="sm"
                  >
                    Filter: {riskTierFilter.toUpperCase()} RISK
                  </Badge>
                )}
              </div>
              <CardDescription>
                {riskTierFilter === 'all'
                  ? 'Top customers flagged for prioritized retention outreach in this timeline'
                  : `Filtered to show customers currently categorized in the ${riskTierFilter} inactivity risk tier`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {riskTierFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRiskTierFilter('all')}
                  className="text-xs text-[#A6AEA5] hover:text-[#F2F0E8]"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filter
                </Button>
              )}
              <Link to="/customers">
                <Button variant="outline" size="sm">
                  <span>View Full Population</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090B09] text-[#A6AEA5] uppercase text-[10px] tracking-wider border-b border-[#29332B]">
                  <tr>
                    <th className="px-5 py-3">Customer ID</th>
                    <th className="px-5 py-3">Inactivity Risk</th>
                    <th className="px-5 py-3">Repeat Prob</th>
                    <th className="px-5 py-3">Historical Spend</th>
                    <th className="px-5 py-3">Recency</th>
                    <th className="px-5 py-3">Action Tier</th>
                    <th className="px-5 py-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#29332B]">
                  {highRiskPreview.map((cust) => (
                    <tr
                      key={cust.customerUniqueId}
                      onClick={() => handleCustomerClick(cust)}
                      className="hover:bg-[#171D18] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-tech text-[#F2F0E8]">
                        {truncateId(cust.customerUniqueId, 8, 6)}
                      </td>
                      <td className="px-5 py-3.5">
                        <RiskBadge tier={cust.riskTier} score={cust.inactivityRiskScore} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 font-tech text-[#447A56]">
                        {formatPercent(cust.repeatPurchaseProbability, 2)}
                      </td>
                      <td className="px-5 py-3.5 font-tech text-[#F2F0E8]">
                        {cust.totalSpend !== undefined ? formatCurrency(cust.totalSpend) : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-tech text-[#A6AEA5]">
                        {cust.recencyDays !== undefined ? `${Math.round(cust.recencyDays)}d` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {cust.priorityRetentionTarget ? (
                          <Badge variant="crimson" size="sm">
                            Top 20%
                          </Badge>
                        ) : (
                          <span className="text-[#A6AEA5] font-tech text-[11px]">Standard</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomerClick(cust);
                          }}
                          className="h-7 text-xs text-[#A6AEA5] group-hover:text-[#F2F0E8]"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slide-over Customer Detail Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
