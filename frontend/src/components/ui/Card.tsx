import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'ivory' | 'navy' | 'outline';
  isInteractive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'white',
  isInteractive = false,
  ...props
}) => {
  const variants = {
    white: 'bg-white text-slate-800 border-slate-200/80 shadow-sm',
    ivory: 'bg-ivory-50 text-slate-800 border-ivory-300 shadow-sm',
    navy: 'bg-navy-800 text-ivory-50 border-navy-700 shadow-md',
    outline: 'bg-transparent border-slate-300/80',
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-all duration-200',
        variants[variant],
        isInteractive && 'hover:shadow-md hover:border-gold-500/50 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

