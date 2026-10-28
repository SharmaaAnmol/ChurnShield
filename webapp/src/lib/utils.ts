import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number safely as percentage (e.g. 0.6723 -> "67.2%")
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number with commas (e.g. 130914 -> "130,914")
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format currency in Brazilian Real (R$) or generic currency
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format float with fixed decimal places (e.g. 0.7681 -> "0.768")
 */
export function formatDecimal(value: number | null | undefined, decimals = 3): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toFixed(decimals);
}

/**
 * Truncate long IDs with ellipsis (e.g. 8d50f521f5... -> 8d50f5...c43e)
 */
export function truncateId(id: string | null | undefined, start = 8, end = 6): string {
  if (!id) return '—';
  if (id.length <= start + end) return id;
  return `${id.slice(0, start)}...${id.slice(-end)}`;
}

/**
 * Categorize risk score into low, moderate, high tier
 */
export function getRiskTier(inactivityRisk: number | null | undefined): 'high' | 'moderate' | 'low' | 'unknown' {
  if (inactivityRisk === null || inactivityRisk === undefined || isNaN(inactivityRisk)) return 'unknown';
  if (inactivityRisk >= 0.70) return 'high';
  if (inactivityRisk >= 0.40) return 'moderate';
  return 'low';
}
