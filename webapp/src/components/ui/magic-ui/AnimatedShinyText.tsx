import React, { ComponentPropsWithoutRef, CSSProperties, FC } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<'p'> {
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <p
      style={
        {
          '--shimmer-width': `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        'mx-auto max-w-md text-neutral-400',
        // Shimmer effect
        'animate-shimmer bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shimmer-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
        // Shimmer gradient
        'bg-gradient-to-r from-transparent via-[#447A56] via-50% to-transparent',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};
