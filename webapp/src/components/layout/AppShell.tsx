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
    <div className="min-h-screen bg-[#090B09] text-[#F2F0E8] font-ui flex flex-col selection:bg-[#C82038]/30 selection:text-white relative">
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle top forest glow */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#214D35]/12 via-[#102016]/8 to-transparent rounded-full blur-3xl" />
        {/* Subtle bottom-right crimson reflection */}
        <div className="absolute -bottom-[10%] right-[-10%] w-[600px] h-[400px] bg-gradient-to-t from-[#C82038]/6 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Slim Editorial Top Navigation */}
      <TopBar
        isDataConnected={isDataConnected}
        isBackendConnected={isBackendConnected}
      />

      {/* Page Content with real route-level exit/entrance transitions */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait" initial={false}>
          {currentOutlet && (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {currentOutlet}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal Editorial Footer */}
      <footer className="relative z-10 border-t border-[#29332B]/80 bg-[#090B09]/95 py-6 px-4 sm:px-8 text-xs text-[#A6AEA5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
