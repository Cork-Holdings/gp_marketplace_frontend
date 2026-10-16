import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement,Fragment} from 'react';
import {recordElements} from '../src/lib/recordElements.ts';

const row=id=>createElement(Fragment,{key:id},createElement('tr',null,createElement('td',null,id)));
test('fragment-based order rows retain unique stable record identities',()=>{
 const a=row('order-a'),b=row('order-b');
 const first=recordElements([a,b]),reordered=recordElements([b,a]);
 assert.notEqual(first[0].key,first[1].key);
 assert.equal(first[0].key,reordered[1].key);
 assert.equal(first[1].key,reordered[0].key);
});
test('detail rows within the same fragment remain distinct and non-elements are skipped',()=>{
 const rows=recordElements([null,' ',createElement(Fragment,{key:'order-a'},createElement('tr',null),createElement('tr',null))]);
 assert.equal(rows.length,2);assert.notEqual(rows[0].key,rows[1].key);
});
