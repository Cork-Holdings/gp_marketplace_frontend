import test from 'node:test';
import assert from 'node:assert/strict';
import { groupPortalNavigation } from '../src/lib/portalNavigation.ts';

const paths = ['','/stores','/store-settings','/products','/counter','/orders','/quotes','/jobs','/bookings','/custom-orders','/transactions','/team','/roles'];
const links = paths.map(path => ({ to: `/portal/owner${path}`, count: 6 }));

test('merchant links have ordered work, money, setup and access groups', () => {
  const result = groupPortalNavigation(links);
  assert.deepEqual(result.map(group => group.label), [null, 'Daily work', 'Money', 'Business setup', 'Team & access']);
  assert.equal(result.flatMap(group => group.items).length, links.length);
  assert.equal(new Set(result.flatMap(group => group.items.map(item => item.to))).size, links.length);
});

test('grouping preserves link objects, badges and order within groups', () => {
  const result = groupPortalNavigation(links);
  const work = result.find(group => group.id === 'daily-work');
  assert.deepEqual(work.items.map(item => item.to), paths.slice(4,10).map(path => `/portal/owner${path}`));
  for (const item of result.flatMap(group => group.items)) {
    assert.ok(links.includes(item));
    assert.equal(item.count, 6);
  }
});

test('permissions cannot be bypassed and empty groups are omitted', () => {
  const permitted = links.filter(item => item.to === '/portal/owner/orders');
  assert.deepEqual(groupPortalNavigation(permitted), [{ id: 'daily-work', label: 'Daily work', items: permitted }]);
  assert.deepEqual(groupPortalNavigation([]), []);
});

test('restaurant kitchen belongs to daily work, menu and tables to setup', () => {
  const food = ['/menu', '/tables', '/kitchen'].map(path => ({to: `/portal/owner${path}`}));
  const result = groupPortalNavigation(food);
  assert.deepEqual(result.map(group => [group.id, group.items.map(item => item.to)]), [
    ['daily-work', ['/portal/owner/kitchen']],
    ['business-setup', ['/portal/owner/menu', '/portal/owner/tables']],
  ]);
});

test('admin and future unfamiliar routes remain visible without invented labels', () => {
  const admin = [{ to: '/portal/admin' }, { to: '/portal/admin/settlements' }];
  assert.deepEqual(groupPortalNavigation(admin), [{id: 'ungrouped', label: null, items: admin}]);
  const future = {to: '/portal/owner/new-feature'};
  assert.equal(groupPortalNavigation([...links, future]).flatMap(group => group.items).filter(item => item === future).length, 1);
});

test('mobile overflow uses the same groups and does not restore primary tabs', () => {
  const primary = new Set(['/portal/owner', '/portal/owner/counter', '/portal/owner/products', '/portal/owner/orders']);
  const overflow = links.filter(item => !primary.has(item.to));
  const result = groupPortalNavigation(overflow);
  assert.deepEqual(result.map(group => group.label), ['Daily work', 'Money', 'Business setup', 'Team & access']);
  assert.deepEqual(new Set(result.flatMap(group => group.items)), new Set(overflow));
});
