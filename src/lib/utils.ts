import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from './locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: unknown, currency: string = DEFAULT_CURRENCY) {
  const num = parseFloat(amount as string) || 0;
  return `${currency} ${num.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Relative or absolute time for order cards and lists. */
export function formatOrderTime(iso?: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  return date.toLocaleString(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sanitizeText(text: unknown) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return map[c];
  });
}

export function getStoreTheme(store: any) {
  const primary = store?.brand_color ?? store?.primary_color ?? '#383d92';
  return { primary };
}
