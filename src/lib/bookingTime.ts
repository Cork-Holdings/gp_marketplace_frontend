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

export function visitWindow(start?:string,end?:string):string {
  if (!start) return 'Time to be arranged';
  const date = new Intl.DateTimeFormat('en-ZM',{timeZone:BOOKING_TIMEZONE,weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(start));
  return `${date} · ${bookingTime(start)}${end ? `–${bookingTime(end)}` : ''} (Zambia time)`;
}

// datetime-local is a wall clock, not the device timezone. Zambia has no DST.
export function zambiaDateTime(value:string):string {
  return value ? new Date(`${value}:00+02:00`).toISOString() : '';
}

export function visitInput(value?:string):string {
  return value ? `${bookingDate(new Date(value))}T${new Intl.DateTimeFormat('en-GB',{timeZone:BOOKING_TIMEZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value))}` : '';
}
