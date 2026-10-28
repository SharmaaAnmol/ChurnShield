import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Layers,
  Menu,
  X,
  Github,
  Zap,
  Activity,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useTimeline, TIMELINE_OPTIONS } from '../../lib/context/TimelineContext';

interface TopBarProps {
  isDataConnected?: boolean;
  isBackendConnected?: boolean;
}

export function TopBar({ isDataConnected = true, isBackendConnected = true }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeTimeline, setActiveTimeline } = useTimeline();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/prediction-studio', label: 'Prediction Studio', liveBadge: true },
    { to: '/customers', label: 'Customer Explorer' },
    { to: '/model', label: 'Model Performance' },
    { to: '/features', label: 'Feature Signals' },
    { to: '/methodology', label: 'Methodology' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#29332B] bg-[#090B09]/95 backdrop-blur-2xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      {/* Subtle top illuminated gradient hairline */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#447A56]/60 via-[#C82038]/70 to-transparent" />

      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand identity — Distinctive, Regal & Eye-Catching */}
        <div className="flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-3.5 group">
            {/* Bespoke Geometric Shield Crest */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#171D18] via-[#111611] to-[#090B09] border border-[#29332B] text-[#F2F0E8] shadow-[0_0_20px_rgba(200,32,56,0.18)] group-hover:border-[#C82038]/70 group-hover:shadow-[0_0_25px_rgba(200,32,56,0.35)] transition-all duration-300">
              {/* Architectural shield glyph */}
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-[#E33B4F] transition-transform duration-300 group-hover:scale-105"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="text-[#C82038]" />
                <path d="M12 8v8" stroke="#447A56" strokeWidth="2.5" />
                <path d="M8 12h8" stroke="#447A56" strokeWidth="2.5" />
              </svg>
              {/* Subtle active telemetry ping */}
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#C82038] animate-ping opacity-75" />
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#C82038] border-2 border-[#090B09]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl sm:text-[28px] tracking-[0.16em] uppercase font-semibold leading-none">
                  <span className="text-[#F2F0E8] group-hover:text-white transition-colors">CHURN</span>
                  <span className="text-[#E33B4F] drop-shadow-[0_0_12px_rgba(200,32,56,0.4)]">SHIELD</span>
                </span>
              </div>
              <p className="hidden sm:block text-[10px] font-tech uppercase tracking-[0.24em] text-[#A6AEA5] mt-1">
                Retention Intelligence
              </p>
            </div>
          </NavLink>
        </div>

        {/* Center: Spacious Editorial Navigation */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
          {navLinks.map((link) => {
            const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 text-xs font-ui tracking-[0.14em] uppercase transition-all duration-200 rounded-lg ${
                  isActive
                    ? 'bg-[#171D18] text-[#F2F0E8] font-semibold border border-[#29332B] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.5)]'
                    : 'text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#111611]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.liveBadge && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E33B4F] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C82038]" />
                    </span>
                  )}
                  <span>{link.label}</span>
                </span>
                {isActive && (
                  <motion.div
                    layoutId="editorial-nav-underline"
                    className="absolute -bottom-[21px] left-3 right-3 h-[2.5px] rounded-full bg-[#C82038] shadow-[0_0_10px_#C82038]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Controls: Timeline & Telemetry */}
        <div className="flex items-center gap-3">
          {/* Timeline Selector Dropdown */}
          <div className="flex items-center gap-2 rounded-xl bg-[#111611] px-3.5 py-1.5 border border-[#29332B] text-xs text-[#A6AEA5] hover:border-[#447A56]/60 transition-colors shadow-sm">
            <Calendar className="h-4 w-4 text-[#447A56]" />
            <select
              value={activeTimeline}
              onChange={(e) => setActiveTimeline(e.target.value)}
              className="bg-transparent text-[#F2F0E8] font-tech font-medium focus:outline-none cursor-pointer text-xs"
              aria-label="Dataset Timeline"
            >
              {TIMELINE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#111611] text-[#F2F0E8]">
                  {opt.quarterLabel.replace(' Snapshot', '')} ({opt.id === 'all' ? '130k' : opt.id})
                </option>
              ))}
            </select>
          </div>

          {/* Backend Status indicator */}
          <div
            title={isBackendConnected ? 'FastAPI Model Inference Live' : 'Backend in Offline Fallback'}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-[#111611] px-3 py-1.5 border border-[#29332B] text-xs font-tech text-[#A6AEA5]"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-[#447A56] shadow-[0_0_10px_#447A56]' : 'bg-[#C48232]'
              }`}
            />
            <span>{isBackendConnected ? 'Live API' : 'Fallback'}</span>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/SharmaaAnmol/ChurnShield"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            className="hidden md:flex items-center justify-center h-9 w-9 rounded-xl bg-[#111611] border border-[#29332B] text-[#A6AEA5] hover:text-[#F2F0E8] hover:border-[#447A56]/60 transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#111611] border border-[#29332B]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden border-b border-[#29332B] bg-[#090B09]/98 px-6 py-6 overflow-hidden"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between text-sm uppercase tracking-wider font-ui py-2 border-b border-[#29332B]/40 ${
                      isActive ? 'text-[#C82038] font-bold' : 'text-[#A6AEA5]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.liveBadge && (
                      <span className="text-[10px] font-tech text-[#C82038] bg-[#C82038]/15 px-2 py-0.5 rounded-full border border-[#C82038]/30">
                        Live ML
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-[#29332B] flex items-center justify-between text-xs text-[#A6AEA5]">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isBackendConnected ? 'bg-[#447A56]' : 'bg-[#C48232]'}`} />
                <span>FastAPI Inference: {isBackendConnected ? 'Online' : 'Offline'}</span>
              </div>
              <a
                href="https://github.com/SharmaaAnmol/ChurnShield"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#F2F0E8] hover:underline font-tech"
              >
                <Github className="h-3.5 w-3.5" />
                <span>Repo</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
