import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';
import { soundService } from '../../services/soundService';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary-gold' | 'secondary-navy' | 'outline-gold' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  playSfx?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary-gold',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  onClick,
  playSfx = true,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playSfx && !disabled && !isLoading) {
      soundService.playClick();
    }
    onClick?.(e);
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    'primary-gold': 'bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold shadow-sm hover:shadow-gold-glow focus:ring-gold-500',
    'secondary-navy': 'bg-navy-800 hover:bg-navy-700 text-ivory-50 border border-navy-700 shadow-sm focus:ring-navy-600',
    'outline-gold': 'border border-gold-500 text-gold-500 hover:bg-gold-500/10 focus:ring-gold-500',
    'ghost': 'text-slate-600 hover:text-navy-900 hover:bg-slate-200/50 focus:ring-slate-400',
    'danger': 'bg-crimson-500 hover:bg-crimson-600 text-white shadow-sm focus:ring-crimson-400',
    'success': 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm focus:ring-emerald-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};

