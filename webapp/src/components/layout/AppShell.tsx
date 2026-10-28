import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './TopBar';

interface AppShellProps {
  isDataConnected?: boolean;
  isBackendConnected?: boolean;
}

export function AppShell({ isDataConnected = true, isBackendConnected = true }: AppShellProps) {
  const location = useLocation();
  const currentOutlet = useOutlet();

  return (
    <div className="min-h-screen bg-canvas-texture text-[#F2F0E8] font-ui flex flex-col selection:bg-[#C82038]/30 selection:text-white relative overflow-x-hidden">
      {/* Ambient background lighting & fine architectural atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle top forest glow */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#214D35]/14 via-[#102016]/10 to-transparent rounded-full blur-3xl" />
        {/* Subtle bottom-right crimson aura */}
        <div className="absolute -bottom-[10%] right-[-10%] w-[700px] h-[500px] bg-gradient-to-t from-[#C82038]/8 via-[#C82038]/3 to-transparent rounded-full blur-3xl" />
        {/* Subtle left-side forest depth */}
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-gradient-to-r from-[#214D35]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Flank Architectural Side Rails — Elegant edge telemetry on widescreen displays */}
      <aside
        aria-hidden="true"
        className="fixed left-3 top-24 bottom-12 hidden 2xl:flex flex-col justify-between pointer-events-none z-20 text-[9px] font-tech text-[#A6AEA5]/40 select-none border-l border-[#29332B]/40 pl-2.5"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#447A56]/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#447A56] animate-pulse" />
            <span className="font-semibold tracking-wider">SYS.MONITOR // 01</span>
          </div>
          <div className="text-[8px] text-[#A6AEA5]/30 tracking-widest font-mono">
            LAT: -23.5505 S
          </div>
        </div>

        <div className="transform -rotate-90 origin-left translate-y-24 translate-x-1 tracking-[0.25em] uppercase text-[8px] text-[#A6AEA5]/25 whitespace-nowrap">
          LATAM_BR // NON-CONTRACTUAL RETENTION MATRIX
        </div>

        <div className="space-y-1 font-mono text-[8px] text-[#A6AEA5]/30">
          <div>COHORT: 130K</div>
          <div className="text-[#447A56]/50">PR-AUC: 0.0117</div>
        </div>
      </aside>

      <aside
        aria-hidden="true"
        className="fixed right-3 top-24 bottom-12 hidden 2xl:flex flex-col justify-between items-end pointer-events-none z-20 text-[9px] font-tech text-[#A6AEA5]/40 select-none border-r border-[#29332B]/40 pr-2.5"
      >
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-1.5 text-[#E33B4F]/70 justify-end">
            <span className="font-semibold tracking-wider">ML.CORE // ACTIVE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C82038] animate-ping" />
          </div>
          <div className="text-[8px] text-[#A6AEA5]/30 tracking-widest font-mono">
            LONG: -46.6333 W
          </div>
        </div>

        <div className="transform rotate-90 origin-right translate-y-[-24px] -translate-x-1 tracking-[0.25em] uppercase text-[8px] text-[#A6AEA5]/25 whitespace-nowrap">
          LOOKBACK: 180D • HORIZON: 90D • DECISION: 0.50
        </div>

        <div className="space-y-1 font-mono text-[8px] text-[#A6AEA5]/30 text-right">
          <div>LIFT: +120%</div>
          <div className="text-[#C82038]/50">BALANCED_LOGISTIC</div>
        </div>
      </aside>

      {/* Slim Editorial Top Navigation */}
      <TopBar
        isDataConnected={isDataConnected}
        isBackendConnected={isBackendConnected}
      />

      {/* Page Content with real route-level exit/entrance transitions */}
      <main className="relative z-10 flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12 py-8 md:py-12">
        <AnimatePresence mode="wait" initial={false}>
          {currentOutlet && (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {currentOutlet}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal Editorial Footer */}
      <footer className="relative z-10 border-t border-[#29332B]/80 bg-[#090B09]/95 py-6 px-4 sm:px-8 lg:px-12 text-xs text-[#A6AEA5]">
        <div className="max-w-[1520px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-serif text-sm font-semibold tracking-wider text-[#F2F0E8]">CHURNSHIELD</span>
            <span className="text-[#29332B] font-mono">/</span>
            <span className="font-ui text-[11px] text-[#A6AEA5]">Non-Contractual E-Commerce Retention Intelligence</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-tech text-[#A6AEA5]">
            <span>130,914 Curated Records</span>
            <span className="text-[#29332B]">•</span>
            <span>Balanced Logistic Regression</span>
            <span className="text-[#29332B]">•</span>
            <a
              href="https://github.com/SharmaaAnmol/ChurnShield"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F2F0E8] hover:text-[#C82038] transition-colors"
            >
              GitHub Portfolio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
