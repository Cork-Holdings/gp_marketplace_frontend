import test from 'node:test';
import assert from 'node:assert/strict';
import {paginationWindow} from '../src/lib/tablePagination.ts';

test('every loaded row is reachable exactly once with a partial final page',()=>{
  const records=Array.from({length:63},(_,i)=>i);
  const visited=[];
  for(let p=0;p<3;p++){const w=paginationWindow(records.length,p);visited.push(...records.slice(w.start,w.end));}
  assert.deepEqual(visited,records);assert.equal(new Set(visited).size,63);
  assert.deepEqual(paginationWindow(63,2),{page:2,pages:3,pageSize:25,start:50,end:63,total:63});
});
test('empty, changed and out-of-range datasets never strand the page',()=>{
  assert.equal(paginationWindow(0,7).page,0);assert.equal(paginationWindow(0,7).end,0);
  assert.equal(paginationWindow(8,4).page,0);assert.equal(paginationWindow(60,-1).page,0);
  assert.equal(paginationWindow(60,1,0).pageSize,25);
});
