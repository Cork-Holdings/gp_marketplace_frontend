import { recordedCount } from './recordedData.ts';

/** Aggregated server counts, never a total inferred from a paginated list. */
export function orderSummary(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const rows = Object.entries(value);
  if (rows.some(([, count]) => recordedCount(count) === undefined)) return undefined;
  return { total: rows.reduce((sum, [, count]) => sum + (count as number), 0), rows: rows.map(([status, count]) => ({ status, count: count as number, label: status.replaceAll('_', ' ').replace(/^\w/, letter => letter.toUpperCase()) })) };
}
