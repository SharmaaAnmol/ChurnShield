import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { NumberTicker } from '../ui/NumberTicker';

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

  // Smart numeric parsing to power Magic UI NumberTicker
  const parsed = useMemo(() => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      const isFloat = value % 1 !== 0;
      return {
        numeric: value,
        decimalPlaces: isFloat ? (value.toString().split('.')[1]?.length || 2) : 0,
        prefix: '',
        suffix: '',
      };
    }
    const str = String(value).trim();
    // Currency: e.g. "$120.50"
    if (str.startsWith('$')) {
      const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return { numeric: num, decimalPlaces: 2, prefix: '$', suffix: '' };
      }
    }
    // Percentage: e.g. "0.82%"
    if (str.endsWith('%')) {
      const num = parseFloat(str.replace('%', ''));
      if (!isNaN(num)) {
        const dec = str.includes('.') ? (str.split('.')[1]?.replace('%', '').length || 1) : 0;
        return { numeric: num, decimalPlaces: dec, prefix: '', suffix: '%' };
      }
    }
    // Comma formatted integer or decimal: e.g. "130,914" or "0.0185"
    const cleaned = str.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(cleaned)) {
      const dec = cleaned.includes('.') ? (cleaned.split('.')[1]?.length || 0) : 0;
      return { numeric: num, decimalPlaces: dec, prefix: '', suffix: '' };
    }
    return null;
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card
        glow
        className="p-5 relative overflow-hidden group hover:border-[#447A56]/60 hover:bg-[#151C16]/95 bg-[#111611]/90 border border-[#29332B] transition-all duration-300"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-medium text-[#A6AEA5] tracking-wider uppercase font-ui">
            {label}
          </span>
          {icon && (
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 3 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#214D35]/20 text-[#447A56] border border-[#29332B] group-hover:border-[#447A56]/50 group-hover:text-[#6EB885] transition-colors"
            >
              {icon}
            </motion.div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          {isLoading ? (
            <Skeleton className="h-9 w-28 my-0.5 bg-[#171D18]" />
          ) : isUnavailable || value === null || value === undefined ? (
            <span className="text-2xl font-bold font-tech text-[#A6AEA5]/40">—</span>
          ) : parsed ? (
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F0E8] font-tech">
              <NumberTicker
                value={parsed.numeric}
                decimalPlaces={parsed.decimalPlaces}
                prefix={parsed.prefix}
                suffix={parsed.suffix}
                delay={delay + 0.05}
              />
            </span>
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
