import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  isDataConnected?: boolean;
  isBackendConnected?: boolean;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Customer Intelligence & Retention Posture',
    subtitle: 'Predicting 90-day repeat purchase probability and customer inactivity risk',
  },
  '/prediction-studio': {
    title: 'Prediction Studio & Counterfactual Inference',
    subtitle: 'Real-time Scikit-Learn pipeline inference on new, unseen customer behavioral records',
  },
  '/customers': {
    title: 'Customer Retention Explorer',
    subtitle: 'Individual inactivity risk scores, repeat purchase probabilities, and priority outreach tiers',
  },
  '/model': {
    title: 'Model Performance & Validation',
    subtitle: 'Retrospective out-of-time evaluation metrics, lift over baseline, and confusion matrix',
  },
  '/features': {
    title: 'Feature Importance & Signals',
    subtitle: 'Permutation importance ranking on holdout test cohort with behavioral interpretations',
  },
  '/methodology': {
    title: 'Methodology & Business ROI',
    subtitle: 'Temporal rolling-origin design, causal validation boundaries, and financial scenario simulation',
  },
};

export function AppShell({ isDataConnected = false, isBackendConnected = false }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: 'ChurnShield Intelligence',
    subtitle: 'Customer Inactivity Prediction Platform',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080B14] text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          isDataConnected={isDataConnected}
          isBackendConnected={isBackendConnected}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar
              isDataConnected={isDataConnected}
              isBackendConnected={isBackendConnected}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
