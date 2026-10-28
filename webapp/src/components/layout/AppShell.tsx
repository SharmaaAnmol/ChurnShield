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
      {/* Micro-noise film grain texture overlay */}
      <div className="canvas-noise-overlay" aria-hidden="true" />

      {/* Ambient background lighting & fine architectural atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle top forest glow */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#214D35]/18 via-[#102016]/12 to-transparent rounded-full blur-3xl" />
        {/* Subtle bottom-right crimson aura */}
        <div className="absolute -bottom-[10%] right-[-10%] w-[700px] h-[500px] bg-gradient-to-t from-[#C82038]/12 via-[#C82038]/4 to-transparent rounded-full blur-3xl" />
        {/* Subtle left-side forest depth */}
        <div className="absolute top-[35%] -left-[10%] w-[550px] h-[550px] bg-gradient-to-r from-[#214D35]/16 via-[#214D35]/6 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Left Flank Topographic & Architectural Telemetry Frame */}
      <div className="fixed top-0 bottom-0 left-0 w-16 sm:w-24 lg:w-36 xl:w-48 2xl:w-64 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Vertical Glowing Forest Spine */}
        <div className="absolute right-2 xl:right-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#447A56]/35 to-transparent" />

        {/* Topographic Contour Lines SVG */}
        <svg className="absolute -left-10 top-1/4 w-80 h-[640px] text-[#447A56]/20" viewBox="0 0 240 640" fill="none" stroke="currentColor">
          <path d="M-20,0 C70,110 140,90 80,240 C20,390 160,450 40,640" strokeWidth="1" />
          <path d="M-10,35 C80,145 150,125 90,275 C30,425 170,485 50,640" strokeWidth="0.8" strokeDasharray="3 3" />
          <path d="M0,70 C90,180 160,160 100,310 C40,460 180,520 60,640" strokeWidth="1.2" />
          <path d="M10,105 C100,215 170,195 110,345 C50,495 190,555 70,640" strokeWidth="0.6" strokeDasharray="4 2" />
          <path d="M20,140 C110,250 180,230 120,380 C60,530 200,590 80,640" strokeWidth="0.9" />
        </svg>

        {/* Precision Architectural Ruler Ticks */}
        <div className="hidden xl:flex absolute right-2 xl:right-6 top-32 bottom-32 flex-col justify-between items-end pr-2 py-4 font-mono text-[8px] text-[#447A56]/50">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((tick) => (
            <div key={tick} className="flex items-center gap-1.5">
              <span className="opacity-70 font-semibold">{tick.toString().padStart(3, '0')}</span>
              <span className="w-2 h-[1px] bg-[#447A56]/60" />
            </div>
          ))}
        </div>

        {/* Precision Crosshair Coordinate Marks */}
        <div className="absolute right-1 xl:right-5 top-[22%] font-mono text-[10px] text-[#447A56]/50 -translate-y-1/2">+</div>
        <div className="absolute right-1 xl:right-5 top-[50%] font-mono text-[10px] text-[#447A56]/60 -translate-y-1/2">+</div>
        <div className="absolute right-1 xl:right-5 top-[78%] font-mono text-[10px] text-[#447A56]/50 -translate-y-1/2">+</div>

        {/* Vertical Editorial Telemetry Annotation (Rotated 90 deg) */}
        <div className="hidden 2xl:flex absolute left-6 top-1/2 -translate-y-1/2 origin-top-left -rotate-90 items-center gap-3 font-mono text-[9px] tracking-[0.26em] text-[#447A56]/75 uppercase whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-[#447A56] shadow-[0_0_8px_#447A56] animate-pulse" />
          <span>CHURNSHIELD // RETENTION CADENCE [LAT 23.5°S]</span>
          <span className="text-[#29332B]">//</span>
          <span>130K CURATED PROFILES</span>
        </div>
      </div>

      {/* Right Flank Topographic & Architectural Telemetry Frame */}
      <div className="fixed top-0 bottom-0 right-0 w-16 sm:w-24 lg:w-36 xl:w-48 2xl:w-64 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Vertical Glowing Crimson Spine */}
        <div className="absolute left-2 xl:left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#C82038]/35 to-transparent" />

        {/* Topographic Contour Lines SVG (Mirrored Complementary) */}
        <svg className="absolute -right-10 top-1/3 w-80 h-[640px] text-[#C82038]/18" viewBox="0 0 240 640" fill="none" stroke="currentColor">
          <path d="M260,0 C170,110 100,90 160,240 C220,390 80,450 200,640" strokeWidth="1" />
          <path d="M250,35 C160,145 90,125 150,275 C210,425 70,485 190,640" strokeWidth="0.8" strokeDasharray="3 3" />
          <path d="M240,70 C150,180 80,160 140,310 C200,460 60,520 180,640" strokeWidth="1.2" />
          <path d="M230,105 C140,215 70,195 130,345 C190,495 50,555 170,640" strokeWidth="0.6" strokeDasharray="4 2" />
          <path d="M220,140 C130,250 60,230 120,380 C180,530 40,590 160,640" strokeWidth="0.9" />
        </svg>

        {/* Precision Architectural Ruler Ticks */}
        <div className="hidden xl:flex absolute left-2 xl:left-6 top-32 bottom-32 flex-col justify-between items-start pl-2 py-4 font-mono text-[8px] text-[#C82038]/50">
          {[90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((tick) => (
            <div key={tick} className="flex items-center gap-1.5">
              <span className="w-2 h-[1px] bg-[#C82038]/60" />
              <span className="opacity-70 font-semibold">{tick.toString().padStart(3, '0')}</span>
            </div>
          ))}
        </div>

        {/* Precision Crosshair Coordinate Marks */}
        <div className="absolute left-1 xl:left-5 top-[22%] font-mono text-[10px] text-[#C82038]/50 -translate-y-1/2">+</div>
        <div className="absolute left-1 xl:left-5 top-[50%] font-mono text-[10px] text-[#C82038]/60 -translate-y-1/2">+</div>
        <div className="absolute left-1 xl:left-5 top-[78%] font-mono text-[10px] text-[#C82038]/50 -translate-y-1/2">+</div>

        {/* Vertical Editorial Telemetry Annotation (Rotated 90 deg) */}
        <div className="hidden 2xl:flex absolute right-6 top-1/2 -translate-y-1/2 origin-top-right rotate-90 items-center gap-3 font-mono text-[9px] tracking-[0.26em] text-[#C82038]/75 uppercase whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C82038] shadow-[0_0_8px_#C82038] animate-pulse" />
          <span>INFERENCE POSTURE // BALANCED LOGISTIC</span>
          <span className="text-[#29332B]">//</span>
          <span>DECISION BOUNDARY τ = 0.50</span>
        </div>
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
