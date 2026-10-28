import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Percent,
  Award,
  TrendingUp,
  Target,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Zap,
  Calendar,
  Layers,
  HelpCircle,
  DollarSign,
  TrendingDown,
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
import { EmptyState } from '../components/shared/EmptyState';
import { RiskBadge } from '../components/shared/RiskBadge';
import { CustomerDrawer } from '../components/shared/CustomerDrawer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useTimeline, TIMELINE_OPTIONS } from '../lib/context/TimelineContext';
import { loadCustomerPredictions, loadModelSummary } from '../lib/data/data-client';
import { CustomerPrediction, ModelSummary } from '../lib/data/types';
import { formatNumber, formatPercent, formatCurrency, truncateId } from '../lib/utils';

export function OverviewPage() {
  const { activeTimeline, setActiveTimeline, timelineMetrics, currentMetrics, isLoading: isTimelineLoading } = useTimeline();

  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [modelSummary, setModelSummary] = useState<ModelSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerPrediction[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPrediction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [modelRes, custRes] = await Promise.all([
      loadModelSummary(),
      loadCustomerPredictions(),
    ]);

    if (modelRes.status === 'success') setModelSummary(modelRes.data);
    if (custRes.status === 'success') setCustomers(custRes.data);

    setLoading(false);
    setRetrying(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    fetchData();
  };

  const handleCustomerClick = (c: CustomerPrediction) => {
    setSelectedCustomer(c);
    setIsDrawerOpen(true);
  };

  // Dynamic Timeline Metrics (falls back safely if still loading)
  const activeData = useMemo(() => {
    if (currentMetrics) return currentMetrics;
    // Default fallback to 2018-06-01 or all
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
      { name: 'High Inactivity Risk (≥70%)', count: dist.highRisk, color: '#FB7185' },
      { name: 'Moderate Risk (40-69%)', count: dist.moderateRisk, color: '#F5BD64' },
      { name: 'Low Inactivity Risk (<40%)', count: dist.lowRisk, color: '#69DDA5' },
    ];
  }, [activeData]);

  // Filter preview customers by selected timeline
  const highRiskPreview = useMemo(() => {
    let pool = [...customers];
    if (activeTimeline !== 'all') {
      pool = pool.filter((c) => c.observationDate === activeTimeline);
    }
    return pool
      .sort((a, b) => b.inactivityRiskScore - a.inactivityRiskScore)
      .slice(0, 6);
  }, [customers, activeTimeline]);

  // Financial calculations dynamically scaled to active timeline population
  const campaignBudget = activeData.recommendedContactCount * 5.0; // R$ 5 per contact
  const estimatedRetained = Math.round(activeData.recommendedContactCount * 0.05); // 5% conversion
  const marginPreserved = estimatedRetained * (40.0 * 3); // R$ 40/month for 3 months
  const netBenefit = marginPreserved - campaignBudget;
  const roiRatio = campaignBudget > 0 ? netBenefit / campaignBudget : 0.195;

  const isDataUnavailable = !loading && !activeData;

  return (
    <div className="space-y-8">
      {/* 1. Executive Intelligence Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#11182A] via-[#0D1424] to-[#161F34] p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="violet" size="sm">
                Champion Production Pipeline
              </Badge>
              <Badge variant="cyan" size="sm">
                Olist E-Commerce Dataset
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Executive Retention Intelligence
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Identifying previously active buyers unlikely to make another purchase in the next 90 days.
              Select any timeline snapshot below to inspect how customer cohorts evolved across platform history.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link to="/prediction-studio">
              <Button variant="primary" size="sm" className="bg-[#8B7CFF] text-[#080B14]">
                <Zap className="h-4 w-4 fill-current" />
                <span>Prediction Studio</span>
              </Button>
            </Link>
            <Link to="/customers">
              <Button variant="secondary" size="sm">
                <span>Explore Scored Customers</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#8B7CFF]/10 blur-3xl pointer-events-none" />
      </motion.div>

      {/* 2. Interactive Timeline Snapshot Selector Bar */}
      <Card className="p-4 border-[#8B7CFF]/20 bg-[#0B1020]/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8B7CFF]" />
            <span className="text-xs font-semibold text-white">Select Observation Timeline Snapshot:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TIMELINE_OPTIONS.map((opt) => {
              const isSelected = activeTimeline === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveTimeline(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#8B7CFF] text-[#080B14] font-bold border-[#8B7CFF] shadow-lg shadow-[#8B7CFF]/20'
                      : 'bg-[#11182A] text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span>{opt.quarterLabel}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-[#080B14]/30 text-black' : 'bg-white/10 text-slate-400'
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
        <div className="mt-3.5 pt-3 border-t border-white/5 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          <HelpCircle className="h-4 w-4 text-[#53DDE0] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">What this Overview page is showing & implying: </span>
            This dashboard models <span className="font-mono text-white font-semibold">{formatNumber(activeData.totalCustomersEvaluated)}</span> active
            buyers from the <span className="text-[#53DDE0] font-semibold">{activeData.quarterLabel}</span> observation snapshot.
            In non-contractual retail, only <span className="text-[#69DDA5] font-semibold">{formatPercent(activeData.baseRepeatPurchaseRate, 2)}</span> of
            customers repeat within 90 days ({activeData.actualRepeatPurchasers} buyers). The machine learning model identifies
            the <span className="text-[#FB7185] font-semibold">Top 20% highest-risk tier</span> ({formatNumber(activeData.recommendedContactCount)} customers)
            so retention campaigns focus budget exclusively where intervention generates positive financial ROI.
          </div>
        </div>
      </Card>

      {/* 3. KPI Cards Grid — Dynamically Updating to Selected Timeline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTimeline}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard
            label="Active Customers Evaluated"
            value={formatNumber(activeData.totalCustomersEvaluated)}
            subtitle={`${activeData.quarterLabel} (${activeData.timelineId})`}
            icon={<Users className="h-4 w-4 text-[#8B7CFF]" />}
            isLoading={loading || isTimelineLoading}
            delay={0.05}
          />

          <KpiCard
            label="Base Repeat Rate (90d)"
            value={formatPercent(activeData.baseRepeatPurchaseRate, 2)}
            subtitle={`Macro Inactivity: ${formatPercent(activeData.baseInactivityRate, 1)}`}
            icon={<Percent className="h-4 w-4 text-[#53DDE0]" />}
            lift={`${formatNumber(activeData.actualRepeatPurchasers)} Repeats`}
            liftType="neutral"
            isLoading={loading || isTimelineLoading}
            delay={0.1}
          />

          <KpiCard
            label="Champion Model PR-AUC"
            value={activeData.prAuc.toFixed(4)}
            subtitle={`Baseline Rate: ${activeData.baseRepeatPurchaseRate.toFixed(4)}`}
            icon={<Award className="h-4 w-4 text-[#69DDA5]" />}
            lift={`+${Math.round((activeData.prAucLiftOverDummy - 1) * 100)}% Lift`}
            liftType="accent"
            isLoading={loading || isTimelineLoading}
            delay={0.15}
          />

          <KpiCard
            label="Recommended Priority Outreach"
            value={formatNumber(activeData.recommendedContactCount)}
            subtitle="Top 20% highest inactivity risk tier"
            icon={<Target className="h-4 w-4 text-[#F5BD64]" />}
            lift="Action Tier"
            liftType="positive"
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
                  Stratification for {activeData.quarterLabel} using formula: risk = 1 - P(repeat)
                </CardDescription>
              </div>
              <Badge variant="violet" size="sm">
                {formatNumber(activeData.totalCustomersEvaluated)} Customers
              </Badge>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      fontSize={11}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                    />
                    <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} width={170} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B1020',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${formatNumber(val)} customers`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {riskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown Legend */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5 text-center">
                <div className="rounded-lg bg-[#FB7185]/10 p-2.5 border border-[#FB7185]/20">
                  <span className="text-[11px] text-[#FB7185] font-medium">High Risk (≥70%)</span>
                  <p className="mt-1 font-mono text-base font-bold text-white">
                    {formatNumber(activeData.riskDistribution.highRisk)}
                  </p>
                </div>

                <div className="rounded-lg bg-[#F5BD64]/10 p-2.5 border border-[#F5BD64]/20">
                  <span className="text-[11px] text-[#F5BD64] font-medium">Moderate (40-69%)</span>
                  <p className="mt-1 font-mono text-base font-bold text-white">
                    {formatNumber(activeData.riskDistribution.moderateRisk)}
                  </p>
                </div>

                <div className="rounded-lg bg-[#69DDA5]/10 p-2.5 border border-[#69DDA5]/20">
                  <span className="text-[11px] text-[#69DDA5] font-medium">Low Risk (&lt;40%)</span>
                  <p className="mt-1 font-mono text-base font-bold text-white">
                    {formatNumber(activeData.riskDistribution.lowRisk)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retention Strategy & Impact Card */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Retention Campaign Economics</CardTitle>
                  <Badge variant="cyan" size="sm">
                    Top 20% Capacity
                  </Badge>
                </div>
                <CardDescription>
                  Projected ROI for {activeData.quarterLabel} under standard campaign assumptions
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-400">Target Contact Population:</span>
                    <span className="font-mono text-white font-medium">
                      {formatNumber(activeData.recommendedContactCount)} customers
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-400">Outreach Cost (R$ 5.00/user):</span>
                    <span className="font-mono text-white font-medium">
                      {formatCurrency(campaignBudget)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-400">Estimated Re-Activated Buyers:</span>
                    <span className="font-mono text-[#53DDE0] font-medium">
                      {formatNumber(estimatedRetained)} buyers (5% conversion)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-400">Gross Margin Preserved (3 mos):</span>
                    <span className="font-mono text-[#69DDA5] font-bold">
                      {formatCurrency(marginPreserved)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="text-slate-400">Net Scenario Benefit & ROI:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#69DDA5] font-bold">
                        +{formatCurrency(netBenefit)}
                      </span>
                      <Badge variant="mint" size="sm">
                        {formatPercent(roiRatio)} ROI
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#080B14] p-3 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-medium">Causal Caution:</span> Calculations assume a 5% response
                  rate. ML scores prioritize customers by predicted risk; causal lift should be verified via A/B testing.
                </div>
              </CardContent>
            </div>

            <div className="p-5 pt-0">
              <Link to="/prediction-studio">
                <Button variant="secondary" size="sm" className="w-full">
                  <Zap className="h-3.5 w-3.5 text-[#8B7CFF]" />
                  <span>Test Individual Customers in Prediction Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Highest Inactivity Risk Customers Preview (Filtered to Timeline) */}
      {highRiskPreview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Highest Inactivity Risk Customers ({activeData.quarterLabel})</CardTitle>
              <CardDescription>
                Top customers flagged by the model for prioritized retention outreach in this timeline
              </CardDescription>
            </div>
            <Link to="/customers">
              <Button variant="outline" size="sm">
                <span>View Full Population</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1020] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/5">
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
                <tbody className="divide-y divide-white/5">
                  {highRiskPreview.map((cust) => (
                    <tr
                      key={cust.customerUniqueId}
                      onClick={() => handleCustomerClick(cust)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono text-slate-200">
                        {truncateId(cust.customerUniqueId, 8, 6)}
                      </td>
                      <td className="px-5 py-3.5">
                        <RiskBadge tier={cust.riskTier} score={cust.inactivityRiskScore} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#53DDE0]">
                        {formatPercent(cust.repeatPurchaseProbability, 2)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-white">
                        {cust.totalSpend !== undefined ? formatCurrency(cust.totalSpend) : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {cust.recencyDays !== undefined ? `${Math.round(cust.recencyDays)}d` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {cust.priorityRetentionTarget ? (
                          <Badge variant="violet" size="sm">
                            Top 20%
                          </Badge>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Standard</span>
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
                          className="h-7 text-xs text-slate-400 group-hover:text-white"
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
