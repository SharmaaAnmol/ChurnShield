import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RiskBadge } from '../components/shared/RiskBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { CustomerDrawer } from '../components/shared/CustomerDrawer';
import { loadCustomerPredictions } from '../lib/data/data-client';
import { CustomerPrediction, RiskTier } from '../lib/data/types';
import { formatCurrency, formatPercent, formatNumber, truncateId } from '../lib/utils';
import { useTimeline, TIMELINE_OPTIONS } from '../lib/context/TimelineContext';

const ITEMS_PER_PAGE = 25;

export function CustomerExplorerPage() {
  const { activeTimeline, setActiveTimeline } = useTimeline();
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [customers, setCustomers] = useState<CustomerPrediction[]>([]);
  const [missingFile, setMissingFile] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskTier, setSelectedRiskTier] = useState<'all' | RiskTier>('all');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'inactivityRisk' | 'repeatProbability' | 'totalSpend' | 'recency'>('inactivityRisk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPrediction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setMissingFile(null);
    const res = await loadCustomerPredictions();
    if (res.status === 'success') {
      setCustomers(res.data);
    } else {
      setCustomers([]);
      setMissingFile(res.missingFile || 'customer_predictions.csv');
    }
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

  // Distinct states for filter dropdown
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.customerState) set.add(c.customerState);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered and sorted dataset
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => c.customerUniqueId.toLowerCase().includes(q));
    }

    if (activeTimeline !== 'all') {
      result = result.filter((c) => c.observationDate === activeTimeline);
    }

    if (selectedRiskTier !== 'all') {
      result = result.filter((c) => c.riskTier === selectedRiskTier);
    }

    if (priorityOnly) {
      result = result.filter((c) => c.priorityRetentionTarget);
    }

    if (selectedState !== 'all') {
      result = result.filter((c) => c.customerState === selectedState);
    }

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'inactivityRisk') {
        valA = a.inactivityRiskScore;
        valB = b.inactivityRiskScore;
      } else if (sortBy === 'repeatProbability') {
        valA = a.repeatPurchaseProbability;
        valB = b.repeatPurchaseProbability;
      } else if (sortBy === 'totalSpend') {
        valA = a.totalSpend || 0;
        valB = b.totalSpend || 0;
      } else if (sortBy === 'recency') {
        valA = a.recencyDays || 0;
        valB = b.recencyDays || 0;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [customers, searchQuery, activeTimeline, selectedRiskTier, priorityOnly, selectedState, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTimeline('all');
    setSelectedRiskTier('all');
    setPriorityOnly(false);
    setSelectedState('all');
    setSortBy('inactivityRisk');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleCustomerRowClick = (c: CustomerPrediction) => {
    setSelectedCustomer(c);
    setIsDrawerOpen(true);
  };

  const isDataUnavailable = !loading && customers.length === 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Customer Retention Explorer</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual empirical customer records from the selected dataset timeline. Click any customer to inspect RFM traits and retention risk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="violet" size="md">
            <Users className="h-3.5 w-3.5" />
            <span>{formatNumber(filteredCustomers.length)} Customers Found</span>
          </Badge>
        </div>
      </div>

      {isDataUnavailable ? (
        <EmptyState
          title="Customer Predictions CSV Not Connected"
          description="The Customer Explorer requires customer_predictions.csv in the public/data directory. Run the export script or notebook to populate customer-level predictions."
          missingFile="customer_predictions.csv"
          onRetry={handleRetry}
          isRetrying={retrying}
        />
      ) : (
        <Card>
          {/* Filter Bar */}
          <div className="p-4 border-b border-white/5 space-y-3 bg-[#0B1020]/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="lg:col-span-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg bg-[#11182A] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 border border-white/10 focus:border-[#8B7CFF] focus:outline-none transition-colors font-mono"
                />
              </div>

              {/* Timeline Snapshot Filter */}
              <div className="lg:col-span-3 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8B7CFF]" />
                <select
                  value={activeTimeline}
                  onChange={(e) => {
                    setActiveTimeline(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg bg-[#11182A] pl-9 pr-3 py-2 text-xs text-slate-200 border border-white/10 focus:border-[#8B7CFF] focus:outline-none transition-colors"
                >
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Timeline: {opt.quarterLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Tier Filter */}
              <div className="lg:col-span-2">
                <select
                  value={selectedRiskTier}
                  onChange={(e) => {
                    setSelectedRiskTier(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg bg-[#11182A] px-3 py-2 text-xs text-slate-200 border border-white/10 focus:border-[#8B7CFF] focus:outline-none transition-colors"
                >
                  <option value="all">All Risk Tiers</option>
                  <option value="high">High Risk (≥70%)</option>
                  <option value="moderate">Moderate (40-69%)</option>
                  <option value="low">Low Risk (&lt;40%)</option>
                </select>
              </div>

              {/* State Filter */}
              <div className="lg:col-span-2">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg bg-[#11182A] px-3 py-2 text-xs text-slate-200 border border-white/10 focus:border-[#8B7CFF] focus:outline-none transition-colors"
                >
                  <option value="all">All States</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      State: {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter Button */}
              <div className="lg:col-span-1">
                <button
                  type="button"
                  title="Filter to Top 20% highest retention priority"
                  onClick={() => {
                    setPriorityOnly(!priorityOnly);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium border transition-colors ${
                    priorityOnly
                      ? 'bg-[#8B7CFF]/20 text-[#8B7CFF] border-[#8B7CFF]/40'
                      : 'bg-[#11182A] text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>Top 20%</span>
                </button>
              </div>

              {/* Reset Filters */}
              <div className="lg:col-span-1 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full text-xs text-slate-400 hover:text-white px-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Customer Table */}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1020] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-5 py-3">Customer Unique ID</th>
                    <th
                      className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'inactivityRisk') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('inactivityRisk');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Inactivity Risk</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'repeatProbability') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('repeatProbability');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Repeat Prob (90d)</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'totalSpend') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('totalSpend');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Total Spend</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="px-5 py-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === 'recency') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('recency');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Recency</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3">Priority Action</th>
                    <th className="px-5 py-3 text-right">Inspect</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No customers match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((cust) => (
                      <tr
                        key={cust.customerUniqueId}
                        onClick={() => handleCustomerRowClick(cust)}
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
                        <td className="px-5 py-3.5 font-mono text-slate-300">
                          {cust.customerState || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {cust.priorityRetentionTarget ? (
                            <Badge variant="violet" size="sm">
                              Top 20%
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-mono">Standard</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomerRowClick(cust);
                            }}
                            className="h-7 text-xs text-slate-400 group-hover:text-white"
                          >
                            Profile
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/5 bg-[#0B1020]/40 text-xs">
                <span className="text-slate-400">
                  Showing Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                  <span className="font-semibold text-white">{totalPages}</span> ({formatNumber(filteredCustomers.length)} total)
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Slide-over Detail Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
