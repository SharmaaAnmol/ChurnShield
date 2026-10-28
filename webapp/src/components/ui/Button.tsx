import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none text-sm font-ui active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#C82038] text-[#F2F0E8] hover:bg-[#E33B4F] font-semibold shadow-lg shadow-[#C82038]/25 border border-[#E33B4F]/30',
        forest:
          'bg-[#214D35] text-[#F2F0E8] hover:bg-[#2C6647] font-medium shadow-md shadow-[#214D35]/30 border border-[#447A56]/40',
        secondary:
          'bg-[#171D18] text-[#F2F0E8] hover:bg-[#212B22] border border-[#29332B] hover:border-[#3A4A3D]',
        outline:
          'border border-[#29332B] bg-transparent text-[#A6AEA5] hover:bg-[#111611] hover:text-[#F2F0E8] hover:border-[#3A4A3D]',
        ghost:
          'bg-transparent text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#171D18]',
        danger:
          'bg-[#C82038]/20 text-[#E33B4F] border border-[#C82038]/40 hover:bg-[#C82038]/30',
        pill:
          'rounded-full border border-[#29332B] bg-[#111611]/90 hover:bg-[#171D18] hover:border-[#3A4A3D] text-[#F2F0E8] px-5 py-2 tracking-wide text-xs uppercase',
        // Backward-compat aliases
        cyan:
          'bg-[#214D35] text-[#F2F0E8] hover:bg-[#2C6647] font-medium shadow-md shadow-[#214D35]/30 border border-[#447A56]/40',
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
