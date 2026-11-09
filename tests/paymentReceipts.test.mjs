import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptPage,receiptStageLabel,receiptKindLabel } from '../src/lib/paymentReceipts.ts';

const recorded={id:'p',kind:'quote',source_id:'q',stage:'full',amount:'2.00',currency:'ZMW',reference:'saved-reference',simulated:false,confirmed_at:'2026-10-16T15:14:06Z',title:'Service',business:'Business',customer:'Customer',refunded:false};
test('receipts retain recorded amount, reference, simulation and refund markings',()=>{
 const value={items:[recorded,{...recorded,id:'test',simulated:true,refunded:true}],has_more:false};
 assert.deepEqual(receiptPage(value),value);
 assert.deepEqual(receiptPage({items:[],has_more:false}),{items:[],has_more:false});
});
test('missing and invalid receipt data are errors, not false empty or paid states',()=>{
 for(const value of [null,{}, {items:null,has_more:false},{items:[],has_more:'false'}, ...[{amount:''},{amount:'bad'},{amount:'-1'},{amount:'1.234'},{reference:''},{currency:''},{confirmed_at:'bad'},{simulated:undefined},{refunded:undefined},{kind:'order'},{stage:'unpaid'}].map(change=>({items:[{...recorded,...change}],has_more:false}))])assert.throws(()=>receiptPage(value));
});
test('payment stage labels never mistake an initial custom-order collection for outstanding debt',()=>{
 assert.equal(receiptStageLabel('deposit'),'Initial payment');
 assert.equal(receiptStageLabel('balance'),'Balance payment');
 assert.equal(receiptStageLabel('full'),'Full payment');
 assert.equal(receiptKindLabel('quote'),'Quoted service');
 assert.equal(receiptKindLabel('reservation'),'Booking');
});
