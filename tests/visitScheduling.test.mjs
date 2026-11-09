import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarLanes,calendarWeek,emptyVisit} from '../src/lib/visitScheduling.ts';
import {visitInput,zambiaDateTime,visitWindow} from '../src/lib/bookingTime.ts';

test('visit requests use Zambia wall-clock time regardless of device timezone',()=>{
 assert.equal(zambiaDateTime('2026-10-22T09:30'),'2026-10-22T07:30:00.000Z');
 assert.equal(visitInput('2026-10-22T07:30:00Z'),'2026-10-22T09:30');
 assert.match(visitWindow('2026-10-22T07:30:00Z','2026-10-22T08:30:00Z'),/9:30.*10:30.*Zambia time/);
 assert.deepEqual(emptyVisit(),{scheduled_at:'',scheduled_end_at:''});
});
test('overlapping entries have separate lanes; adjacent entries reuse a lane',()=>{
 const events=[{id:'a',starts_at:'2026-10-22T07:00Z',ends_at:'2026-10-22T08:00Z'},
  {id:'b',starts_at:'2026-10-22T07:30Z',ends_at:'2026-10-22T08:00Z'},
  {id:'c',starts_at:'2026-10-22T08:00Z',ends_at:'2026-10-22T09:00Z'}];
 const lanes=calendarLanes(events);
 assert.deepEqual(lanes.map(e=>[e.event.id,e.lane,e.lanes]),[['a',0,2],['b',1,2],['c',0,2]]);
 assert.deepEqual(calendarLanes([]),[]);
});

test('calendar week starts Monday and crosses month/year boundaries correctly',()=>{
 assert.deepEqual(calendarWeek('2026-10-21'),['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25']);
 assert.deepEqual(calendarWeek('2027-01-01'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
 assert.equal(calendarWeek('2026-10-25')[6],'2026-10-25');
 assert.deepEqual(calendarWeek('invalid'),[]);
});
