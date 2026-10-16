import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { errorMessage, userMessage, UserFacingError, isBookingTimeConflict } from '../src/lib/userMessage.ts';

// The fetch layer runs in a browser; Node's navigator has no onLine property.
Object.defineProperty(globalThis.navigator, 'onLine', { value: true, configurable: true });

const cases = [
  ['booking hold expired', /15-minute.*Choose.*new booking/],
  ['booking payment pending', /Check payment status before cancelling/],
  ['business is not approved to accept new requests', /Choose another provider/],
  ['required document upload missing: owner_id', /identity document/],
  ['required document upload missing: company_registration', /registration document/],
  ['booking schedule cannot be changed', /Contact the business/],
  ['customer balance payment is required before this step', /remaining balance.*open their request.*handing over/],
  ['customer deposit payment is required before this step', /deposit.*open their request.*start work/],
  ['customer full payment is required before this step', /agreed price.*open their request/],
  ['customer payment is required before confirming this booking', /open their booking.*pay/],
  ['customer payment is required before dispatch or work begins', /open their estimate.*pay/],
  ['pay the deposit before the balance', /Pay the deposit first/],
  ['collection already in progress', /Check payment status.*Do not start another/],
  ['collection request is pending verification; check its status before trying again: provider token=private', /Check payment status.*unconfirmed/],
  ['payment already completed', /Refresh the payment details/],
  ['customer phone required for mobile money collection', /valid mobile-money number/],
  ['selected resource is fully booked for that time', /Choose another time or provider/],
  ['appointment must be in the future', /Choose a future date/],
  ['select a service resource for an appointment', /Choose an available team member/],
  ['service is not available', /Choose another listed service/],
  ['service name, duration (15–240 minutes) and positive price are required', /15 to 240 minutes/],
  ['resource name, type and capacity (1–100) are required', /capacity from 1 to 100/],
  ['customer must accept the price before work begins', /approve the price first/],
  ['quote must be accepted before work can begin', /approve the price first/],
  ['add at least one fulfilment line before marking bulk goods ready', /Add the goods and quantities/],
  ['all bulk quantities must be fulfilled before this order is ready', /remaining quantities/],
  ['allocated lines must cover the full customer quantity before this order is ready', /remaining quantities/],
  ["fulfilment lines cannot exceed the customer's requested quantity", /Reduce them to match/],
  ['fulfilled quantity must match the selected status and cannot exceed requested quantity', /Check the fulfilled quantity/],
  ['a positive bulk quantity (up to three decimals) is required', /quantity greater than zero/],
  ['assign a provider before marking the job assigned', /Choose a team member/],
  ['assignee has no access to this store', /Update their access in Team/],
  ['record the completed work before asking the customer to confirm', /Add a work note/],
  ['explain the issue in 1–2000 characters', /Describe the problem/],
  ['work note must be 2000 characters or less', /up to 2,000 characters/],
  ['deposit and balance must equal the full quoted price', /including delivery.*Correct the amounts/],
  ['line[0] unit_price must be a non-negative amount with at most 2 decimal places', /two decimal places/],
  ['pickup cannot have a delivery fee', /Remove the fee or choose delivery/],
  ['delivery address and city are required', /street address and city/],
  ['add priced charge lines before sending an estimate', /at least one priced charge/],
  ['service quote has expired', /updated estimate/],
  ['invalid service quote status transition', /Refresh the details/],
  ['insufficient stock', /Reduce the quantity/],
  ['product unavailable', /Remove it or choose another/],
  ['Haircut must use its appointment workflow', /rather than checkout/],
  ['cart is empty', /Add an available item/],
  ['invalid email or password', /Check both/],
  ['email already registered', /Sign in with it/],
  ['password must be at least 8 characters', /at least eight/],
  ['pin locked due to too many failed attempts', /Ask your business owner/],
  ['slug already taken', /Choose another address/],
  ['sku already taken', /Choose another code/],
  ['required document upload missing', /upload it/],
  ['system roles cannot be modified', /Create a custom role/],
  ['missing required permission', /check your permissions/],
  ['resource not found', /Return to the list/],
];
for (const [raw, expected] of cases) {
  test(`actionable copy: ${raw}`, () => {
    const copy = errorMessage(`invalid input: ${raw}`, { status: 422 });
    assert.match(copy, expected);
    assert.doesNotMatch(copy, /invalid input|unit_price|line\[|token=private/);
  });
}

for (const status of [400, 401, 403, 404, 409, 413, 422, 429, 500, 502, 503]) {
  test(`safe HTTP ${status} fallback`, () => {
    const copy = errorMessage('SQLSTATE 23505: <html> postgres password=secret C:\\private\\api.go:12', { status });
    assert.doesNotMatch(copy, /SQLSTATE|postgres|password|secret|html|api.go/);
    assert.match(copy, /Check|check|Choose|choose|Sign|sign|Return|return|Wait|wait|try|Refresh|refresh|contact/);
  });
}
test('server failure cannot masquerade as a validation error', () => {
  assert.match(errorMessage('invalid price', { status: 500 }), /temporarily unavailable/);
});
test('offline recovery does not claim an action succeeded or failed', () => {
  assert.match(errorMessage('', { code: 'OFFLINE' }), /Reconnect.*check/);
});
test('payment outage and lost response never advise blind retry or claim no charge', () => {
  for (const context of [{ status: 502 }, { code: 'NETWORK_ERROR' }]) {
    const copy = errorMessage('upstream failed', { ...context, path: '/workflow-payments/reservation/123/full/collect', method: 'POST' });
    assert.match(copy, /Check payment status before trying again.*do not pay again/);
    assert.doesNotMatch(copy, /No payment|No money|try again shortly/);
  }
});
test('disabled collection explains recovery without claiming a previous attempt was uncharged', () => {
  assert.match(errorMessage('GeePay collection is not enabled for this environment', { status: 503 }), /contact the business/);
});
test('unexpected JavaScript exceptions are hidden', () => {
  assert.doesNotMatch(userMessage(new Error("Cannot read properties of undefined (reading 'token')")), /undefined|token/);
  assert.match(userMessage(new Error('private'), 'Could not save.'), /Check the latest details/);
  assert.match(userMessage(null, ''), /check the latest details/);
});
test('approved errors retain their copy; strings are not trusted automatically', () => {
  assert.equal(userMessage(new UserFacingError('Approved next step.')), 'Approved next step.');
  assert.doesNotMatch(userMessage({ message: 'secret' }), /secret/);
});

// Exercise the real fetch layer without Vite or a network request. Only its build-time env is replaced.
const source = (await readFile(new URL('../src/lib/api/crud.ts', import.meta.url), 'utf8'))
  .replace("from '../userMessage'", `from '${new URL('../src/lib/userMessage.ts', import.meta.url).href}'`)
  .replace("from '../actionFeedback'", `from '${new URL('../src/lib/actionFeedback.ts', import.meta.url).href}'`)
  .replace('import.meta.env.VITE_API_BASE_URL', "'http://example.invalid/api/v1'");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { ApiError, secureFetch } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('API error preserves status, code, details and request ID for control flow', () => {
  const details = { payment: { status: 'pending' } };
  const error = new ApiError('collection already in progress', { status: 409, code: 'COLLECTION_PENDING', details, requestId: 'test' });
  assert.equal(error.status, 409);
  assert.equal(error.code, 'COLLECTION_PENDING');
  assert.equal(error.details, details);
  assert.equal(error.requestId, 'test');
  assert.match(userMessage(error), /Check payment status/);
});
test('booking conflict retains a machine-readable recovery signal', () => {
  const error = new ApiError('invalid input: selected resource is fully booked for that time', { status: 422 });
  assert.equal(isBookingTimeConflict(error), true);
  assert.match(error.message, /Choose another time/);
});

test('database slot and hours guards return the customer to time selection', () => {
  for (const code of ['BOOKING_TIME_UNAVAILABLE', 'booking_capacity', 'booking_outside_hours', 'booking_service_unavailable']) {
    assert.equal(isBookingTimeConflict(new ApiError('This time is unavailable.', { status: 422, code })), true);
  }
  assert.equal(isBookingTimeConflict(new ApiError('Sign in again.', { status: 401, code: 'UNAUTHORIZED' })), false);
});
test('fetch response becomes friendly and does not send a second request', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ error: 'invalid input: customer balance payment is required before this step' }), { status: 422, headers: { 'content-type': 'application/json' } }); };
  try {
    await assert.rejects(secureFetch('/owner/custom-orders/123/status', { method: 'PATCH' }), error => {
      assert.match(error.message, /remaining balance.*open their request/);
      assert.equal(error.status, 422);
      return true;
    });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
test('HTML server responses are not exposed by fetch', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>private upstream stack</html>', { status: 502 });
  try {
    await assert.rejects(secureFetch('/products'), error => {
      assert.match(error.message, /temporarily unavailable/);
      assert.doesNotMatch(error.message, /html|private|stack/);
      return true;
    });
  } finally { globalThis.fetch = original; }
});
