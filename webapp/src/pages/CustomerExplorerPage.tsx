import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#29332B]">
        <div>
          <span className="text-[10px] font-tech uppercase tracking-[0.2em] text-[#C82038]">
            Cohort Micro-Analysis
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F2F0E8] mt-1">
            Customer Retention Explorer
          </h1>
          <p className="text-xs text-[#A6AEA5] mt-1 max-w-2xl">
            Individual empirical customer records from the selected dataset timeline. Click any customer to inspect RFM traits and retention risk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="forest" size="md">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span className="font-tech">{formatNumber(filteredCustomers.length)}</span> Customers Filtered
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
        <Card className="overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-[#29332B] space-y-3 bg-[#111611]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="lg:col-span-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A6AEA5]" />
                <input
                  type="text"
                  placeholder="Search customer ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md bg-[#171D18] pl-9 pr-3 py-2 text-xs text-[#F2F0E8] placeholder-[#A6AEA5]/50 border border-[#29332B] focus:border-[#447A56] focus:outline-none transition-colors font-tech"
                />
              </div>

              {/* Timeline Snapshot Filter */}
              <div className="lg:col-span-3 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#447A56]" />
                <select
                  value={activeTimeline}
                  onChange={(e) => {
                    setActiveTimeline(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md bg-[#171D18] pl-9 pr-3 py-2 text-xs text-[#F2F0E8] border border-[#29332B] focus:border-[#447A56] focus:outline-none transition-colors cursor-pointer"
                >
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#111611] text-[#F2F0E8]">
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
                  className="w-full rounded-md bg-[#171D18] px-3 py-2 text-xs text-[#F2F0E8] border border-[#29332B] focus:border-[#447A56] focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="all" className="bg-[#111611] text-[#F2F0E8]">All Risk Tiers</option>
                  <option value="high" className="bg-[#111611] text-[#F2F0E8]">High Risk (≥70%)</option>
                  <option value="moderate" className="bg-[#111611] text-[#F2F0E8]">Moderate (40-69%)</option>
                  <option value="low" className="bg-[#111611] text-[#F2F0E8]">Low Risk (&lt;40%)</option>
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
                  className="w-full rounded-md bg-[#171D18] px-3 py-2 text-xs text-[#F2F0E8] border border-[#29332B] focus:border-[#447A56] focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="all" className="bg-[#111611] text-[#F2F0E8]">All States</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st} className="bg-[#111611] text-[#F2F0E8]">
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
                  className={`w-full flex items-center justify-center rounded-md px-2 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                    priorityOnly
                      ? 'bg-[#214D35] text-[#F2F0E8] border-[#447A56]'
                      : 'bg-[#171D18] text-[#A6AEA5] border-[#29332B] hover:border-[#447A56]/60 hover:text-[#F2F0E8]'
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
                  className="w-full text-xs text-[#A6AEA5] hover:text-[#F2F0E8] px-2"
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
                <thead className="bg-[#090B09] text-[#A6AEA5] uppercase text-[10px] tracking-wider border-b border-[#29332B]">
                  <tr>
                    <th className="px-5 py-3">Customer Unique ID</th>
                    <th
                      className="px-5 py-3 cursor-pointer hover:text-[#F2F0E8] transition-colors"
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
                      className="px-5 py-3 cursor-pointer hover:text-[#F2F0E8] transition-colors"
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
                      className="px-5 py-3 cursor-pointer hover:text-[#F2F0E8] transition-colors"
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
                      className="px-5 py-3 cursor-pointer hover:text-[#F2F0E8] transition-colors"
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

                <tbody className="divide-y divide-[#29332B]">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#A6AEA5]">
                        No customers match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((cust) => (
                      <tr
                        key={cust.customerUniqueId}
                        onClick={() => handleCustomerRowClick(cust)}
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
                        <td className="px-5 py-3.5 font-tech text-[#A6AEA5]">
                          {cust.customerState || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {cust.priorityRetentionTarget ? (
                            <Badge variant="crimson" size="sm">
                              Top 20%
                            </Badge>
                          ) : (
                            <span className="text-[#A6AEA5] text-[11px] font-tech">Standard</span>
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
                            className="h-7 text-xs text-[#A6AEA5] group-hover:text-[#F2F0E8]"
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
              <div className="flex items-center justify-between p-4 border-t border-[#29332B] bg-[#090B09] text-xs">
                <span className="text-[#A6AEA5]">
                  Showing Page <span className="font-tech font-semibold text-[#F2F0E8]">{currentPage}</span> of{' '}
                  <span className="font-tech font-semibold text-[#F2F0E8]">{totalPages}</span> ({formatNumber(filteredCustomers.length)} total)
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span>Previous</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
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
