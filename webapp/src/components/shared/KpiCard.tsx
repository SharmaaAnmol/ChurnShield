import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';

interface KpiCardProps {
  label: string;
  value: string | number | null | undefined;
  subtitle?: string;
  lift?: string;
  liftType?: 'positive' | 'neutral' | 'accent';
  icon?: React.ReactNode;
  isLoading?: boolean;
  isUnavailable?: boolean;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  subtitle,
  lift,
  liftType = 'accent',
  icon,
  isLoading = false,
  isUnavailable = false,
  delay = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card
        glow
        className="p-5 relative overflow-hidden group hover:border-[#8B7CFF]/40 hover:bg-[#131B30]/90"
      >
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            {label}
          </span>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.06] group-hover:border-[#8B7CFF]/30 group-hover:text-[#8B7CFF] transition-colors">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          {isLoading ? (
            <Skeleton className="h-9 w-28 my-0.5" />
          ) : isUnavailable || value === null || value === undefined ? (
            <span className="text-2xl font-bold font-mono text-slate-500">—</span>
          ) : (
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {value}
            </span>
          )}

          {lift && !isLoading && !isUnavailable && (
            <Badge
              variant={
                liftType === 'accent'
                  ? 'violet'
                  : liftType === 'positive'
                  ? 'mint'
                  : 'default'
              }
              size="sm"
            >
              {lift}
            </Badge>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 text-xs text-slate-400 leading-snug line-clamp-1">
            {isUnavailable ? 'Connect notebook export to view' : subtitle}
          </p>
        )}

        {/* Ambient bottom glow accent on hover */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[#8B7CFF]/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </motion.div>
  );
}
