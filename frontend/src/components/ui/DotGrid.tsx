import React from 'react';
import { cn } from '../../utils/cn';

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  dotColor?: string;
  fade?: boolean;
  className?: string;
}

export const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 1.5,
  gap = 24,
  dotColor = 'rgba(214, 182, 108, 0.15)', // Subtle gold dots
  fade = true,
  className = '',
}) => {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={{
        backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        maskImage: fade
          ? 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
          : undefined,
      }}
    />
  );
};
