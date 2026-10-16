export interface CustomerHomeRecord {
  id: string; title?: string; store_id?: string; store_name?: string; status: string;
  created_at?: string; starts_at?: string; ends_at?: string; scheduled_start_at?: string;
  expires_at?: string; offer_status?: string; order_number?: number;
  total?: string | number; total_amount?: string | number; currency?: string;
}
export type CustomerHomeSource = 'orders' | 'quotes' | 'jobs' | 'bookings' | 'requests';
export interface CustomerReview {
  id: string; title: string; to: string; action: string; description: string;
  icon: 'quotes' | 'custom' | 'jobs';
}

/** Deliberately a recent-record preview, never an account-wide to-do/payment total. */
export function customerReviews(records: Partial<Record<CustomerHomeSource, CustomerHomeRecord[]>>, now = Date.now()): CustomerReview[] {
  const jobs = (records.jobs ?? []).filter(row => row.id && row.status === 'provider_completed').map(row => ({
    id: `job-${row.id}`, title: row.title || 'Service visit', to: `/account/jobs?detail=${encodeURIComponent(row.id)}`,
    action: 'Review work', description: 'The provider has finished. Check the work record before confirming.', icon: 'jobs' as const,
  }));
  const quotes = (records.quotes ?? []).filter(row => row.id && row.status === 'sent' && (!row.expires_at || (Number.isFinite(Date.parse(row.expires_at)) && Date.parse(row.expires_at) > now))).map(row => ({
    id: `quote-${row.id}`, title: row.title || 'Service estimate', to: `/account/quotes?detail=${encodeURIComponent(row.id)}`,
    action: 'Review estimate', description: 'Check the itemised price before accepting or paying.', icon: 'quotes' as const,
  }));
  const requests = (records.requests ?? []).filter(row => row.id && row.offer_status === 'offered' && !['fulfilled','cancelled','rejected'].includes(row.status)).map(row => ({
    id: `request-${row.id}`, title: row.title || 'Custom request', to: `/account/custom-orders?detail=${encodeURIComponent(row.id)}`,
    action: 'Review price', description: 'The business has sent an offer. Review the price and payment stages.', icon: 'custom' as const,
  }));
  return [...jobs, ...quotes, ...requests];
}

export function customerHomeRows(value: unknown, keys: readonly string[]): CustomerHomeRecord[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    for (const key of keys) {
      if (Object.hasOwn(value, key)) {
        const rows = (value as Record<string, unknown>)[key];
        if (Array.isArray(rows)) return rows;
        if (rows === null) return [];
      }
    }
  }
  throw new Error('Account response could not be read');
}
