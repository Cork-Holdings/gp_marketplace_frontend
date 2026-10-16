import test from 'node:test';
import assert from 'node:assert/strict';
import { customerNavigation, customerSectionTitle, isCustomerSectionActive } from '../src/lib/customerNavigation.ts';
import { customerHomeRows, customerReviews } from '../src/lib/customerHome.ts';

test('customer groups retain all six existing routes and add only Home', () => {
  assert.deepEqual(customerNavigation.map(group => group.label), [null,'Shopping & requests','Bookings & services','Payments & receipts']);
  const routes = customerNavigation.flatMap(group => group.items.map(item => item.to));
  assert.equal(routes.length,7);
  assert.equal(new Set(routes).size,7);
  assert.equal(routes[0],'/account');
});

test('Home matches exactly, not every child route', () => {
  assert.equal(isCustomerSectionActive('/account','/account'),true);
  assert.equal(isCustomerSectionActive('/account/','/account'),true);
  assert.equal(isCustomerSectionActive('/account/ledger','/account'),false);
  assert.equal(isCustomerSectionActive('/account/jobs-fake','/account/jobs'),false);
});

test('order details and settlement links highlight the correct section', () => {
  assert.equal(customerSectionTitle('/account/orders/abc'),'Orders');
  assert.equal(customerSectionTitle('/account/transactions/abc'),'Payments');
  assert.equal(customerSectionTitle('/account/settlements'),'Payments');
  assert.equal(customerSectionTitle('/account/quotes'),'Estimates');
});

test('valid array, alternate history envelope and null empty lists decode', () => {
  const rows = [{id:'a',status:'completed'}];
  assert.equal(customerHomeRows(rows,['orders']),rows);
  assert.equal(customerHomeRows({history:rows},['orders','history']),rows);
  assert.deepEqual(customerHomeRows({reservations:null},['reservations']),[]);
});

test('malformed or missing response is an error, not a false empty state', () => {
  assert.throws(() => customerHomeRows({error:'private diagnostics'},['orders']));
  assert.throws(() => customerHomeRows(undefined,['orders']));
});

test('only submitted work, current sent estimates and offered prices need review', () => {
  const now = Date.parse('2026-10-07T00:00:00Z');
  const reviews = customerReviews({
    jobs:[{id:'j',status:'provider_completed'},{id:'completed',status:'customer_confirmed'}],
    quotes:[{id:'q',status:'sent',expires_at:'2026-10-08T00:00:00Z'},{id:'paid-or-not',status:'accepted'},{id:'old',status:'sent',expires_at:'2026-10-06T00:00:00Z'},{id:'bad-date',status:'sent',expires_at:'not a date'}],
    requests:[{id:'r',status:'pending',offer_status:'offered'},{id:'cancelled',status:'cancelled',offer_status:'offered'},{id:'fulfilled',status:'fulfilled',offer_status:'offered'},{id:'waiting',status:'pending',offer_status:'unpriced'}],
  },now);
  assert.deepEqual(reviews.map(item => item.id),['job-j','quote-q','request-r']);
  assert.deepEqual(reviews.map(item => item.action),['Review work','Review estimate','Review price']);
});

test('accepted prices do not invent a payment debt or success', () => {
  assert.deepEqual(customerReviews({quotes:[{id:'q',status:'accepted'}],requests:[{id:'r',status:'pending',offer_status:'accepted'}]}),[]);
});

test('empty and partial data remain usable without fabricated items', () => {
  assert.deepEqual(customerReviews({}),[]);
  const result = customerReviews({jobs:[{id:'work',status:'provider_completed'}]});
  assert.equal(result.length,1);
  assert.equal(result[0].title,'Service visit');
});

test('review links encode IDs and use only the correct customer workflow', () => {
  const result = customerReviews({quotes:[{id:'id&request=1',status:'sent'}]});
  assert.equal(result[0].to,'/account/quotes?detail=id%26request%3D1');
});
