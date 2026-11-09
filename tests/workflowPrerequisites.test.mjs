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

test('missing work notes explain the exact next step without suggesting another payment', () => {
  const job = { checking: false, readiness: paid, assigned: true, needsEvidence: true, hasEvidence: false };
  assert.equal(jobActionBlock(job), 'Payment is confirmed. A work note is still required. Describe the completed work below and click “Record note”, then submit for customer confirmation.');
  assert.equal(jobActionBlock({...job, hasEvidence:true}), null);
  for(const change of [{checking:true},{readiness:null},{readiness:{first_confirmed:false,balance_confirmed:false}}]) {
    assert.doesNotMatch(jobActionBlock({...job,...change}), /Payment is confirmed|does not need to pay again/);
  }
});
