import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${
        disabled
          ? 'text-[#A6AEA5]'
          : 'bg-gradient-to-r from-[#A6AEA5] via-[#F2F0E8] to-[#A6AEA5] bg-[length:200%_100%] animate-shine'
      } ${className}`}
      style={{
        animationDuration,
        backgroundImage: disabled
          ? 'none'
          : 'linear-gradient(120deg, rgba(166, 174, 165, 0.6) 0%, rgba(242, 240, 232, 1) 50%, rgba(166, 174, 165, 0.6) 100%)',
      }}
    >
      {text}
    </span>
  );
}
