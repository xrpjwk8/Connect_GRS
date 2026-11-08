import test from 'node:test';
import assert from 'node:assert/strict';
import {availableStart,studentCardFormat,requestIdentity} from '../dist/booker-domain.js';
const slots=[1020,1050,1080].map(start_minute=>({start_minute,remaining_seats:10,blocked:false}));
test('availability checks every consecutive slot and excludes past, blocked, and undersized capacity',()=>{
 assert.equal(availableStart(slots,1020,3,10,'2099-01-01'),true);
 assert.equal(availableStart(slots,1050,3,10,'2099-01-01'),false);
 assert.equal(availableStart(slots,1020,2,11,'2099-01-01'),false);
 assert.equal(availableStart(slots,1020,1,1,'2000-01-01'),false);
 assert.equal(availableStart([{...slots[0],blocked:true}],1020,1,1,'2099-01-01'),false);
 assert.equal(availableStart(slots,null,1,1,'2099-01-01'),false);
});
test('retry reuses request ID only for identical payload',()=>{const a=requestIdentity(null,{people:2},()=> 'one');assert.equal(requestIdentity(a,{people:2},()=> 'two').id,'one');assert.equal(requestIdentity(a,{people:3},()=> 'two').id,'two');});
test('student card checks actual signature and size',()=>{assert.equal(studentCardFormat(new Uint8Array([255,216,255]).buffer).extension,'jpg');assert.throws(()=>studentCardFormat(new TextEncoder().encode('<html>').buffer));assert.throws(()=>studentCardFormat(new ArrayBuffer(10485761)));});
