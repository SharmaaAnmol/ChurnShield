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
