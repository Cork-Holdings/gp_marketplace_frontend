import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { recordedCurrency,recordedNumber,recordedCount } from '../src/lib/recordedData.ts';

test('actual zero is preserved, missing or malformed amounts never become zero',()=>{
  assert.equal(recordedCurrency('0','ZMW'),'ZMW 0');
  assert.equal(recordedCurrency(25,'ZMW'),'ZMW 25');
  assert.equal(recordedCurrency('-1.05','ZMW'),'ZMW -1.05');
  for(const value of [undefined,null,'',' ','invalid','12bad',false,{},NaN,Infinity])assert.equal(recordedCurrency(value,'ZMW'),'Unavailable');
  assert.equal(recordedCurrency(25,undefined),'Unavailable');
  assert.equal(recordedNumber(''),undefined);
});
test('reported counts accept actual zero and reject invalid totals',()=>{
  assert.equal(recordedCount(0),0);
  assert.equal(recordedCount(17),17);
  for(const value of [undefined,null,'17',-1,1.5,Infinity,NaN])assert.equal(recordedCount(value),undefined);
});
test('production pages cannot activate reference fixtures through URL parameters',()=>{
  for(const file of ['OwnerReferenceDashboard','AdminReferenceDashboard','ReferenceMarketplacePage','ReferenceShell','ReferenceUI','DashboardWidgets','SubscriptionPlansPage']){
    const source=readFileSync(new URL(`../src/components/reference/${file}.tsx`,import.meta.url),'utf8');
    assert.doesNotMatch(source,/useReferencePreview|PreviewControl|referenceFixtures|marketplaceProductsPreview|marketplaceBusinessesPreview|77,201|K49,285,600|K18,456|K7,320|K199|K499|Most Popular/);
  }
  assert.equal(existsSync(new URL('../src/hooks/useReferencePreview.ts',import.meta.url)),false);
  assert.equal(existsSync(new URL('../src/lib/referenceFixtures.ts',import.meta.url)),false);
});
