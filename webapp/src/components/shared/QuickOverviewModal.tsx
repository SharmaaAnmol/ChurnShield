import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Layers,
  Scale,
  Cpu,
  ArrowRight,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  Compass,
  Database,
  BarChart2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface QuickOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickOverviewModal({ isOpen, onClose }: QuickOverviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Close on Escape & handle Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentSlide((prev) => Math.min(3, prev + 1));
      if (e.key === 'ArrowLeft') setCurrentSlide((prev) => Math.max(0, prev - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset slide index on open
  useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const slides = [
    {
      step: '01 / 04',
      badge: 'The Business Problem',
      title: 'The Silent Churn Dilemma & The 97% Imbalance Trap',
      subtitle: 'Why standard machine learning pipelines fail on non-contractual e-commerce data.',
      icon: AlertOctagon,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A6AEA5]">
                <span className="h-2 w-2 rounded-full bg-[#A6AEA5]" />
                <span>Contractual SaaS (Netflix, Spotify)</span>
              </div>
              <p className="text-[11.5px] text-[#A6AEA5] leading-relaxed">
                Churn is <strong className="text-[#F2F0E8]">explicit & timestamped</strong>. The customer clicks &quot;Cancel Subscription&quot;, providing a definitive ground-truth label for classifiers.
              </p>
            </div>

            <div className="rounded-xl bg-[#102016] p-4 border border-[#214D35] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#447A56]">
                <span className="h-2 w-2 rounded-full bg-[#447A56] animate-pulse" />
                <span>Non-Contractual E-Commerce (Olist, Amazon)</span>
              </div>
              <p className="text-[11.5px] text-[#A6AEA5] leading-relaxed">
                Churn is <strong className="text-[#F2F0E8]">silent & unannounced</strong>. A buyer who hasn&apos;t ordered in 90 days may return next month, or may have abandoned the brand forever.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#171D18] p-4 border border-[#C82038]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-[#C82038]" />
                <span>The 97.7% Accuracy Paradox</span>
              </span>
              <Badge variant="crimson" size="sm">Severe Class Imbalance</Badge>
            </div>
            <p className="text-xs text-[#A6AEA5] leading-relaxed">
              In our Brazilian Olist dataset of 130,000+ orders, <strong className="text-[#F2F0E8]">97.3% of buyers purchase only once</strong>. A naive dummy model that predicts <em>&quot;No customer will ever return&quot;</em> achieves <span className="text-[#E33B4F] font-tech font-bold">97.7% raw accuracy</span>, but is commercially worthless for retention teams.
            </p>
          </div>
        </div>
      ),
    },
    {
      step: '02 / 04',
      badge: 'Data & Methodology',
      title: 'Rolling-Origin Temporal Splits & 21 Leakage-Free Signals',
      subtitle: 'Constructing mathematically rigorous time horizons to prevent data leakage.',
      icon: Database,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-3 font-tech">
            <div className="text-xs text-[#F2F0E8] font-semibold flex items-center justify-between">
              <span>Rolling-Origin Temporal Window Schema</span>
              <span className="text-[10px] text-[#447A56]">ZERO TEMPORAL LEAKAGE</span>
            </div>

            {/* Visual Timeline Rail */}
            <div className="grid grid-cols-12 gap-1 text-[10px] text-center font-medium pt-1">
              <div className="col-span-8 bg-[#102016] border border-[#214D35] text-[#447A56] py-2.5 rounded-lg flex flex-col justify-center">
                <span className="font-bold">180-Day Observation Window [T - 180, T]</span>
                <span className="text-[9px] text-[#A6AEA5] font-sans">Features engineered strictly from historical behavior</span>
              </div>
              <div className="col-span-4 bg-[#C82038]/15 border border-[#C82038]/40 text-[#E33B4F] py-2.5 rounded-lg flex flex-col justify-center">
                <span className="font-bold">90-Day Outcome Horizon [T, T + 90]</span>
                <span className="text-[9px] text-[#A6AEA5] font-sans">Binary Target: y ∈ &#123;0, 1&#125;</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B]">
              <span className="text-[10px] font-tech text-[#447A56] block uppercase tracking-wider font-semibold">RFM Signals</span>
              <p className="mt-1 text-[11px] text-[#A6AEA5]">
                Recency days, Lifetime orders, Recent 90d orders, Total spend, and Account tenure.
              </p>
            </div>
            <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B]">
              <span className="text-[10px] font-tech text-[#447A56] block uppercase tracking-wider font-semibold">Ratios & Cadence</span>
              <p className="mt-1 text-[11px] text-[#A6AEA5]">
                Recent vs. earlier spend ratio, order ratio, and inter-order interval consistency.
              </p>
            </div>
            <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B]">
              <span className="text-[10px] font-tech text-[#447A56] block uppercase tracking-wider font-semibold">Logistics & Basket</span>
              <p className="mt-1 text-[11px] text-[#A6AEA5]">
                Shipping freight ratio, distinct sellers, item count, and Brazilian federative state (UF).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: '03 / 04',
      badge: 'Model Selection & Criteria',
      title: 'Why Balanced Logistic Regression Was Selected as Champion',
      subtitle: 'The empirical trade-offs between precision, recall, explainability, and edge latency.',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-1.5">
              <span className="text-[10px] font-tech text-[#447A56] font-semibold block uppercase">Criterion 1</span>
              <h4 className="text-xs font-semibold text-[#F2F0E8]">PR-AUC Over ROC-AUC</h4>
              <p className="text-[11px] text-[#A6AEA5] leading-relaxed">
                ROC-AUC is deceptive when negatives dominate (FPR stays small). PR-AUC directly tracks precision vs. recall on rare repeat buyers, achieving a <strong className="text-[#447A56]">+3.2× lift</strong> over baseline.
              </p>
            </div>

            <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-1.5">
              <span className="text-[10px] font-tech text-[#447A56] font-semibold block uppercase">Criterion 2</span>
              <h4 className="text-xs font-semibold text-[#F2F0E8]">Exact Log-Odds Attribution</h4>
              <p className="text-[11px] text-[#A6AEA5] leading-relaxed">
                Unlike black-box tree ensembles (XGBoost/LightGBM) that require approximated SHAP sampling, logistic regression decomposes into mathematically exact log-odds contributions (β_i · z_i).
              </p>
            </div>

            <div className="rounded-xl bg-[#090B09] p-3.5 border border-[#29332B] space-y-1.5">
              <span className="text-[10px] font-tech text-[#447A56] font-semibold block uppercase">Criterion 3</span>
              <h4 className="text-xs font-semibold text-[#F2F0E8]">Smooth Probability Calibration</h4>
              <p className="text-[11px] text-[#A6AEA5] leading-relaxed">
                Inverse-frequency class balancing avoids artificial probability compression, yielding continuous probabilities that translate directly into financial ROI decisions.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#111611] p-3.5 border border-[#29332B] flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#447A56] shrink-0" />
              <span className="text-[#A6AEA5]">
                <strong className="text-[#F2F0E8]">Decision Threshold (τ = 0.50):</strong> Calibrated in balanced space to maximize customer lifetime margin while penalizing unnecessary outreach discount costs.
              </span>
            </div>
            <Badge variant="forest" size="sm" className="shrink-0">Cost-Optimal</Badge>
          </div>
        </div>
      ),
    },
    {
      step: '04 / 04',
      badge: 'Systems Architecture',
      title: 'Dual-Engine Serving: Python FastAPI + Client Edge ML',
      subtitle: 'Guaranteed 0ms interactive responsiveness with 100% mathematical parity.',
      icon: Cpu,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#447A56]" />
                  <span>Python FastAPI Backend</span>
                </span>
                <span className="font-tech text-[10px] text-[#A6AEA5]">Port 8000 REST API</span>
              </div>
              <p className="text-[11.5px] text-[#A6AEA5] leading-relaxed">
                Pydantic feature schema validation, scikit-learn pipeline deserialization, health telemetry, and batch customer cohort inference.
              </p>
            </div>

            <div className="rounded-xl bg-[#102016] p-4 border border-[#214D35] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F2F0E8] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#447A56] animate-pulse" />
                  <span>In-Browser Edge ML Engine</span>
                </span>
                <span className="font-tech text-[10px] text-[#447A56]">0ms Instantaneous</span>
              </div>
              <p className="text-[11.5px] text-[#A6AEA5] leading-relaxed">
                Embeds exact weights, intercept, and standard scalers directly in TypeScript. Enables fluid timeline scrubbing without network roundtrip lag.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#171D18] p-3.5 border border-[#29332B] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#A6AEA5]">
              <Sparkles className="h-4 w-4 text-[#447A56] shrink-0" />
              <span>Ready to test the model? Scrub timeline days, test customer personas, and simulate financial ROI.</span>
            </div>
            <Link to="/prediction-studio" onClick={onClose} className="shrink-0 w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                <span>Launch Prediction Studio</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl rounded-2xl border border-[#29332B] bg-[#111611] shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overview-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#29332B] bg-[#090B09]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171D18] text-[#447A56] border border-[#29332B]">
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-tech text-xs text-[#C82038] font-bold tracking-wider">{slide.step}</span>
                <span className="text-[#29332B]">•</span>
                <Badge variant="forest" size="sm">{slide.badge}</Badge>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#171D18] transition-colors cursor-pointer"
            aria-label="Close Overview Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <h3 id="overview-modal-title" className="font-serif text-xl sm:text-2xl font-normal text-[#F2F0E8] leading-tight">
              {slide.title}
            </h3>
            <p className="text-xs text-[#A6AEA5]">
              {slide.subtitle}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="pt-2"
            >
              {slide.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#29332B] bg-[#090B09] flex items-center justify-between">
          {/* Step indicator dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === i ? 'w-6 bg-[#447A56]' : 'w-2 bg-[#29332B] hover:bg-[#A6AEA5]'
                }`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
              className={currentSlide === 0 ? 'opacity-30 pointer-events-none' : ''}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </Button>

            {currentSlide < slides.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
              >
                <span>Finish Tour</span>
                <CheckCircle2 className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
