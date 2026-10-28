import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
  className = '',
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 45,
    stiffness: 90,
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === 'down' ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        const formatted = Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(latest);
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [springValue, decimalPlaces, prefix, suffix]);

  const initialFormatted = Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(direction === 'down' ? value : 0);

  return (
    <span
      ref={ref}
      className={`inline-block tabular-nums font-tech ${className}`}
    >
      {prefix}{initialFormatted}{suffix}
    </span>
  );
}
