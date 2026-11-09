import test from 'node:test';
import assert from 'node:assert/strict';
import {accountingSummary} from '../src/lib/accountingSummary.ts';
import {journalDraft} from '../src/lib/journalDraft.ts';
test('financial summaries include custom classifications rather than only default account codes',()=>{
 const chart=[{code:'1010',kind:'asset'},{code:'4100',kind:'income'},{code:'6100',kind:'expense'},{code:'2100',kind:'liability'}];
 const summary=accountingSummary([{account:'1010',debit_minor:1500,credit_minor:0},{account:'4100',debit_minor:0,credit_minor:2000},{account:'6100',debit_minor:500,credit_minor:0},{account:'2100',debit_minor:0,credit_minor:700}],chart);
 assert.equal(summary.income,2000);assert.equal(summary.expenses,500);assert.equal(summary.profit,1500);assert.equal(summary.assets,1500);assert.equal(summary.liabilities,700);assert.deepEqual(summary.unknown,[]);
});
test('multi-line drafts enforce exact positive balanced lines and active accounts',()=>{
 const lines=[{account:'1000',debit:'12.50',credit:''},{account:'1010',debit:'7.50',credit:'0.00'},{account:'3000',debit:'',credit:'20.00'}];
 assert.equal(journalDraft(lines,['1000','1010','3000']).valid,true);assert.equal(journalDraft(lines,['1000','3000']).valid,false);
 for(const value of ['1.001','-1','Infinity','999999999999999999999'])assert.equal(journalDraft([{...lines[0],debit:value},lines[2]],['1000','3000']).valid,false);
 assert.equal(journalDraft([{account:'1000',debit:'10.00',credit:'10.00'},lines[2]],['1000','3000']).valid,false);
});
