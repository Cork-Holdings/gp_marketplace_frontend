import test from 'node:test';
import assert from 'node:assert/strict';
import {adminEquivalentPath,adminDisplayValue,adminViews} from '../src/lib/adminWorkspace.ts';
import {adminReferenceMenu,groupReferenceMenu} from '../src/lib/referenceNavigation.ts';
import {canAccessNav} from '../src/lib/permissions.ts';
test('owner ERP links have admin equivalents without granting merchant writes',()=>{
 for(const path of ['purchasing','stock-control','accounting','reconciliation','reports','people','customers','activity'])assert.match(adminEquivalentPath('/portal/owner/'+path),/^\/portal\/admin\//);
 assert.equal(adminEquivalentPath('/portal/owner/roles'),undefined);
 assert.equal(adminEquivalentPath('/account/quotes'),undefined);
});
test('implemented admin directories are working entries and empty planned-only groups are omitted',()=>{
 for(const path of ['customers','products','categories','operations','erp'])assert.ok(adminReferenceMenu.some(i=>i.to==='/portal/admin/'+path&&!i.comingSoon));
 assert.ok(groupReferenceMenu(adminReferenceMenu.filter(i=>!i.comingSoon)).every(g=>g.items.length>0));
 assert.equal(canAccessNav(new Set(['orders.view']),'/portal/admin/customers'),false);
 assert.equal(canAccessNav(new Set(['merchants.view']),'/portal/admin/customers'),true);
 assert.equal(adminViews.people.permission,'admin.manage');
});
test('financial values preserve minor units and zero remains a real value',()=>{
 assert.equal(adminDisplayValue('amount_minor',975),'ZMW 9.75');
 assert.equal(adminDisplayValue('stock_quantity',0),'0');
 assert.equal(adminDisplayValue('amount_minor',null),'—');
 assert.equal(adminDisplayValue('is_active',false),'Inactive');
});
