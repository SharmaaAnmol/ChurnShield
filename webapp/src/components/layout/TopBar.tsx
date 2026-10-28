import React from 'react';
import { Menu, Calendar, Layers, Clock, ChevronDown } from 'lucide-react';
import { useTimeline, TIMELINE_OPTIONS } from '../../lib/context/TimelineContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export function TopBar({
  title,
  subtitle,
  onOpenMobileMenu,
}: TopBarProps) {
  const { activeTimeline, setActiveTimeline, currentMetrics } = useTimeline();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.07] bg-[#080B14]/85 px-4 sm:px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive Dataset Timeline Selector */}
        <div className="flex items-center gap-2 rounded-lg bg-[#11182A] px-3 py-1.5 border border-[#8B7CFF]/30 text-xs text-slate-300 shadow-sm hover:border-[#8B7CFF]/60 transition-colors">
          <Calendar className="h-3.5 w-3.5 text-[#8B7CFF]" />
          <span className="hidden sm:inline text-slate-400">Dataset Timeline:</span>
          <select
            value={activeTimeline}
            onChange={(e) => setActiveTimeline(e.target.value)}
            className="bg-transparent text-[#53DDE0] font-mono font-semibold focus:outline-none cursor-pointer text-xs"
          >
            {TIMELINE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#11182A] text-white">
                {opt.quarterLabel} ({opt.id === 'all' ? '130k' : opt.id})
              </option>
            ))}
          </select>
        </div>

        {/* Prediction Horizon Indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg bg-[#11182A] px-2.5 py-1.5 border border-white/5 text-xs text-slate-300">
          <Layers className="h-3.5 w-3.5 text-[#69DDA5]" />
          <span>Horizon:</span>
          <span className="font-mono text-white font-medium">90d Forward</span>
        </div>
      </div>
    </header>
  );
}
