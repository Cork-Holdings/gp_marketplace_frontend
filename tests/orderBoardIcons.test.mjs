import test from 'node:test';
import assert from 'node:assert/strict';
import { orderLaneIcon } from '../src/lib/orderBoardIcons.ts';

test('incoming and unpaid lanes have distinct semantic icons', () => {
  assert.equal(orderLaneIcon('incoming'), 'inbox');
  assert.equal(orderLaneIcon('pending_payment'), 'creditCard');
});
test('goods, service and food work use appropriate stage icons', () => {
  assert.equal(orderLaneIcon('packaged'), 'package');
  assert.equal(orderLaneIcon('scheduled'), 'calendar');
  assert.equal(orderLaneIcon('active'), 'tools');
  assert.equal(orderLaneIcon('preparing'), 'clock');
});
test('transport and terminal stages are not confused', () => {
  assert.equal(orderLaneIcon('delivery'), 'truck');
  assert.equal(orderLaneIcon('out'), 'truck');
  assert.equal(orderLaneIcon('done'), 'checkCircle');
  assert.equal(orderLaneIcon('cancelled'), 'closeCircle');
});
test('unknown lanes use a neutral icon, not a success symbol', () => {
  assert.equal(orderLaneIcon('new-stage'), 'package');
});
