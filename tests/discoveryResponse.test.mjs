import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDiscoveryResponse } from '../src/lib/discoveryResponse.ts';
test('discovery accepts both empty results and loaded pages without altering records',()=>{
  const empty={offerings:[],total:0};assert.equal(validateDiscoveryResponse(empty),empty);
  const page={offerings:[{id:'one'}],total:8};assert.equal(validateDiscoveryResponse(page),page);
});
test('a malformed discovery response becomes a retryable error before a React updater can crash',()=>{
  for(const response of [null,undefined,{}, {offerings:null,total:0},{offerings:[],total:'8'},{offerings:[],total:-1},{offerings:[],total:Infinity}])assert.throws(()=>validateDiscoveryResponse(response),/could not be read/);
});
