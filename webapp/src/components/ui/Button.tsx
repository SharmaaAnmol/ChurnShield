import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none text-sm active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#8B7CFF] text-[#080B14] hover:bg-[#9D90FF] font-semibold shadow-lg shadow-[#8B7CFF]/20',
        secondary:
          'bg-[#161F34] text-slate-200 hover:bg-[#1E293B] border border-white/5 hover:border-white/10',
        outline:
          'border border-slate-700/80 bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white',
        ghost:
          'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5',
        cyan:
          'bg-[#53DDE0] text-[#080B14] hover:bg-[#68E2E5] font-semibold shadow-lg shadow-[#53DDE0]/20',
        danger:
          'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 hover:bg-[#FB7185]/30',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
