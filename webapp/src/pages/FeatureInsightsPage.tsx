import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Compass,
  AlertTriangle,
  Lightbulb,
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/shared/EmptyState';
import { loadFeatureImportance } from '../lib/data/data-client';
import { FeatureImportanceItem } from '../lib/data/types';

export function FeatureInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [missingFile, setMissingFile] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<FeatureImportanceItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setMissingFile(null);
    const res = await loadFeatureImportance();
    if (res.status === 'success') {
      setFeatures(res.data);
      if (res.data.length > 0) {
        setSelectedFeature(res.data[0]);
      }
    } else {
      setFeatures([]);
      setMissingFile(res.missingFile || 'feature_importance.csv');
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

  const categories = [
    { id: 'all', label: 'All Signals' },
    { id: 'order_frequency', label: 'Order Frequency' },
    { id: 'spend_behavior', label: 'Spend & Basket Size' },
    { id: 'recency_tenure', label: 'Recency & Tenure' },
    { id: 'logistics', label: 'Logistics & Sellers' },
  ];

  const filteredFeatures = useMemo(() => {
    if (activeCategory === 'all') return features;
    return features.filter((f) => f.category === activeCategory);
  }, [features, activeCategory]);

  // Chart data sorted by importanceMean descending
  const chartData = useMemo(() => {
    return [...filteredFeatures]
      .sort((a, b) => b.importanceMean - a.importanceMean)
      .slice(0, 12)
      .map((f) => ({
        name: f.feature,
        importance: f.importanceMean,
        raw: f,
      }));
  }, [filteredFeatures]);

  const isDataUnavailable = !loading && features.length === 0;

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="rounded-2xl border border-[#29332B] bg-[#111611] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="forest" size="sm">
                Permutation Importance
              </Badge>
              <Badge variant="default" size="sm">
                Holdout Evaluation
              </Badge>
            </div>
            <span className="text-[10px] font-tech uppercase tracking-[0.2em] text-[#C82038]">
              Signals & Interpretability
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-normal text-[#F2F0E8] leading-tight">
              Feature Importance & Predictive Signals
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#A6AEA5] max-w-2xl leading-relaxed">
              Calculated via permutation feature importance on the out-of-time test cohort. Identifies which behavioral
              attributes create the greatest drop in model PR-AUC when shuffled.
            </p>
          </div>

          <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B] shrink-0 text-left md:text-right">
            <span className="text-[10px] font-tech uppercase tracking-wider text-[#A6AEA5]">Total Scored Features</span>
            <p className="font-tech text-lg text-[#F2F0E8] font-bold mt-0.5">21 Features</p>
            <span className="text-xs font-tech text-[#447A56]">Zero Lookahead Leakage</span>
          </div>
        </div>
      </div>

      {isDataUnavailable ? (
        <EmptyState
          title="Feature Importance Data Not Connected"
          description="Permutation importance weights could not be loaded from feature_importance.csv or feature_importance.json. Run the notebook to compute test cohort feature rankings."
          missingFile="feature_importance.csv"
          onRetry={handleRetry}
          isRetrying={retrying}
        />
      ) : (
        <>
          {/* Category Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Tabs
              tabs={categories}
              activeTab={activeCategory}
              onChange={setActiveCategory}
            />
            <span className="text-xs text-[#A6AEA5]">
              Showing <span className="text-[#F2F0E8] font-tech">{filteredFeatures.length}</span> signals
            </span>
          </div>

          {/* Chart & Selected Feature Diagnostic Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Horizontal Bar Chart */}
            <div className="lg:col-span-7">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Permutation Importance Ranking</CardTitle>
                      <CardDescription>
                        Mean drop in PR-AUC score when feature values are randomly permuted
                      </CardDescription>
                    </div>
                    <Badge variant="forest" size="sm">
                      Top Signals
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 flex-1">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        onClick={(entry) => {
                          if (entry && entry.activePayload && entry.activePayload[0]) {
                            setSelectedFeature(entry.activePayload[0].payload.raw);
                          }
                        }}
                      >
                        <XAxis
                          type="number"
                          stroke="#4B554D"
                          fontSize={11}
                          tickFormatter={(val) => val.toFixed(4)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#A6AEA5"
                          fontSize={11}
                          width={150}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111611',
                            border: '1px solid #29332B',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#F2F0E8',
                          }}
                          formatter={(val: any) => [`${Number(val).toFixed(6)} mean PR-AUC drop`, 'Importance']}
                        />
                        <Bar
                          dataKey="importance"
                          radius={[0, 4, 4, 0]}
                          cursor="pointer"
                        >
                          {chartData.map((entry, index) => {
                            const isSelected = selectedFeature?.feature === entry.name;
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  isSelected
                                    ? '#C82038'
                                    : entry.importance > 0.003
                                    ? '#447A56'
                                    : '#214D35'
                                }
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="mt-3 text-[11px] text-[#A6AEA5] italic text-center">
                    Click on any feature bar in the chart to inspect its behavioral interpretation.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Selected Feature Deep Dive Panel */}
            <div className="lg:col-span-5">
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Behavioral Signal Interpretation</CardTitle>
                      {selectedFeature && (
                        <Badge variant="crimson" size="sm">
                          Rank #{selectedFeature.rank}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Understanding how this attribute informs customer re-engagement
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {selectedFeature ? (
                      <>
                        <div className="rounded-xl bg-[#090B09] p-4 border border-[#29332B]">
                          <span className="text-[10px] text-[#A6AEA5] uppercase tracking-wider font-tech">
                            Feature Identifier
                          </span>
                          <h4 className="mt-1 font-tech text-base font-bold text-[#F2F0E8]">
                            {selectedFeature.feature}
                          </h4>
                          <div className="mt-2 flex items-center gap-3">
                            <Badge variant="forest" size="sm">
                              Importance: {selectedFeature.importanceMean.toFixed(6)}
                            </Badge>
                            <span className="text-xs font-tech text-[#A6AEA5]">
                              σ = {selectedFeature.importanceStd.toFixed(6)}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#111611] p-4 border border-[#29332B] space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#447A56]">
                            <Lightbulb className="h-4 w-4" />
                            Behavioral Explanation
                          </div>
                          <p className="text-xs text-[#A6AEA5] leading-relaxed">
                            {selectedFeature.interpretation ||
                              'This metric measures customer purchasing frequency and commitment over the 180-day observation window.'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#111611] p-4 border border-[#29332B] space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C48232]">
                            <Compass className="h-4 w-4" />
                            Retention Team Takeaway
                          </div>
                          <p className="text-xs text-[#A6AEA5] leading-relaxed">
                            Customers exhibiting a decline in this feature should be prioritized for early re-engagement
                            before complete inactivity takes hold.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-[#A6AEA5]">
                        Select a feature from the chart to view its deep-dive details.
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Important Cautionary Banner */}
                <div className="p-5 pt-0">
                  <div className="rounded-lg bg-[#C48232]/10 border border-[#C48232]/30 p-3.5 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-[#C48232] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#A6AEA5] leading-relaxed">
                      <span className="font-semibold text-[#F2F0E8]">Predictive Association vs. Causation: </span> A high
                      importance score confirms that this signal is predictive in historical data. It does{' '}
                      <span className="underline text-[#F2F0E8]">not</span> imply that artificially manipulating this variable will
                      guarantee customer retention.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
