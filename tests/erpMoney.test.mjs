import test from 'node:test';
import assert from 'node:assert/strict';
import {erpMinor} from '../src/lib/erpMoney.ts';
test('ERP amounts retain exact minor units without floating-point rounding',()=>{
 for(const [input,value] of [['0',0],['0.05',5],['1.05',105],['10.1',1010],['1000000000.00',100000000000]])assert.equal(erpMinor(input),value);
});
test('ERP amounts reject hidden rounding, exponent syntax, negative and oversized values',()=>{
 for(const input of ['1.005','1e3','-1','NaN','Infinity','','1,000','1000000000.01'])assert.throws(()=>erpMinor(input));
});
