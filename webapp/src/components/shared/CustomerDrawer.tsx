import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  DollarSign,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CustomerPrediction } from '../../lib/data/types';
import { RiskBadge } from './RiskBadge';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils';

interface CustomerDrawerProps {
  customer: CustomerPrediction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerDrawer({ customer, isOpen, onClose }: CustomerDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!customer) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(customer.customerUniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#0B1020] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#11182A]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/25">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Customer Snapshot</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-slate-400">
                      {customer.customerUniqueId.slice(0, 12)}...
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy full Customer ID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-[#69DDA5]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Primary Inactivity & Risk Card */}
              <div className="rounded-xl border border-white/10 bg-[#11182A] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Model Risk Assessment
                  </span>
                  <RiskBadge tier={customer.riskTier} score={customer.inactivityRiskScore} />
                </div>

                {/* Score Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Inactivity Probability</span>
                    <span className="font-mono font-semibold text-white">
                      {formatPercent(customer.inactivityRiskScore)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        customer.riskTier === 'high'
                          ? 'bg-[#FB7185]'
                          : customer.riskTier === 'moderate'
                          ? 'bg-[#F5BD64]'
                          : 'bg-[#69DDA5]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, customer.inactivityRiskScore * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                  <div className="rounded-lg bg-[#080B14]/60 p-3 border border-white/5">
                    <span className="text-[11px] text-slate-400">Repeat Purchase Prob</span>
                    <p className="mt-1 font-mono text-base font-semibold text-[#53DDE0]">
                      {formatPercent(customer.repeatPurchaseProbability, 2)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#080B14]/60 p-3 border border-white/5">
                    <span className="text-[11px] text-slate-400">Retention Priority</span>
                    <div className="mt-1">
                      {customer.priorityRetentionTarget ? (
                        <Badge variant="violet" size="sm">
                          Top 20% Action Tier
                        </Badge>
                      ) : (
                        <span className="text-xs font-mono text-slate-400">Standard Tier</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Retention Action */}
              <div className="rounded-xl border border-[#8B7CFF]/20 bg-[#8B7CFF]/5 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8B7CFF]">
                  <Sparkles className="h-4 w-4" />
                  Recommended Retention Playbook
                </div>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  {customer.priorityRetentionTarget
                    ? 'Deploy targeted win-back coupon within 7 days. Customer is in top 20% inactivity decile with proven past purchasing history.'
                    : customer.inactivityRiskScore >= 0.7
                    ? 'Automated low-cost email re-engagement or educational push notifications to avoid exhausting retention budget.'
                    : 'Customer demonstrates above-baseline natural re-order propensity. Maintain regular loyalty communications.'}
                </p>
              </div>

              {/* Historical Behavioral Snapshot */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Historical Behavioral Snapshot (180-Day Window)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[#11182A] p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ShoppingBag className="h-3.5 w-3.5 text-[#8B7CFF]" />
                      Total Orders
                    </div>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                      {customer.orderCount !== undefined ? formatNumber(customer.orderCount) : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#11182A] p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <DollarSign className="h-3.5 w-3.5 text-[#53DDE0]" />
                      Total Spend
                    </div>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                      {customer.totalSpend !== undefined ? formatCurrency(customer.totalSpend) : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#11182A] p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-[#F5BD64]" />
                      Recency
                    </div>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                      {customer.recencyDays !== undefined ? `${Math.round(customer.recencyDays)} days` : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#11182A] p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-[#69DDA5]" />
                      State
                    </div>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                      {customer.customerState || '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#11182A] p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Account Tenure
                    </div>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                      {customer.tenureDays !== undefined ? `${Math.round(customer.tenureDays)} days` : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#11182A] p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                      Recent 90d Orders
                    </div>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                      {customer.ordersRecent90d !== undefined ? formatNumber(customer.ordersRecent90d) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Science Footnote */}
              <div className="rounded-lg border border-white/5 bg-[#080B14]/80 p-3 text-[11px] text-slate-400 leading-normal flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Observation Timeline: <span className="font-mono text-slate-300">{customer.observationDate || 'Custom Snapshot'}</span>.
                  Scored via Balanced Logistic Regression champion pipeline.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 bg-[#11182A] flex justify-end">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
