import React from 'react';
import { Badge } from '../ui/Badge';
import { formatPercent } from '../../lib/utils';
import { RiskTier } from '../../lib/data/types';

interface RiskBadgeProps {
  tier: RiskTier | 'unknown';
  score?: number; // e.g. 0.725
  showScore?: boolean;
  size?: 'sm' | 'md';
}

export function RiskBadge({ tier, score, showScore = true, size = 'md' }: RiskBadgeProps) {
  let variant: 'coral' | 'amber' | 'mint' | 'default' = 'default';
  let label = 'Unknown';

  if (tier === 'high') {
    variant = 'coral';
    label = 'High Inactivity Risk';
  } else if (tier === 'moderate') {
    variant = 'amber';
    label = 'Moderate Risk';
  } else if (tier === 'low') {
    variant = 'mint';
    label = 'Low Inactivity Risk';
  }

  return (
    <Badge variant={variant} size={size} dot>
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono opacity-90 border-l border-current/20 pl-1.5 ml-0.5">
          {formatPercent(score)}
        </span>
      )}
    </Badge>
  );
}
