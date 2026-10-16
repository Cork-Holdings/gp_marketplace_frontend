import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookingDate, bookingTime, BOOKING_TIMEZONE } from '../src/lib/bookingTime.ts';

test('booking dates use Lusaka rather than the browser or host timezone', () => {
  assert.equal(BOOKING_TIMEZONE, 'Africa/Lusaka');
  assert.equal(bookingDate(new Date('2026-10-08T22:30:00Z')), '2026-10-09');
  assert.equal(bookingDate(new Date('2026-10-08T21:30:00Z')), '2026-10-08');
});
test('slot labels show branch-local time', () => {
  const label = bookingTime('2026-10-09T07:00:00Z');
  assert.match(label, /9:00|09:00/);
});
