import React from 'react';
import { cn } from '../../utils/cn';
import { DiscrepancyType, InvestigationStatus } from '../../types/api';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 
    | 'matched' 
    | 'mismatch' 
    | 'missing' 
    | 'duplicate' 
    | 'review' 
    | 'resolved' 
    | 'reopened' 
    | 'neutral' 
    | 'gold';
  status?: DiscrepancyType | InvestigationStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  className,
}) => {
  // Map domain status strings to visual variants if variant is omitted
  let resolvedVariant = variant;
  if (!resolvedVariant && status) {
    switch (status) {
      case 'MATCHED':
      case 'RESOLVED':
      case 'COMPLETED':
      case 'CAPTURED':
        resolvedVariant = 'matched';
        break;
      case 'AMOUNT_MISMATCH':
        resolvedVariant = 'mismatch';
        break;
      case 'MISSING_PAYMENT':
      case 'MISSING_SETTLEMENT':
      case 'FAILED':
        resolvedVariant = 'missing';
        break;
      case 'DUPLICATE_TRANSACTION':
      case 'DUPLICATE':
        resolvedVariant = 'duplicate';
        break;
      case 'UNDER_REVIEW':
      case 'PENDING':
        resolvedVariant = 'review';
        break;
      case 'REOPENED':
        resolvedVariant = 'reopened';
        break;
      default:
        resolvedVariant = 'neutral';
    }
  }

  const variants = {
    matched: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    mismatch: 'bg-crimson-50 text-crimson-700 border-crimson-200/80',
    missing: 'bg-crimson-50 text-crimson-700 border-crimson-200/80',
    duplicate: 'bg-lavender-50 text-lavender-700 border-lavender-200/80',
    review: 'bg-amber-50 text-amber-700 border-amber-200/80',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    reopened: 'bg-crimson-50 text-crimson-700 border-crimson-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    gold: 'bg-gold-50 text-gold-700 border-gold-300',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
  };

  const displayLabel = children || (status ? status.replace(/_/g, ' ') : '');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border select-none uppercase tracking-wider',
        variants[resolvedVariant || 'neutral'],
        sizes[size],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {displayLabel}
    </span>
  );
};

