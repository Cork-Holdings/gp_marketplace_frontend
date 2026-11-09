import test from 'node:test';
import assert from 'node:assert/strict';
import { businessModules, modulesForRole, moduleForPath, modulePath, plannedFeature, moduleAccess } from '../src/lib/erpModules.ts';
import { ownerReferenceMenu, adminReferenceMenu, groupReferenceMenu } from '../src/lib/referenceNavigation.ts';

test('every existing working route and placeholder belongs to exactly one role-specific module', () => {
  for (const [role, menu] of [['owner', ownerReferenceMenu], ['admin', adminReferenceMenu]]) {
    const grouped = groupReferenceMenu(menu);
    const members = grouped.flatMap(group => group.items);
    assert.deepEqual(new Set(members), new Set(menu));
    assert.equal(members.length, menu.length);
    for (const item of menu.filter(item => item.to !== `/portal/${role}`)) {
      const module = moduleForPath(item.to);
      assert.ok(module, item.to);
      assert.equal(modulesForRole(role).filter(candidate => candidate[role].paths.includes(item.to) || candidate[role].planned.some(feature => item.to === `/portal/${role}/coming-soon/${feature.id}`)).length, 1, item.to);
      if (item.comingSoon) assert.ok(plannedFeature(role, item.to.split('/').at(-1)), item.to);
    }
  }
});

test('scope, future feature identities and direct module URLs stay distinct', () => {
  assert.ok(!businessModules.some(module => /custom-erp|membership/.test(module.id)));
  assert.equal(moduleForPath('/portal/owner/custom-orders').id, 'sales');
  assert.equal(moduleForPath('/portal/admin/coming-soon/revenue').id, 'finance');
  assert.equal(moduleForPath('/portal/owner/coming-soon/hr').id, 'people');
  assert.equal(moduleForPath('/portal/owner/modules/finance').id, 'finance');
  assert.equal(moduleForPath('/portal/admin/plans/new').id,'administration');
  assert.equal(moduleForPath('/portal/admin/plans/business/edit').id,'administration');
  assert.equal(moduleForPath('/portal/owner/modules/trust'), undefined);
  assert.equal(moduleForPath('/account/coming-soon/hr'), undefined);
  for (const role of ['owner', 'admin']) {
    const ids = modulesForRole(role).flatMap(module => module[role].planned.map(feature => feature.id));
    assert.equal(new Set(ids).size, ids.length);
    for (const module of modulesForRole(role)) assert.equal(modulePath(role, module.id), `/portal/${role}/modules/${module.id}`);
  }
});

test('module links never treat restricted, checking or unavailable plan access as enabled', () => {
  const defaults = { permitted: true, permissionsLoading: false };
  assert.equal(moduleAccess(defaults), 'available');
  assert.equal(moduleAccess({...defaults, permitted:false}), 'restricted');
  assert.equal(moduleAccess({...defaults, permissionsLoading:true}), 'checking');
  assert.equal(moduleAccess({...defaults, planFeature:'inventory'}), 'checking');
  assert.equal(moduleAccess({...defaults, planFeature:'inventory', planError:true}), 'plan-error');
  assert.equal(moduleAccess({...defaults, planFeature:'inventory', planFeatures:[]}), 'plan-required');
  assert.equal(moduleAccess({...defaults, planFeature:'inventory', planFeatures:['inventory']}), 'available');
  assert.equal(moduleAccess({...defaults, permitted:false, planFeature:'sales', planFeatures:['sales']}), 'restricted');
});
