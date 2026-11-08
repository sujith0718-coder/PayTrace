import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export { formatCurrency } from './formatters';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

