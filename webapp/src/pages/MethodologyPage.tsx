import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Database,
  Calendar,
  Layers,
  Award,
  DollarSign,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';

export function MethodologyPage() {
  // Interactive ROI parameters
  const [outreachCost, setOutreachCost] = useState<number>(5.0);
  const [conversionRate, setConversionRate] = useState<number>(0.05); // 5%
  const [marginPerMonth, setMarginPerMonth] = useState<number>(40.0);
  const [targetCount, setTargetCount] = useState<number>(7833);

  // Derived financial simulation calculations
  const totalCampaignCost = targetCount * outreachCost;
  const customersRetained = targetCount * conversionRate;
  const grossMarginSaved = customersRetained * (marginPerMonth * 3);
  const netProfit = grossMarginSaved - totalCampaignCost;
  const roi = totalCampaignCost > 0 ? (netProfit / totalCampaignCost) * 100 : 0;

  const pipelineStages = [
    {
      step: '01',
      title: 'Data Ingestion & Hygiene',
      description:
        'Parsed 100,000+ orders from Brazilian Olist marketplace. Enforced customer entity deduplication via customer_unique_id.',
      icon: Database,
      badge: 'Data Layer',
      color: 'violet',
    },
    {
      step: '02',
      title: 'Rolling-Origin Temporal Windows',
      description:
        'Constructed 180-day observation lookback windows with strictly non-overlapping 90-day forward outcome evaluation horizons to prevent lookahead leakage.',
      icon: Calendar,
      badge: 'Temporal Split',
      color: 'cyan',
    },
    {
      step: '03',
      title: 'Feature Engineering Store',
      description:
        'Engineered 21 leakage-free customer features spanning frequency, spend ratios, recency cadence, basket stability, and logistics.',
      icon: Layers,
      badge: '21 Signals',
      color: 'mint',
    },
    {
      step: '04',
      title: 'Balanced Machine Learning Pipeline',
      description:
        'Trained Balanced Logistic Regression model optimized for Precision-Recall AUC (PR-AUC) under severe 99.3% negative class imbalance.',
      icon: Award,
      badge: 'Champion ML',
      color: 'amber',
    },
    {
      step: '05',
      title: 'Retention Decision Policy',
      description:
        'Rank-ordered customers by inactivity risk (1 - P(repeat)) and prioritized top 20% outreach decile for retention campaigns.',
      icon: DollarSign,
      badge: 'Policy & ROI',
      color: 'coral',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#11182A] via-[#0C1322] to-[#161F34] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="violet" size="sm">
                Engineering Methodology
              </Badge>
              <Badge variant="mint" size="sm">
                Business ROI Rigor
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Methodology, Inactivity Proxy & Financial Simulation
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Transparent review of the machine learning design principles, non-contractual retail definitions,
              financial scenario mechanics, and scientific causal boundaries.
            </p>
          </div>
        </div>
      </div>

      {/* 5-Stage Architecture Flow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>End-to-End ML Pipeline Architecture</CardTitle>
              <CardDescription>
                Chronological data pipeline from raw Olist tables to operational retention scoring
              </CardDescription>
            </div>
            <Badge variant="cyan" size="sm">
              5 Modular Stages
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.step}
                  className="rounded-xl bg-[#080B14] p-4 border border-white/5 flex flex-col justify-between relative group hover:border-[#8B7CFF]/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#8B7CFF] bg-[#8B7CFF]/10 px-2 py-0.5 rounded">
                        {stage.step}
                      </span>
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-xs font-semibold text-white mb-1.5">{stage.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{stage.description}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-white/5">
                    <Badge variant={stage.color as any} size="sm">
                      {stage.badge}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Domain Reality: Inactivity vs Permanent Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#8B7CFF]" />
              <CardTitle>Non-Contractual Inactivity vs. Churn</CardTitle>
            </div>
            <CardDescription>
              Why 90-day inactivity is modeled rather than permanent abandonment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed">
            <p>
              In contractual business models (e.g. Netflix, Spotify, SaaS subscriptions), churn is explicit and
              timestamped: the user cancels their plan.
            </p>
            <p>
              In <span className="text-white font-semibold">non-contractual e-commerce</span> (such as Olist), customers
              never notify the platform that they have departed. A buyer who has not placed an order in 90 days may return
              months later, or may never return.
            </p>
            <div className="rounded-lg bg-[#080B14] p-3 border border-white/5 space-y-1.5">
              <div className="font-semibold text-white">Mathematical Modeling Definition:</div>
              <div className="font-mono text-[11px] text-[#53DDE0]">
                repeat_purchase_next_90d ∈ &#123;0, 1&#125;
              </div>
              <div className="font-mono text-[11px] text-[#FB7185]">
                inactivity_risk_score = 1.0 - P(repeat_purchase_next_90d)
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              This operational definition allows retention teams to intervene proactively while the customer still remembers
              their shopping experience, rather than waiting indefinitely.
            </p>
          </CardContent>
        </Card>

        {/* Known Limitations & Scientific Boundaries */}
        <Card className="border-amber-500/20 bg-[#11182A]/90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-[#F5BD64]" />
              <CardTitle className="text-white">Scientific Limitations & Causal Boundaries</CardTitle>
            </div>
            <CardDescription>
              Essential considerations prior to live commercial deployment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="font-mono text-amber-400 font-bold">1.</span>
              <div>
                <span className="text-white font-medium">Extreme Base-Rate Imbalance:</span> Over 97% of Olist customers
                purchase only once. The 90-day repeat purchase rate in historical test data is only 0.69% (270 buyers out
                of 39,162).
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-mono text-amber-400 font-bold">2.</span>
              <div>
                <span className="text-white font-medium">Correlation vs. Causation:</span> The ML model identifies
                statistical associations. It does not measure causal treatment effect or determine whether an outreach
                discount will persuade a customer who would have otherwise lapsed.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-mono text-amber-400 font-bold">3.</span>
              <div>
                <span className="text-white font-medium">Mandatory A/B Testing:</span> Prior to allocating commercial
                budget, the retention team must run a randomized controlled trial (treatment vs holdout control group)
                to compute true incremental lift.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Business ROI Simulator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interactive Financial ROI Simulation</CardTitle>
              <CardDescription>
                Test different campaign assumptions to project financial outcomes for prioritized retention outreach
              </CardDescription>
            </div>
            <Badge variant="mint" size="sm">
              Scenario Modeling
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Outreach Cost Slider */}
            <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Outreach Cost / User</span>
                <span className="font-mono font-bold text-white">R$ {outreachCost.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={outreachCost}
                onChange={(e) => setOutreachCost(parseFloat(e.target.value))}
                className="w-full accent-[#8B7CFF] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">e.g. Email (R$ 1) vs SMS (R$ 5) vs Voucher (R$ 15)</span>
            </div>

            {/* Assumed Response Rate Slider */}
            <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Intervention Success Rate</span>
                <span className="font-mono font-bold text-white">{(conversionRate * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.005"
                value={conversionRate}
                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                className="w-full accent-[#53DDE0] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Benchmark retail re-order conversion</span>
            </div>

            {/* Monthly Margin Slider */}
            <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Monthly Margin (R$)</span>
                <span className="font-mono font-bold text-white">R$ {marginPerMonth.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={marginPerMonth}
                onChange={(e) => setMarginPerMonth(parseFloat(e.target.value))}
                className="w-full accent-[#69DDA5] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Preserved gross contribution for 3 months</span>
            </div>

            {/* Contacted Cohort Size */}
            <div className="rounded-xl bg-[#080B14] p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Contact Population</span>
                <span className="font-mono font-bold text-white">{formatNumber(targetCount)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                className="w-full accent-[#F5BD64] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">20% capacity = 7,833 customers</span>
            </div>
          </div>

          {/* Simulation Output Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="rounded-xl bg-[#161F34]/80 p-4 border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total Campaign Cost</span>
              <p className="mt-1 font-mono text-xl font-bold text-white">
                {formatCurrency(totalCampaignCost)}
              </p>
            </div>

            <div className="rounded-xl bg-[#161F34]/80 p-4 border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Retained Customers</span>
              <p className="mt-1 font-mono text-xl font-bold text-[#53DDE0]">
                {Math.round(customersRetained)} buyers
              </p>
            </div>

            <div className="rounded-xl bg-[#161F34]/80 p-4 border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Gross Margin Preserved</span>
              <p className="mt-1 font-mono text-xl font-bold text-[#69DDA5]">
                {formatCurrency(grossMarginSaved)}
              </p>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                netProfit >= 0
                  ? 'bg-[#69DDA5]/10 border-[#69DDA5]/20 text-[#69DDA5]'
                  : 'bg-[#FB7185]/10 border-[#FB7185]/20 text-[#FB7185]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Net Financial Benefit</span>
                <Badge variant={netProfit >= 0 ? 'mint' : 'coral'} size="sm">
                  {roi.toFixed(1)}% ROI
                </Badge>
              </div>
              <p className="mt-1 font-mono text-xl font-bold text-white">
                {netProfit >= 0 ? '+' : ''}
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
