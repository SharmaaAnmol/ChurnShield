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
    <header className="sticky top-0 z-40 w-full border-b border-[#29332B] bg-[#090B09]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#111611] border border-[#29332B] text-[#F2F0E8] shadow-sm group-hover:border-[#C82038]/50 transition-colors">
              <span className="font-editorial text-base font-bold text-[#C82038]">C</span>
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#C82038] animate-ping" />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#C82038]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-editorial text-lg tracking-[0.15em] font-semibold text-[#F2F0E8] uppercase">
                  ChurnShield
                </span>
                <span className="rounded bg-[#C82038]/15 px-1 py-0.2 text-[8px] font-tech text-[#E33B4F] border border-[#C82038]/30">
                  ML
                </span>
              </div>
              <p className="hidden sm:block text-[9px] font-ui uppercase tracking-[0.2em] text-[#A6AEA5]">
                Retention Intelligence
              </p>
            </div>
          </NavLink>
        </div>

        {/* Center: Slim Editorial Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`relative px-3 py-1.5 text-xs font-ui tracking-wider uppercase transition-colors ${
                  isActive ? 'text-[#F2F0E8] font-semibold' : 'text-[#A6AEA5] hover:text-[#F2F0E8]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {link.label}
                  {link.liveBadge && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C82038] animate-pulse" />
                  )}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="editorial-nav-underline"
                    className="absolute -bottom-[19px] left-2 right-2 h-[2px] bg-[#C82038]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Controls: Timeline & Status */}
        <div className="flex items-center gap-3">
          {/* Timeline Selector Dropdown */}
          <div className="flex items-center gap-2 rounded-full bg-[#111611] px-3 py-1 border border-[#29332B] text-xs text-[#A6AEA5] hover:border-[#3A4A3D] transition-colors shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-[#447A56]" />
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
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#111611] px-2.5 py-1 border border-[#29332B] text-[11px] font-tech text-[#A6AEA5]"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-[#447A56] shadow-[0_0_8px_#447A56]' : 'bg-[#C48232]'
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
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-[#111611] border border-[#29332B] text-[#A6AEA5] hover:text-[#F2F0E8] hover:border-[#3A4A3D] transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
          </a>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#111611] border border-[#29332B]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
