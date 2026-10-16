import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSummary } from '../src/lib/orderSummary.ts';
import { readFileSync } from 'node:fs';

test('aggregated order counts include history and preserve empty totals',()=>{
  assert.equal(orderSummary({pending_payment:8,completed:4,cancelled:2}).total,14);
  assert.equal(orderSummary({}).total,0);
  assert.equal(orderSummary({in_service:0}).total,0);
  assert.equal(orderSummary({job_in_progress:3}).rows[0].label,'Job in progress');
});
test('missing, malformed or partial status counts never become a false zero',()=>{
  for(const counts of [undefined,null,[],{paid:-1},{paid:'1'},{paid:1.5},{paid:1,cancelled:null}])assert.equal(orderSummary(counts),undefined);
});
test('working list destinations remain available even when their ranking is not implemented',()=>{
  const source=readFileSync(new URL('../src/components/reference/ReferenceUI.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/soon\s*\?\s*<Soon\s*\/?>\s*:\s*action/);
  assert.match(source,/to=\{to\}>View All/);
});
test('list footer stays after records instead of overlaying the scrolling table',()=>{
  const css=readFileSync(new URL('../src/index.css',import.meta.url),'utf8');
  assert.match(css,/\.workflow-panel > \.booking-pagination \{ position: static;/);
});
