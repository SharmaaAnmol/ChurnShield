import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
        violet: 'bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30',
        cyan: 'bg-[#53DDE0]/15 text-[#53DDE0] border border-[#53DDE0]/30',
        mint: 'bg-[#69DDA5]/15 text-[#69DDA5] border border-[#69DDA5]/30',
        amber: 'bg-[#F5BD64]/15 text-[#F5BD64] border border-[#F5BD64]/30',
        coral: 'bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30',
        outline: 'border border-slate-700 text-slate-400 bg-transparent',
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
            'bg-slate-400': !variant || variant === 'default' || variant === 'outline',
            'bg-[#8B7CFF]': variant === 'violet',
            'bg-[#53DDE0]': variant === 'cyan',
            'bg-[#69DDA5]': variant === 'mint',
            'bg-[#F5BD64]': variant === 'amber',
            'bg-[#FB7185]': variant === 'coral',
          })}
        />
      )}
      {children}
    </div>
  );
}
