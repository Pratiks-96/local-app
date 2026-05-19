import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocationPath(location?: {
  name: string;
  parent?: { name: string; parent?: { name: string; parent?: { name: string } } };
} | null): string {
  if (!location) return '';
  const parts: string[] = [location.name];
  let current = location.parent;
  while (current) {
    parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(' → ');
}

export const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  BUY_SELL: 'Buy & Sell',
  LOST_FOUND: 'Lost & Found',
  EVENTS: 'Events',
  ALERTS: 'Alerts',
  JOBS: 'Jobs',
  RECOMMENDATIONS: 'Recommendations',
};
