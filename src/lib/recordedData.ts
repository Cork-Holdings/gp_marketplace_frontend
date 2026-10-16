/** Missing, malformed and non-finite values are unknown, not a zero payment. */
export function recordedNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value.trim())) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function recordedCurrency(value: unknown, currency: unknown): string {
  const number = recordedNumber(value);
  if (number === undefined || typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Unavailable';
  return `${currency} ${number.toLocaleString('en-ZM', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function recordedCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}
