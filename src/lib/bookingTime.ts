export const BOOKING_TIMEZONE = 'Africa/Lusaka';

export function bookingDate(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: BOOKING_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const part = (name: string) => parts.find(p => p.type === name)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function bookingDateLimit(): string {
  return bookingDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
}

export function bookingTime(value: string): string {
  return new Intl.DateTimeFormat('en-ZM', { timeZone: BOOKING_TIMEZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
