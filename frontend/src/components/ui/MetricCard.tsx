import React from 'react';
import { cn } from '../../utils/cn';
import { Card } from './Card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'gold' | 'emerald' | 'navy' | 'crimson';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'gold',
  onClick,
}) => {
  const iconBgs = {
    gold: 'bg-gold-500/10 text-gold-600 border-gold-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    navy: 'bg-navy-800/10 text-navy-800 border-navy-800/20',
    crimson: 'bg-crimson-500/10 text-crimson-600 border-crimson-500/30',
  };

  return (
    <Card 
      variant="white" 
      isInteractive={!!onClick}
      onClick={onClick}
      className="relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
              <span className={trend.isPositive ? 'text-emerald-600' : 'text-crimson-600'}>
                {trend.value}
              </span>
              <span className="text-slate-400 font-normal">vs. previous period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl border', iconBgs[variant])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

