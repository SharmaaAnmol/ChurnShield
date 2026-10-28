import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors font-ui',
  {
    variants: {
      variant: {
        default: 'bg-[#171D18] text-[#A6AEA5] border border-[#29332B]',
        forest: 'bg-[#214D35]/30 text-[#6EB885] border border-[#214D35]/60',
        crimson: 'bg-[#C82038]/18 text-[#E33B4F] border border-[#C82038]/40',
        ivory: 'bg-[#F2F0E8]/10 text-[#F2F0E8] border border-[#F2F0E8]/20',
        amber: 'bg-[#C48232]/18 text-[#E5983D] border border-[#C48232]/40',
        outline: 'border border-[#29332B] text-[#A6AEA5] bg-transparent',
        // Backward-compatibility aliases
        violet: 'bg-[#214D35]/30 text-[#6EB885] border border-[#214D35]/60',
        cyan: 'bg-[#214D35]/30 text-[#6EB885] border border-[#214D35]/60',
        mint: 'bg-[#214D35]/30 text-[#6EB885] border border-[#214D35]/60',
        coral: 'bg-[#C82038]/18 text-[#E33B4F] border border-[#C82038]/40',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-[#A6AEA5]': !variant || variant === 'default' || variant === 'outline',
            'bg-[#447A56]': variant === 'forest' || variant === 'mint' || variant === 'violet' || variant === 'cyan',
            'bg-[#C82038]': variant === 'crimson' || variant === 'coral',
            'bg-[#E5983D]': variant === 'amber',
            'bg-[#F2F0E8]': variant === 'ivory',
          })}
        />
      )}
      {children}
    </div>
  );
}
