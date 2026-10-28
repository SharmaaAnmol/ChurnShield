import React from 'react';
import { motion } from 'motion/react';

interface AnalyticalContourVisualProps {
  customerCount?: number;
  activeQuarter?: string;
  repeatRate?: string;
}

export function AnalyticalContourVisual({
  customerCount = 130914,
  activeQuarter = 'All Timelines',
  repeatRate = '0.82%',
}: AnalyticalContourVisualProps) {
  return (
    <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] rounded-2xl bg-gradient-to-br from-[#102016] via-[#111611] to-[#090B09] border border-[#29332B] overflow-hidden flex items-center justify-center group">
      {/* Ambient Radial Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(33,77,53,0.35),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(200,32,56,0.18),transparent_50%)] pointer-events-none" />

      {/* Abstract Analytical SVG Contours */}
      <svg
        className="w-full h-full absolute inset-0 object-cover opacity-80"
        viewBox="0 0 600 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="forestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#447A56" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#214D35" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="crimsonGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C82038" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#E33B4F" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#C82038" stopOpacity="0.1" />
          </linearGradient>
          <filter id="crimsonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Topographic Contours (Latent Retention Density) */}
        <motion.path
          d="M 0 350 C 120 380, 200 240, 320 280 C 440 320, 480 180, 600 200 L 600 450 L 0 450 Z"
          fill="url(#forestGrad)"
          initial={{ opacity: 0, d: "M 0 370 C 120 400, 200 260, 320 300 C 440 340, 480 200, 600 220 L 600 450 L 0 450 Z" }}
          animate={{ opacity: 1, d: "M 0 350 C 120 380, 200 240, 320 280 C 440 320, 480 180, 600 200 L 600 450 L 0 450 Z" }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />

        <path
          d="M 0 280 C 140 220, 220 320, 360 260 C 460 220, 520 140, 600 120"
          stroke="#447A56"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          strokeOpacity="0.35"
        />

        <path
          d="M 0 220 C 160 180, 240 260, 380 200 C 480 160, 540 90, 600 70"
          stroke="#447A56"
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />

        <path
          d="M 0 160 C 180 120, 260 210, 400 140 C 500 90, 550 50, 600 30"
          stroke="#447A56"
          strokeWidth="1.8"
          strokeOpacity="0.55"
        />

        {/* Primary Glowing Crimson Trajectory: Churn Risk Boundary */}
        <motion.path
          d="M 40 400 C 150 360, 220 180, 330 160 C 420 140, 490 60, 560 30"
          stroke="url(#crimsonGrad)"
          strokeWidth="3"
          fill="none"
          filter="url(#crimsonGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        {/* Dynamic Nodes along the trajectory */}
        <motion.circle
          cx="330"
          cy="160"
          r="6"
          fill="#C82038"
          stroke="#F2F0E8"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.circle
          cx="560"
          cy="30"
          r="4"
          fill="#E33B4F"
          stroke="#F2F0E8"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        />
      </svg>

      {/* Grid crosshair marks */}
      <div className="absolute top-4 left-4 text-[9px] font-tech text-[#A6AEA5]/50 flex items-center gap-2">
        <span>LATENT RISK COORDINATE: [-180d, +90d)</span>
      </div>

      <div className="absolute top-4 right-4 text-[9px] font-tech text-[#A6AEA5]/50">
        <span>MODEL: LOGISTIC REGRESSION (BALANCED)</span>
      </div>

      {/* Floating telemetry HUD card in bottom-right (inspired by preview box in reference image) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute bottom-5 right-5 p-3.5 rounded-xl bg-[#111611]/90 backdrop-blur-md border border-[#29332B] shadow-2xl max-w-[210px]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#29332B]/70 pb-1.5 mb-2">
          <span className="text-[10px] font-tech uppercase text-[#C82038] font-bold tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C82038] animate-pulse" />
            Decision Boundary
          </span>
          <span className="text-[9px] font-tech text-[#A6AEA5]">P ≥ 0.50</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-[#A6AEA5] text-[11px]">
            <span>Cohort Size:</span>
            <span className="font-tech text-[#F2F0E8] font-semibold">{customerCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-[#A6AEA5] text-[11px]">
            <span>Natural Repeat:</span>
            <span className="font-tech text-[#447A56] font-semibold">{repeatRate}</span>
          </div>
          <div className="flex justify-between items-center text-[#A6AEA5] text-[11px]">
            <span>Active Timeline:</span>
            <span className="font-tech text-[#E33B4F] font-semibold truncate max-w-[90px]">{activeQuarter}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
