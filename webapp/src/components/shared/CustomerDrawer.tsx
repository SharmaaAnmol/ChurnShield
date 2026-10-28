import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
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
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#090B09] border-l border-[#29332B] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#29332B] p-5 bg-[#111611]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#171D18] text-[#447A56] border border-[#29332B]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#F2F0E8] tracking-tight">Customer Snapshot</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-tech text-xs text-[#A6AEA5]">
                      {customer.customerUniqueId.slice(0, 14)}...
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="text-[#A6AEA5] hover:text-[#F2F0E8] transition-colors"
                      title="Copy full Customer ID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-[#447A56]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[#A6AEA5] hover:bg-[#171D18] hover:text-[#F2F0E8] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Primary Inactivity & Risk Card */}
              <div className="rounded-xl border border-[#29332B] bg-[#111611] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-tech uppercase tracking-widest text-[#A6AEA5]">
                    Model Risk Assessment
                  </span>
                  <RiskBadge tier={customer.riskTier} score={customer.inactivityRiskScore} />
                </div>

                {/* Score Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#A6AEA5]">Inactivity Probability</span>
                    <span className="font-tech font-semibold text-[#F2F0E8]">
                      {formatPercent(customer.inactivityRiskScore)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#171D18] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        customer.riskTier === 'high'
                          ? 'bg-[#C82038]'
                          : customer.riskTier === 'moderate'
                          ? 'bg-[#C48232]'
                          : 'bg-[#447A56]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, customer.inactivityRiskScore * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[#29332B]">
                  <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B]">
                    <span className="text-[11px] text-[#A6AEA5]">Repeat Purchase Prob</span>
                    <p className="mt-1 font-tech text-base font-semibold text-[#447A56]">
                      {formatPercent(customer.repeatPurchaseProbability, 2)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#090B09] p-3 border border-[#29332B]">
                    <span className="text-[11px] text-[#A6AEA5]">Retention Priority</span>
                    <div className="mt-1">
                      {customer.priorityRetentionTarget ? (
                        <Badge variant="crimson" size="sm">
                          Top 20% Action Tier
                        </Badge>
                      ) : (
                        <span className="text-xs font-tech text-[#A6AEA5]">Standard Tier</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Retention Action */}
              <div className="rounded-xl border border-[#214D35] bg-[#102016]/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#447A56]">
                  <Sparkles className="h-4 w-4" />
                  Recommended Retention Playbook
                </div>
                <p className="mt-1.5 text-xs text-[#A6AEA5] leading-relaxed">
                  {customer.priorityRetentionTarget
                    ? 'Deploy targeted win-back outreach within 7 days. Customer is in the top 20% inactivity decile with proven past purchasing history.'
                    : customer.inactivityRiskScore >= 0.7
                    ? 'Automated low-cost email re-engagement or educational push notification to avoid exhausting retention budget.'
                    : 'Customer demonstrates above-baseline natural re-order propensity. Maintain regular loyalty communications.'}
                </p>
              </div>

              {/* Historical Behavioral Snapshot */}
              <div>
                <h4 className="text-[10px] font-tech uppercase tracking-widest text-[#A6AEA5] mb-3">
                  Historical Behavioral Snapshot (180-Day Window)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B]">
                    <div className="flex items-center gap-1.5 text-xs text-[#A6AEA5]">
                      <ShoppingBag className="h-3.5 w-3.5 text-[#447A56]" />
                      Total Orders
                    </div>
                    <p className="mt-1.5 font-tech text-sm font-semibold text-[#F2F0E8]">
                      {customer.orderCount !== undefined ? formatNumber(customer.orderCount) : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B]">
                    <div className="flex items-center gap-1.5 text-xs text-[#A6AEA5]">
                      <span className="text-[#447A56] font-tech text-xs">$</span>
                      Total Spend
                    </div>
                    <p className="mt-1.5 font-tech text-sm font-semibold text-[#F2F0E8]">
                      {customer.totalSpend !== undefined ? formatCurrency(customer.totalSpend) : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B]">
                    <div className="flex items-center gap-1.5 text-xs text-[#A6AEA5]">
                      <Clock className="h-3.5 w-3.5 text-[#C48232]" />
                      Recency
                    </div>
                    <p className="mt-1.5 font-tech text-sm font-semibold text-[#F2F0E8]">
                      {customer.recencyDays !== undefined ? `${Math.round(customer.recencyDays)} days` : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B]">
                    <div className="flex items-center gap-1.5 text-xs text-[#A6AEA5]">
                      <MapPin className="h-3.5 w-3.5 text-[#447A56]" />
                      State
                    </div>
                    <p className="mt-1.5 font-tech text-sm font-semibold text-[#F2F0E8]">
                      {customer.customerState || '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B]">
                    <div className="flex items-center gap-1.5 text-xs text-[#A6AEA5]">
                      <Calendar className="h-3.5 w-3.5 text-[#A6AEA5]" />
                      Account Tenure
                    </div>
                    <p className="mt-1.5 font-tech text-sm font-semibold text-[#F2F0E8]">
                      {customer.tenureDays !== undefined ? `${Math.round(customer.tenureDays)} days` : '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#111611] p-3 border border-[#29332B]">
                    <div className="flex items-center gap-1.5 text-xs text-[#A6AEA5]">
                      <TrendingUp className="h-3.5 w-3.5 text-[#A6AEA5]" />
                      Recent 90d Orders
                    </div>
                    <p className="mt-1.5 font-tech text-sm font-semibold text-[#F2F0E8]">
                      {customer.ordersRecent90d !== undefined ? formatNumber(customer.ordersRecent90d) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Science Footnote */}
              <div className="rounded-lg border border-[#29332B] bg-[#090B09] p-3 text-[11px] text-[#A6AEA5] leading-normal flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-[#A6AEA5] shrink-0 mt-0.5" />
                <span>
                  Observation Timeline: <span className="font-tech text-[#F2F0E8]">{customer.observationDate || 'Custom Snapshot'}</span>.
                  Scored via Balanced Logistic Regression champion pipeline.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#29332B] p-4 bg-[#111611] flex justify-end">
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
