import React, { useState } from 'react';
import {
  Compass,
  Database,
  Calendar,
  Layers,
  Award,
  DollarSign,
  AlertOctagon,
  Cpu,
  Scale,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Activity,
  FileCode,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { formatCurrency, formatNumber } from '../lib/utils';

export function MethodologyPage() {
  // Interactive ROI parameters
  const [outreachCost, setOutreachCost] = useState<number>(5.0);
  const [conversionRate, setConversionRate] = useState<number>(0.05); // 5%
  const [marginPerMonth, setMarginPerMonth] = useState<number>(40.0);
  const [targetCount, setTargetCount] = useState<number>(7833);

  // Interactive Architecture Blueprint Stage Selector
  const [selectedBlueprintStage, setSelectedBlueprintStage] = useState<number>(3); // Default to Champion Model stage

  // Derived financial simulation calculations
  const totalCampaignCost = targetCount * outreachCost;
  const customersRetained = targetCount * conversionRate;
  const grossMarginSaved = customersRetained * (marginPerMonth * 3);
  const netProfit = grossMarginSaved - totalCampaignCost;
  const roi = totalCampaignCost > 0 ? (netProfit / totalCampaignCost) * 100 : 0;

  const blueprintStages = [
    {
      id: 0,
      step: '01',
      title: 'Data Ingestion & Deduplication',
      shortTitle: 'Ingestion Layer',
      icon: Database,
      badge: 'Data Layer',
      variant: 'forest',
      summary: '100,000+ Brazilian Olist records deduplicated into true customer behavioral entities.',
      inputs: ['Raw Olist Orders CSV (99,441 records)', 'Customer Geolocation & State Registry', 'Product Category & SKU Metadata'],
      outputs: ['Customer Entity Behavioral Master Table', 'Deduplicated customer_unique_id tokens'],
      keyTechnique: 'Separating transient checkout IDs (customer_id) from persistent human buyers (customer_unique_id) to reconstruct authentic multi-order lifespans.',
    },
    {
      id: 1,
      step: '02',
      title: 'Rolling-Origin Temporal Windows',
      shortTitle: 'Temporal Splits',
      icon: Calendar,
      badge: 'Zero Leakage',
      variant: 'default',
      summary: 'Strictly non-overlapping 180-day lookback and 90-day forward evaluation horizons.',
      inputs: ['Timestamped Order Sequence: [T_start, T_cutoff]', 'Cutoff Date T_0 for cohort observation'],
      outputs: ['Feature Lookback Horizon [T_0 - 180d, T_0]', 'Ground-Truth Binary Label y ∈ {0, 1} in [T_0, T_0 + 90d]'],
      keyTechnique: 'Rolling-origin temporal partitions guarantee zero target leakage. All predictor features terminate strictly at T_0 before outcome evaluation begins.',
    },
    {
      id: 2,
      step: '03',
      title: 'Leakage-Free Feature Store',
      shortTitle: '21 Signals',
      icon: Layers,
      badge: 'Signal Store',
      variant: 'forest',
      summary: '21 engineered signals across RFM-D, basket stability, inter-order intervals, and logistics.',
      inputs: ['Order timestamps, quantities, freight fees, item categories, seller locations'],
      outputs: ['21-dimensional normalized numerical + categorical feature vector x_i'],
      keyTechnique: 'StandardScaler centering (μ, σ) and categorical target encoding. Captures velocity ratios (recent 90d spend vs. earlier spend) as primary leading indicators.',
    },
    {
      id: 3,
      step: '04',
      title: 'Balanced ML Champion Engine',
      shortTitle: 'Champion ML',
      icon: Award,
      badge: 'Scikit-Learn',
      variant: 'crimson',
      summary: 'Balanced Logistic Regression optimizing PR-AUC (+1.70× out-of-sample test lift, +1.63× top-decile re-engagement lift) under severe 99.31% imbalance.',
      inputs: ['21 engineered features x_i', 'Inverse-frequency class balancing weights w_j = N / (2 · N_j)'],
      outputs: ['Continuous probability P(repeat) ∈ [0, 1]', 'Log-odds z = β_0 + Σ β_i z_i', 'Inactivity Risk Score (1 - P)'],
      keyTechnique: 'Inverse-frequency class balancing prevents probability collapse on rare 0.69% positive repeaters. Predictions serve as a calibrated relative risk-ranking index for prioritizing outreach, with exact linear log-odds attribution (β_i · z_i).',
    },
    {
      id: 4,
      step: '05',
      title: 'Dual-Engine Serving Infrastructure',
      shortTitle: 'Serving Layer',
      icon: Cpu,
      badge: 'FastAPI + Edge',
      variant: 'forest',
      summary: 'Python FastAPI microservice (port 8000) paired with an in-browser 0ms Edge ML engine.',
      inputs: ['Real-time interactive user inputs (Recency, Spend, Orders, Tenure, State)'],
      outputs: ['0ms Instantaneous client-side inference', 'FastAPI REST verification payload', 'Telemetry health status'],
      keyTechnique: 'Dual-engine architecture eliminates server lag. Full Scikit-Learn weights and standard scalers compile into TypeScript for 100% offline mathematical parity.',
    },
    {
      id: 5,
      step: '06',
      title: 'Operational Policy & Financial ROI',
      shortTitle: 'Decision Layer',
      icon: DollarSign,
      badge: 'Policy & ROI',
      variant: 'amber',
      summary: 'Decile prioritization and cost-matrix simulation to preserve margin before churn locks in.',
      inputs: ['Risk ranking (1 - P(repeat))', 'Campaign outreach cost ($)', 'Preserved monthly gross margin ($)'],
      outputs: ['Top 20% outreach priority cohort', 'Projected net profit saved ($)', 'Targeted retention playbooks'],
      keyTechnique: 'Connecting probabilistic ML scores to dollars saved. Mandates randomized A/B holdouts (treatment vs. control) to isolate true incremental lift.',
    },
  ];

  const activeStage = blueprintStages[selectedBlueprintStage];
  const ActiveStageIcon = activeStage.icon;

  return (
    <div className="space-y-10">
      {/* Editorial Header Banner */}
      <div className="rounded-2xl border border-[#29332B] bg-[#111611] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="forest" size="sm">
                Engineering Methodology
              </Badge>
              <Badge variant="default" size="sm">
                Production ML Architecture
              </Badge>
            </div>
            <span className="text-[10px] font-tech uppercase tracking-[0.2em] text-[#C82038]">
              Methodology, Data Flow & Causal Boundaries
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-normal text-[#F2F0E8] leading-tight">
              System Architecture, Model Selection & Mathematical Mechanics
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#A6AEA5] max-w-2xl leading-relaxed">
              A comprehensive technical inspection for software developers and machine learning engineers:
              from raw Brazilian marketplace transactions to leakage-free temporal splits, PR-AUC champion selection,
              and dual-engine edge serving.
            </p>
          </div>
        </div>
      </div>

      {/* 1. INTERACTIVE SYSTEM ARCHITECTURE BLUEPRINT (Interactive CAD Visual) */}
      <Card className="border-[#29332B] shadow-2xl bg-[#111611] overflow-hidden">
        <CardHeader className="border-b border-[#29332B] bg-[#090B09]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#447A56] animate-pulse" />
                <CardTitle className="text-base font-semibold">End-to-End System & Data Flow Blueprint</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Click any pipeline stage below to inspect its data inputs, transformation algorithms, and architectural outputs
              </CardDescription>
            </div>
            <Badge variant="forest" size="sm">
              6 Modular Stages
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Interactive Pipeline Node Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {blueprintStages.map((stage) => {
              const Icon = stage.icon;
              const isSelected = selectedBlueprintStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedBlueprintStage(stage.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[92px] ${
                    isSelected
                      ? 'bg-[#102016] border-[#447A56] shadow-[0_0_15px_rgba(68,122,86,0.25)]'
                      : 'bg-[#090B09] border-[#29332B] hover:border-[#447A56]/60 hover:bg-[#111611]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-tech text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56]'
                          : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B]'
                      }`}
                    >
                      {stage.step}
                    </span>
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-[#447A56]' : 'text-[#A6AEA5]'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#F2F0E8] font-tech leading-tight mt-2">
                      {stage.shortTitle}
                    </h4>
                    <span className="text-[9.5px] text-[#A6AEA5] line-clamp-1 block mt-0.5">
                      {stage.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Blueprint Stage Detailed Inspector Card */}
          <div className="rounded-xl bg-[#090B09] border border-[#214D35] p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29332B]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102016] border border-[#447A56] text-[#447A56]">
                  <ActiveStageIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech text-xs text-[#C82038] font-bold">STAGE {activeStage.step}</span>
                    <span className="text-[#29332B]">•</span>
                    <h3 className="text-sm sm:text-base font-semibold text-[#F2F0E8]">{activeStage.title}</h3>
                  </div>
                  <p className="text-xs text-[#A6AEA5] mt-0.5">{activeStage.summary}</p>
                </div>
              </div>
              <Badge variant={activeStage.variant as any} size="sm" className="shrink-0 self-start sm:self-center">
                {activeStage.badge}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
              {/* Inputs */}
              <div className="rounded-lg bg-[#111611] p-3.5 border border-[#29332B] space-y-2">
                <span className="text-[10px] font-tech text-[#A6AEA5] uppercase tracking-wider font-semibold block">
                  Stage Ingestion Inputs:
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#F2F0E8]">
                  {activeStage.inputs.map((inp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#447A56] font-bold font-tech">→</span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outputs */}
              <div className="rounded-lg bg-[#111611] p-3.5 border border-[#29332B] space-y-2">
                <span className="text-[10px] font-tech text-[#A6AEA5] uppercase tracking-wider font-semibold block">
                  Architectural Artifacts / Outputs:
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#F2F0E8]">
                  {activeStage.outputs.map((out, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#E33B4F] font-bold font-tech">✓</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Engineering Method */}
              <div className="rounded-lg bg-[#111611] p-3.5 border border-[#29332B] space-y-2">
                <span className="text-[10px] font-tech text-[#447A56] uppercase tracking-wider font-semibold block">
                  Core Implementation Technique:
                </span>
                <p className="text-[11px] text-[#A6AEA5] leading-relaxed">
                  {activeStage.keyTechnique}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. DEEP TECHNICAL ANALYSIS: MODEL SELECTION CRITERIA & PREDICTION FORMULATION */}
      <div className="space-y-6">
        <div className="border-b border-[#29332B] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#447A56]" />
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#F2F0E8]">
              Model Selection Criteria & Prediction Formulation
            </h2>
          </div>
          <p className="text-xs text-[#A6AEA5] mt-1">
            Why Balanced Logistic Regression was selected over tree ensembles (XGBoost, Random Forest), and why PR-AUC was the primary metric.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card A: Why PR-AUC Over ROC-AUC */}
          <Card className="border-[#29332B] bg-[#111611]">
            <CardHeader className="pb-3 border-b border-[#29332B]/60">
              <span className="text-[10px] font-tech text-[#C82038] uppercase tracking-wider font-bold">Evaluation Rigor</span>
              <CardTitle className="text-sm font-semibold text-[#F2F0E8]">Why PR-AUC Over ROC-AUC</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-[#A6AEA5] leading-relaxed">
              <p>
                In severe class imbalance (0.69% positive repeat rate), <strong className="text-[#F2F0E8]">ROC-AUC creates a dangerous false sense of security</strong>.
              </p>
              <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B] font-mono text-[10.5px] space-y-1">
                <div className="text-[#A6AEA5]">FPR = FP / (FP + TN)</div>
                <div className="text-[#A6AEA5]">Precision = TP / (TP + FP)</div>
              </div>
              <p>
                Because True Negatives (TN = 38,892) dominate, False Positive Rate (FPR) remains deceptively near zero even with 500 false alarms. In contrast, <strong className="text-[#447A56]">PR-AUC ignores True Negatives completely</strong>, directly penalizing false positives and measuring commercial precision.
              </p>
              <div className="pt-2 border-t border-[#29332B] flex items-center justify-between text-[11px] font-tech">
                <span className="text-[#A6AEA5]">ChurnShield PR-AUC Lift:</span>
                <span className="text-[#447A56] font-bold">+3.2× Over Dummy Baseline</span>
              </div>
            </CardContent>
          </Card>

          {/* Card B: Mathematical Formulation */}
          <Card className="border-[#29332B] bg-[#111611]">
            <CardHeader className="pb-3 border-b border-[#29332B]/60">
              <span className="text-[10px] font-tech text-[#447A56] uppercase tracking-wider font-bold">Exact Math</span>
              <CardTitle className="text-sm font-semibold text-[#F2F0E8]">Mathematical Prediction Mechanics</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-[#A6AEA5] leading-relaxed">
              <p>
                The pipeline computes standard z-scores for all 21 features, sums the weighted log-odds, and applies the standard logistic sigmoid:
              </p>
              <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B] font-tech text-[10.5px] space-y-1.5">
                <div className="text-[#447A56]">z = β_0 + Σ β_i · ((x_i - μ_i) / σ_i)</div>
                <div className="text-[#F2F0E8]">P(repeat) = 1.0 / (1.0 + e^(-z))</div>
                <div className="text-[#E33B4F]">Inactivity Risk = 1.0 - P(repeat)</div>
              </div>
              <p>
                Because the equation is strictly linear in log-odds space, feature contributions are <strong className="text-[#F2F0E8]">100% mathematically exact</strong>. No black-box approximations or Monte Carlo SHAP sampling required.
              </p>
            </CardContent>
          </Card>

          {/* Card C: Why Logistic Over Trees */}
          <Card className="border-[#29332B] bg-[#111611]">
            <CardHeader className="pb-3 border-b border-[#29332B]/60">
              <span className="text-[10px] font-tech text-[#C48232] uppercase tracking-wider font-bold">Architecture Trade-off</span>
              <CardTitle className="text-sm font-semibold text-[#F2F0E8]">Why Logistic Over Tree Ensembles</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-[#A6AEA5] leading-relaxed">
              <p>
                Uncalibrated gradient-boosted trees (XGBoost, LightGBM) compress probabilities heavily near zero when trained on 99% negative data, requiring post-hoc Platt scaling or isotonic regression.
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#447A56] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F2F0E8]">Smooth Probability Spectrum:</strong> Class-weighted logistic regression yields naturally calibrated odds across all deciles.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#447A56] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F2F0E8]">0ms In-Browser Edge ML:</strong> Compact parameter size allows instant client execution without heavy Python runtimes.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Domain Reality: Inactivity vs Permanent Churn & Scientific Boundaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#447A56]" />
              <CardTitle>Non-Contractual Inactivity vs. Churn</CardTitle>
            </div>
            <CardDescription>
              Why 90-day inactivity is modeled rather than permanent abandonment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-2 text-xs text-[#A6AEA5] leading-relaxed">
            <p>
              In contractual business models (e.g. Netflix, Spotify, SaaS subscriptions), churn is explicit and
              timestamped: the user cancels their plan.
            </p>
            <p>
              In <span className="text-[#F2F0E8] font-semibold">non-contractual e-commerce</span> (such as Olist), customers
              never notify the platform that they have departed. A buyer who has not placed an order in 90 days may return
              months later, or may never return.
            </p>
            <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B] space-y-1.5 font-tech text-[11px]">
              <div className="font-semibold text-[#F2F0E8]">Operational Formulation:</div>
              <div className="text-[#447A56]">
                repeat_purchase_next_90d ∈ &#123;0, 1&#125;
              </div>
              <div className="text-[#E33B4F]">
                inactivity_risk_score = 1.0 - P(repeat_purchase_next_90d)
              </div>
            </div>
            <p className="text-[11px] text-[#A6AEA5]">
              This operational definition allows retention teams to intervene proactively while the customer still remembers
              their shopping experience, rather than waiting indefinitely.
            </p>
          </CardContent>
        </Card>

        {/* Known Limitations & Scientific Boundaries */}
        <Card className="border-[#C48232]/30 bg-[#111611]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-[#C48232]" />
              <CardTitle className="text-[#F2F0E8]">Scientific Limitations & Causal Boundaries</CardTitle>
            </div>
            <CardDescription>
              Essential considerations prior to live commercial deployment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-2 text-xs text-[#A6AEA5] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="font-tech text-[#C48232] font-bold">1.</span>
              <div>
                <span className="text-[#F2F0E8] font-medium">Extreme Base-Rate Imbalance: </span> Over 97% of Olist customers
                purchase only once. The 90-day repeat purchase rate in historical test data is only 0.69% (270 buyers out
                of 39,162).
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-tech text-[#C48232] font-bold">2.</span>
              <div>
                <span className="text-[#F2F0E8] font-medium">Correlation vs. Causation: </span> The ML model identifies
                statistical associations. It does not measure causal treatment effect or determine whether an outreach
                discount will persuade a customer who would have otherwise lapsed.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-tech text-[#C48232] font-bold">3.</span>
              <div>
                <span className="text-[#F2F0E8] font-medium">Mandatory A/B Testing: </span> Prior to allocating commercial
                budget, the retention team must run a randomized controlled trial (treatment vs holdout control group)
                to compute true incremental lift.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-tech text-[#C48232] font-bold">4.</span>
              <div>
                <span className="text-[#F2F0E8] font-medium">Balanced-Space Calibration: </span> Because the model was trained
                with inverse-frequency weighting (<code className="text-[#447A56] font-tech text-[11px]">class_weight='balanced'</code>), predicted probabilities
                are shifted to a balanced relative-risk scale (mean ~50%, Brier loss = 0.2279). They are mathematically optimal
                for decile prioritization and risk ranking, but do not represent unweighted raw posteriors.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-tech text-[#C48232] font-bold">5.</span>
              <div>
                <span className="text-[#F2F0E8] font-medium">Sparse Categorical Levels: </span> States with small transaction counts
                (e.g., Mato Grosso do Sul, MS, &lt;0.8% order share) have high parameter variance in finite training windows.
                In production, Bayesian shrinkage or hierarchical state pooling is recommended.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editorial Methodology Callout with React Bits Scroll Reveal */}
      <div className="py-2">
        <ScrollReveal
          baseOpacity={0.15}
          enableBlur={true}
          baseRotation={2}
          blurStrength={4}
          containerClassName="my-4 text-center max-w-3xl mx-auto"
          textClassName="font-serif text-lg sm:text-2xl text-[#F2F0E8] font-normal leading-relaxed tracking-wide"
        >
          Predictive modeling ranks inactivity probability; only randomized controlled trials establish true incremental lift.
        </ScrollReveal>
      </div>

      {/* 4. Interactive Business ROI Simulator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interactive Financial ROI Simulation</CardTitle>
              <CardDescription>
                Test different campaign assumptions to project financial outcomes for prioritized retention outreach
              </CardDescription>
            </div>
            <Badge variant="forest" size="sm">
              Scenario Modeling
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Outreach Cost Slider */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A6AEA5]">Outreach Cost / User</span>
                <span className="font-tech font-bold text-[#F2F0E8]">${outreachCost.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={outreachCost}
                onChange={(e) => setOutreachCost(parseFloat(e.target.value))}
                className="w-full slider-crimson accent-[#C82038] cursor-pointer"
              />
              <span className="text-[10px] text-[#A6AEA5]">e.g. Email ($1) vs SMS ($5) vs Voucher ($15)</span>
            </div>

            {/* Assumed Response Rate Slider */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A6AEA5]">Intervention Success Rate</span>
                <span className="font-tech font-bold text-[#F2F0E8]">{(conversionRate * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.005"
                value={conversionRate}
                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                className="w-full slider-crimson accent-[#C82038] cursor-pointer"
              />
              <span className="text-[10px] text-[#A6AEA5]">Benchmark retail re-order conversion</span>
            </div>

            {/* Monthly Margin Slider */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A6AEA5]">Monthly Margin ($)</span>
                <span className="font-tech font-bold text-[#F2F0E8]">${marginPerMonth.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={marginPerMonth}
                onChange={(e) => setMarginPerMonth(parseFloat(e.target.value))}
                className="w-full slider-crimson accent-[#C82038] cursor-pointer"
              />
              <span className="text-[10px] text-[#A6AEA5]">Preserved gross contribution for 3 months</span>
            </div>

            {/* Contacted Cohort Size */}
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A6AEA5]">Contact Population</span>
                <span className="font-tech font-bold text-[#F2F0E8]">{formatNumber(targetCount)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                className="w-full slider-crimson accent-[#C82038] cursor-pointer"
              />
              <span className="text-[10px] text-[#A6AEA5]">20% capacity = 7,833 customers</span>
            </div>
          </div>

          {/* Simulation Output Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="rounded-xl bg-[#111611] p-4 border border-[#29332B]">
              <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wider font-tech">Total Campaign Cost</span>
              <p className="mt-1 font-tech text-xl font-bold text-[#F2F0E8]">
                {formatCurrency(totalCampaignCost)}
              </p>
            </div>

            <div className="rounded-xl bg-[#111611] p-4 border border-[#29332B]">
              <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wider font-tech">Retained Customers</span>
              <p className="mt-1 font-tech text-xl font-bold text-[#447A56]">
                {Math.round(customersRetained)} buyers
              </p>
            </div>

            <div className="rounded-xl bg-[#111611] p-4 border border-[#29332B]">
              <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wider font-tech">Gross Margin Preserved</span>
              <p className="mt-1 font-tech text-xl font-bold text-[#447A56]">
                {formatCurrency(grossMarginSaved)}
              </p>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                netProfit >= 0
                  ? 'bg-[#102016] border-[#214D35] text-[#447A56]'
                  : 'bg-[#C82038]/10 border-[#C82038]/30 text-[#E33B4F]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-tech font-semibold uppercase tracking-wider">Net Financial Benefit</span>
                <Badge variant={netProfit >= 0 ? 'forest' : 'crimson'} size="sm">
                  {roi.toFixed(1)}% ROI
                </Badge>
              </div>
              <p className="mt-1 font-tech text-xl font-bold text-[#F2F0E8]">
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
