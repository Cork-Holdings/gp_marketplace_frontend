import test from 'node:test';
import assert from 'node:assert/strict';
import { orderActionBlock, jobActionBlock } from '../src/lib/workflowPrerequisites.ts';
const paid = { first_confirmed: true, balance_confirmed: true };
const order = { accepted: true, checking: false, readiness: paid, target: 'in_production', wholesale: false, bulkReady: true };
test('order actions require verified payment and quantities', () => {
  assert.equal(orderActionBlock(order), null);
  for (const change of [{ accepted: false }, { checking: true }, { readiness: null }, { readiness: { first_confirmed: false, balance_confirmed: false } }, { readiness: { first_confirmed: true, balance_confirmed: false }, target: 'fulfilled' }, { wholesale: true, bulkReady: false, target: 'ready' }]) assert.ok(orderActionBlock({ ...order, ...change }));
  assert.equal(orderActionBlock({ ...order, readiness: { first_confirmed: true, balance_confirmed: false } }), null);
});
test('job progress requires assignment, payment and evidence for review', () => {
  const job = { checking: false, readiness: paid, assigned: true, needsEvidence: true, hasEvidence: true };
  assert.equal(jobActionBlock(job), null);
  for (const change of [{ assigned: false }, { checking: true }, { readiness: null }, { readiness: { first_confirmed: false, balance_confirmed: false } }, { hasEvidence: false }]) assert.ok(jobActionBlock({ ...job, ...change }));
});
