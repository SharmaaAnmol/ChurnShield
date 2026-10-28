import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Award,
  BarChart3,
  BookOpen,
  Github,
  Shield,
  Zap,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isDataConnected?: boolean;
  isBackendConnected?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  isDataConnected = false,
  isBackendConnected = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Retention KPIs & Risk Posture',
    },
    {
      to: '/prediction-studio',
      label: 'Prediction Studio',
      icon: Zap,
      description: 'Interactive Live Inference',
      badge: 'Live ML',
    },
    {
      to: '/customers',
      label: 'Customer Explorer',
      icon: Users,
      description: 'Scored Customer Population',
    },
    {
      to: '/model',
      label: 'Model Performance',
      icon: Award,
      description: 'Validation, Lift & Confusion Matrix',
    },
    {
      to: '/features',
      label: 'Feature Importance',
      icon: BarChart3,
      description: 'Permutation Weights & Signals',
    },
    {
      to: '/methodology',
      label: 'Methodology & ROI',
      icon: BookOpen,
      description: 'Causal Limits & Scenario Modeling',
    },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.07] bg-[#0B1020]/95 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B7CFF] to-[#6351EB] text-[#080B14] shadow-lg shadow-[#8B7CFF]/25">
          <Shield className="h-5 w-5 fill-[#080B14] text-[#080B14]" />
          <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse pointer-events-none" />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-base">ChurnShield</span>
            <span className="rounded bg-[#8B7CFF]/20 px-1 py-0.2 text-[9px] font-mono font-medium text-[#8B7CFF]">
              ML
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">Retention Intelligence</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Analytics Engine
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#161F34] text-white font-semibold shadow-sm border border-white/[0.08]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Left active accent bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#8B7CFF] shadow-[0_0_8px_#8B7CFF]" />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#8B7CFF]' : 'text-slate-400 group-hover:text-slate-300'
                    )}
                  />
                  <div className="flex-1 truncate flex items-center justify-between">
                    <div>{item.label}</div>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#8B7CFF]/20 text-[#8B7CFF] border border-[#8B7CFF]/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Status / Footer */}
      <div className="p-4 border-t border-white/[0.06] space-y-2.5 bg-[#080B14]/40">
        {/* Inference API Status Pill */}
        <div className="flex items-center justify-between rounded-lg bg-[#11182A] px-3 py-1.5 border border-white/5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isBackendConnected ? 'bg-[#69DDA5] shadow-[0_0_6px_#69DDA5]' : 'bg-[#F5BD64]'
              )}
            />
            <span className="text-[11px] text-slate-300 font-medium">FastAPI Service</span>
          </div>

          <Badge variant={isBackendConnected ? 'mint' : 'amber'} size="sm">
            {isBackendConnected ? 'Port 8000' : 'Offline'}
          </Badge>
        </div>

        {/* Data Status Pill */}
        <div className="flex items-center justify-between rounded-lg bg-[#11182A] px-3 py-1.5 border border-white/5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isDataConnected ? 'bg-[#69DDA5]' : 'bg-[#F5BD64]'
              )}
            />
            <span className="text-[11px] text-slate-300 font-medium">Platform Data</span>
          </div>

          <Badge variant={isDataConnected ? 'mint' : 'amber'} size="sm">
            {isDataConnected ? 'Ready' : 'Offline'}
          </Badge>
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/SharmaaAnmol/ChurnShield"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors border border-white/5"
        >
          <Github className="h-3.5 w-3.5" />
          <span>SharmaaAnmol/ChurnShield</span>
        </a>
      </div>
    </aside>
  );
}
