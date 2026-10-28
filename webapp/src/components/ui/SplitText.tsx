import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitBy?: 'words' | 'characters';
  highlightWord?: string;
  highlightClass?: string;
}

export function SplitText({
  text,
  className = '',
  delay = 30,
  duration = 0.5,
  splitBy = 'characters',
  highlightWord,
  highlightClass = 'text-[#C82038]',
}: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  if (splitBy === 'words') {
    const words = text.split(' ');
    return (
      <span ref={ref} className={`inline-block ${className}`}>
        {words.map((word, i) => {
          const isHighlighted = highlightWord && word.toLowerCase().includes(highlightWord.toLowerCase());
          return (
            <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
              <motion.span
                className={`inline-block ${isHighlighted ? highlightClass : ''}`}
                initial={{ y: '105%', opacity: 0, filter: 'blur(4px)' }}
                animate={isInView ? { y: '0%', opacity: 1, filter: 'blur(0px)' } : { y: '105%', opacity: 0, filter: 'blur(4px)' }}
                transition={{
                  duration,
                  delay: (i * delay) / 1000,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {word}
              </motion.span>
            </span>
          );
        })}
      </span>
    );
  }

  // Character level split (React Bits standard)
  const chars = text.split('');
  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {chars.map((char, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0, filter: 'blur(3px)' }}
            animate={isInView ? { y: '0%', opacity: 1, filter: 'blur(0px)' } : { y: '100%', opacity: 0, filter: 'blur(3px)' }}
            transition={{
              duration: duration,
              delay: (i * delay) / 1000,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
