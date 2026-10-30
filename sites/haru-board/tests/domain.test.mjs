import test from 'node:test';
import assert from 'node:assert/strict';
import {monthCells,moveMonth,addDays,minuteLabel,isoAt,summary,escapeHTML} from '../dist/domain.js';
test('month navigation crosses year and leap day correctly',()=>{assert.equal(moveMonth('2026-12',1),'2027-01');assert.equal(moveMonth('2026-01',-1),'2025-12');assert.equal(addDays('2024-02-28',1),'2024-02-29');assert.equal(addDays('2024-02-29',1),'2024-03-01');});
test('calendar has six complete weeks including adjacent month',()=>{const cells=monthCells('2026-10');assert.equal(cells.length,42);assert.equal(cells[0],'2026-09-27');assert.equal(cells.at(-1),'2026-11-07');assert.equal(new Set(cells).size,42);});
test('business-day midnight maps to next civil date in Seoul',()=>{assert.equal(minuteLabel(1470),'다음 날 00:30');assert.equal(isoAt('2026-10-13',1470),'2026-10-13T15:30:00.000Z');});
test('pending/cancelled/completed do not inflate planned attendance',()=>{assert.deepEqual(summary([{status:'pending',people:40},{status:'confirmed',people:8},{status:'confirmed',people:4},{status:'cancelled',people:30},{status:'completed',people:10}]),{confirmed:2,people:12,pending:1});});
test('customer-provided content is escaped before HTML insertion',()=>assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
import {weekDays,slotCapacity} from '../dist/domain.js';
test('Monday week crosses month/year boundary',()=>assert.deepEqual(weekDays('2027-01-01'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']));
const store={capacity:40,allow_shared:true};
const reserve=(people,status='confirmed',day='2030-01-01',minute=1140)=>({people,status,starts_at:isoAt(day,minute),ends_at:isoAt(day,minute+60)});
test('three occupancy levels ignore pending and count all overlapping confirmed',()=>{
 assert.equal(slotCapacity(store,[reserve(40,'pending')],[],'2030-01-01',1140,0).level,'empty');
 assert.equal(slotCapacity(store,[reserve(12)],[],'2030-01-01',1140,0).remaining,28);
 assert.equal(slotCapacity(store,[reserve(12)],[],'2030-01-01',1140,0).level,'partial');
 assert.equal(slotCapacity(store,[reserve(12),reserve(28)],[],'2030-01-01',1140,0).level,'full');
 assert.equal(slotCapacity(store,[reserve(40)],[],'2030-01-01',1200,0).level,'empty');
});
test('blocked, exclusive and past slots cannot appear available',()=>{
 assert.equal(slotCapacity(store,[],[{service_date:'2030-01-01',start_minute:1140}],'2030-01-01',1140,0).reason,'점주 차단');
 assert.equal(slotCapacity({...store,allow_shared:false},[reserve(2)],[],'2030-01-01',1140,0).remaining,0);
 assert.equal(slotCapacity(store,[],[],'2020-01-01',1140).reason,'지난 시간');
});
test('overnight reservation overlaps next service day by absolute time',()=>assert.equal(slotCapacity(store,[reserve(12,'confirmed','2030-01-01',1440)],[],'2030-01-02',0,0).remaining,28));
