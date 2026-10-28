import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  onAnimationComplete?: () => void;
}

export function BlurText({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const defaultFrom =
    direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0,-20px,0)' }
      : { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0,20px,0)' };

  const defaultTo = {
    filter: 'blur(0px)',
    opacity: 1,
    transform: 'translate3d(0,0,0)',
  };

  return (
    <p className={cn('inline-block', className)}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={defaultFrom}
          animate={defaultTo}
          transition={{
            duration: 0.6,
            delay: (index * delay) / 1000,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          className="inline-block whitespace-pre"
        >
          {element}
          {animateBy === 'words' && index < elements.length - 1 && ' '}
        </motion.span>
      ))}
    </p>
  );
}
