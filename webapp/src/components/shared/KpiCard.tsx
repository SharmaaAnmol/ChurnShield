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
  liftType?: 'positive' | 'neutral' | 'accent' | 'danger';
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
  let badgeVariant: 'forest' | 'crimson' | 'amber' | 'default' = 'forest';
  if (liftType === 'danger') badgeVariant = 'crimson';
  else if (liftType === 'neutral') badgeVariant = 'default';
  else if (liftType === 'accent') badgeVariant = 'forest';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card
        glow
        className="p-5 relative overflow-hidden group hover:border-[#3A4A3D] hover:bg-[#151C16]/90 bg-[#111611]/90 border border-[#29332B]"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-medium text-[#A6AEA5] tracking-wider uppercase font-ui">
            {label}
          </span>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#214D35]/15 text-[#447A56] border border-[#29332B] group-hover:border-[#447A56]/40 group-hover:text-[#6EB885] transition-colors">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          {isLoading ? (
            <Skeleton className="h-9 w-28 my-0.5 bg-[#171D18]" />
          ) : isUnavailable || value === null || value === undefined ? (
            <span className="text-2xl font-bold font-tech text-[#A6AEA5]/40">—</span>
          ) : (
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F0E8] font-tech">
              {value}
            </span>
          )}

          {lift && !isLoading && !isUnavailable && (
            <Badge variant={badgeVariant} size="sm">
              {lift}
            </Badge>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 text-xs text-[#A6AEA5]/75 leading-relaxed font-ui">
            {subtitle}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
