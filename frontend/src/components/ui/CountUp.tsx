import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1.8,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [value, setValue] = useState<number>(from);
  const elementRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const startValue = direction === 'down' ? to : from;
    const endValue = direction === 'down' ? from : to;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp;
        const progress = Math.min((timestamp - startRef.current) / (duration * 1000), 1);
        
        // Quintic ease out for a crisp, smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = startValue + (endValue - startValue) * easeProgress;
        setValue(current);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setValue(endValue);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [to, from, direction, delay, duration]);

  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return (
    <span ref={elementRef} className={cn('font-mono tabular-nums', className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

