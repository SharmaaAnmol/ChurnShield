import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TimelineMetrics {
  timelineId: string;
  label: string;
  quarterLabel: string;
  totalCustomersEvaluated: number;
  actualRepeatPurchasers: number;
  actualInactiveCustomers: number;
  baseRepeatPurchaseRate: number;
  baseInactivityRate: number;
  prAuc: number;
  rocAuc: number;
  recall: number;
  balancedAccuracy: number;
  prAucLiftOverDummy: number;
  recommendedContactCount: number;
  riskDistribution: {
    highRisk: number;
    moderateRisk: number;
    lowRisk: number;
  };
  confusionMatrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
}

export interface TimelineOption {
  id: string;
  label: string;
  quarterLabel: string;
  customerCount: number;
}

export const TIMELINE_OPTIONS: TimelineOption[] = [
  { id: '2018-06-01', label: '2018-06-01', quarterLabel: 'Q2 2018 [Held-Out Test]', customerCount: 39162 },
  { id: '2018-03-01', label: '2018-03-01', quarterLabel: 'Q1 2018 [Validation Cohort]', customerCount: 34777 },
  { id: '2017-12-01', label: '2017-12-01', quarterLabel: 'Q4 2017 [In-Sample Training]', customerCount: 26682 },
  { id: '2017-09-01', label: '2017-09-01', quarterLabel: 'Q3 2017 [In-Sample Training]', customerCount: 19338 },
  { id: '2017-06-01', label: '2017-06-01', quarterLabel: 'Q2 2017 [In-Sample Training]', customerCount: 10955 },
  { id: 'all', label: 'All Timelines', quarterLabel: '5 Snapshots Cumulative', customerCount: 130914 },
];

interface TimelineContextType {
  activeTimeline: string;
  setActiveTimeline: (id: string) => void;
  timelineMetrics: Record<string, TimelineMetrics>;
  currentMetrics: TimelineMetrics | null;
  isLoading: boolean;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [activeTimeline, setActiveTimeline] = useState<string>('2018-06-01');
  const [timelineMetrics, setTimelineMetrics] = useState<Record<string, TimelineMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch('/data/timeline_metrics.json');
        if (res.ok) {
          const data = await res.json();
          setTimelineMetrics(data);
        }
      } catch (err) {
        console.warn('Failed to load timeline_metrics.json', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const currentMetrics = timelineMetrics[activeTimeline] || null;

  return (
    <TimelineContext.Provider
      value={{
        activeTimeline,
        setActiveTimeline,
        timelineMetrics,
        currentMetrics,
        isLoading,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
