import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WORKFLOW_VIEW, WORKFLOW_VIEWS, isWorkflowView, workflowViewKey, readWorkflowView, saveWorkflowView, workflowDate, workflowGroup } from '../src/lib/workflowView.ts';

const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('four selectable views with expandable table as the default', () => {
  assert.equal(WORKFLOW_VIEWS.length, 4);
  assert.equal(DEFAULT_WORKFLOW_VIEW, 'expandable_table');
  for (const option of WORKFLOW_VIEWS) assert.ok(isWorkflowView(option.value));
  for (const value of [null, {}, 'card_grid', '<script>']) assert.equal(isWorkflowView(value), false);
});

test('preferences are versioned, shared across lists, and isolated between accounts', () => {
  const store = storage();
  assert.equal(workflowViewKey('client-a'), 'geepay:workflow-view:v1:client-a');
  assert.equal(readWorkflowView('client-a', store), DEFAULT_WORKFLOW_VIEW);
  assert.equal(saveWorkflowView('client-a', 'business_ledger', store), true);
  assert.equal(readWorkflowView('client-a', store), 'business_ledger');
  assert.equal(readWorkflowView('client-b', store), DEFAULT_WORKFLOW_VIEW);
  saveWorkflowView('client-b', 'table_detail', store);
  assert.equal(readWorkflowView('client-a', store), 'business_ledger');
  assert.equal(readWorkflowView('client-b', store), 'table_detail');
});

test('invalid storage and missing identity safely use the default', () => {
  const store = storage();
  store.setItem(workflowViewKey('invalid'), 'unsupported');
  assert.equal(readWorkflowView('invalid', store), DEFAULT_WORKFLOW_VIEW);
  assert.equal(saveWorkflowView('invalid', 'unsupported', store), false);
  assert.equal(workflowViewKey(null), null);
  assert.equal(saveWorkflowView(null, 'action_queue', store), false);
  assert.equal(readWorkflowView(null, store), DEFAULT_WORKFLOW_VIEW);
});

test('blocked and quota-limited storage do not prevent changing views', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readWorkflowView('blocked', blocked), DEFAULT_WORKFLOW_VIEW);
  assert.equal(saveWorkflowView('blocked', 'action_queue', blocked), true);
  assert.equal(readWorkflowView('blocked', blocked), 'action_queue');
  const quota = { getItem: () => 'expandable_table', setItem() { throw Error('quota'); } };
  saveWorkflowView('quota', 'table_detail', quota);
  assert.equal(readWorkflowView('quota', quota), 'table_detail');
});

test('queue grouping never interprets an accepted price as confirmed payment', () => {
  assert.equal(workflowGroup('accepted'), 'ongoing');
  assert.equal(workflowGroup('sent', true), 'attention');
  assert.equal(workflowGroup('provider_completed'), 'attention');
  assert.equal(workflowGroup('disputed'), 'attention');
  assert.equal(workflowGroup('dispatched'), 'ongoing');
  for (const status of ['fulfilled', 'cancelled', 'expired', 'customer_confirmed']) {
    assert.equal(workflowGroup(status, true), 'history');
  }
});

test('dates display actual values and do not invent missing dates', () => {
  assert.equal(workflowDate(), 'Not provided');
  assert.equal(workflowDate('bad date'), 'Not provided');
  assert.notEqual(workflowDate('2026-10-09T10:00:00+02:00'), 'Not provided');
  assert.ok(workflowDate('2026-10-09T10:00:00+02:00', true).length > workflowDate('2026-10-09T10:00:00+02:00').length);
});
