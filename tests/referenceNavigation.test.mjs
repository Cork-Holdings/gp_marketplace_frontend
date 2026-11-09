import test from 'node:test';
import assert from 'node:assert/strict';
import { ownerReferenceMenu,adminReferenceMenu,marketplaceReferenceCategories,groupReferenceMenu,referenceActive,featurePath } from '../src/lib/referenceNavigation.ts';
import { categoryPaths,cartQuantity,mobileAccountPaths } from '../src/lib/referenceMarketplace.ts';

test('owner navigation preserves every current work and setup route while adding all reference sections',()=>{
  const required=['Orders','Bookings','Products & Services','Inventory','Sales & POS','Customers (CRM)','Marketing','Accounting','Employees (HR)','Analytics','Website','Business Services','Financing','Settings','Subscription Plan'];
  for(const label of required)assert.ok(ownerReferenceMenu.some(item=>item.label===label),label);
  for(const path of ['quotes','jobs','custom-orders','transactions','stores','store-settings','menu','tables','kitchen','team','roles'])assert.ok(ownerReferenceMenu.some(item=>item.to===`/portal/owner/${path}`),path);
  assert.equal(new Set(ownerReferenceMenu.map(item=>item.to)).size,ownerReferenceMenu.length);
});
test('admin navigation includes the entire reference plus working KYC, onboarding, stores and platform admins',()=>{
  for(const label of ['Dashboard','Orders','Merchants','Customers','Products & Services','Categories','Marketing & Promotions','Payments & Settlements','Commissions & Revenue','Reviews & Disputes','Analytics & Reports','Geographic Analytics','Financing Pipeline','Enterprise Enablement','Risk & Compliance','System Management','Settings','KYC Review','Onboard Merchant','All Stores','Platform Admins'])assert.ok(adminReferenceMenu.some(item=>item.label===label),label);
  assert.equal(new Set(adminReferenceMenu.map(item=>item.to)).size,adminReferenceMenu.length);
});
test('future feature routes remain role scoped and marked unavailable',()=>{
  for(const [role,items] of [['owner',ownerReferenceMenu],['admin',adminReferenceMenu]])for(const item of items.filter(item=>item.comingSoon))assert.ok(item.to.startsWith(featurePath(role,''))||item.to==='/portal/owner/plans');
  assert.equal(featurePath('customer','notifications'),'/account/coming-soon/notifications');
});
test('module grouping retains route objects and food-only restrictions',()=>{
  const grouped=groupReferenceMenu(ownerReferenceMenu);
  assert.deepEqual(new Set(grouped.flatMap(group=>group.items)),new Set(ownerReferenceMenu));
  assert.equal(grouped.find(group=>group.label==='People & HR').to,'/portal/owner/modules/people');
  assert.deepEqual(ownerReferenceMenu.filter(item=>item.foodOnly).map(item=>item.label),['Kitchen','Menu','Tables']);
  assert.deepEqual(groupReferenceMenu([]),[]);
});
test('dashboard roots and merchant onboarding never activate two unrelated entries',()=>{
  assert.equal(referenceActive('/portal/owner/orders','/portal/owner'),false);
  assert.equal(referenceActive('/portal/admin/merchants/new','/portal/admin/merchants'),false);
  assert.equal(referenceActive('/portal/admin/merchants/new','/portal/admin/merchants/new'),true);
  assert.equal(referenceActive('/account/orders/123','/account/orders'),true);
  assert.equal(referenceActive('/account/quotes-old','/account/quotes'),false);
});
test('nine parent categories link only to supported discovery filters or an explicit coming-soon page',()=>{
  assert.deepEqual(marketplaceReferenceCategories.map(item=>item.label),['Products','Food','Services','Automotive','Education','Health','Home','Events','Professional']);
  for(const category of marketplaceReferenceCategories)assert.match(categoryPaths[category.id],/^(\/\?kind=(products|services)|\/\?category=(food|carwash|repairs)|\/coming-soon\/[a-z]+)$/);
});
test('shopping bag badge counts valid item quantities rather than stores and rejects invalid persisted values',()=>{
  assert.equal(cartQuantity([{quantity:2},{quantity:'3'}]),5);
  assert.equal(cartQuantity([{quantity:-2},{quantity:'NaN'},{quantity:Infinity},null,{}]),0);
  assert.equal(cartQuantity({quantity:8}),0);
  assert.equal(cartQuantity(null),0);
});
test('mobile bottom navigation uses each account’s own order and store destinations',()=>{
  assert.equal(mobileAccountPaths('owner').orders,'/portal/owner/orders');
  assert.equal(mobileAccountPaths('admin').orders,'/portal/admin/orders');
  assert.equal(mobileAccountPaths('customer').orders,'/account/ledger');
  assert.equal(mobileAccountPaths('guest').account,'/login');
  assert.equal(mobileAccountPaths('customer').store,'/register/merchant');
});
