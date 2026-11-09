import assert from 'node:assert/strict';
import test from 'node:test';
import { jobAccess } from '../src/lib/jobAccess.ts';

test('owners and managers can supervise jobs without being the assigned provider', () => {
  assert.deepEqual(jobAccess({ canManage: true, canUpdate: true, actorId: 'owner', assignedTo: 'staff', status: 'assigned' }), { manage: true, progress: true, recordNote: true });
});
test('assigned staff wait for dispatch and cannot reassign or dispatch themselves', () => {
  assert.deepEqual(jobAccess({ canManage: false, canUpdate: true, actorId: 'staff', assignedTo: 'staff', status: 'assigned' }), { manage: false, progress: false, recordNote: false });
});
test('assigned providers can record arrival, work and completion after dispatch', () => {
  for (const status of ['dispatched', 'arrived', 'in_progress']) assert.deepEqual(jobAccess({ canManage: false, canUpdate: true, actorId: 'staff', assignedTo: 'staff', status }), { manage: false, progress: true, recordNote: true });
});
test('other staff, viewers and unresolved identities cannot act on the job', () => {
  for (const change of [{ actorId: 'other' }, { canUpdate: false }, { actorId: undefined }, { assignedTo: null }, { status: 'disputed' }, { status: 'customer_confirmed' }]) assert.deepEqual(jobAccess({ canManage: false, canUpdate: true, actorId: 'staff', assignedTo: 'staff', status: 'in_progress', ...change }), { manage: false, progress: false, recordNote: false });
});
