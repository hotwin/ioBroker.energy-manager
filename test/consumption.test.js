'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const accumulate = require('../lib/consumption');
const t = Date.parse('2026-11-24T12:00:00Z');
const meter = (energyKWh, exclude=false) => [{id:'meter',energyKWh,exclude}];
test('first reading establishes baseline',()=> {
 const a=accumulate(null,meter(100),t,30);
 assert.equal(a.days[a.day].kWh,0);
});
test('meter delta and unchanged tariff produce consumption and cost',()=>{
 const a=accumulate(null,meter(100),t,30);
 const b=accumulate(a,meter(101),t+60000,30);
 assert.equal(b.days[b.day].kWh,1);
 assert.equal(b.days[b.day].costEUR,0.3);
});
for(const [name,value,delay,exclude] of [['reset',99,60000,false],['gap',101,240000,false],['excluded',101,60000,true]]){
 test(name+' does not add consumption',()=>{
 const a=accumulate(null,meter(100),t,30);
 const b=accumulate(a,meter(value,exclude),t+delay,30);
 assert.equal(b.days[b.day].kWh,0);
 });
}
test('changed tariff records energy without assigning uncertain cost',()=>{
 const a=accumulate(null,meter(100),t,30);
 const b=accumulate(a,meter(101),t+60000,40);
 assert.equal(b.days[b.day].kWh,1);
 assert.equal(b.days[b.day].pricedKWh,0);
});
test('midnight establishes a new daily baseline',()=>{
 const midnight=Date.parse('2026-11-24T23:00:00Z');
 const a=accumulate(null,meter(100),midnight-30000,30);
 const b=accumulate(a,meter(101),midnight+30000,30);
 assert.notEqual(a.day,b.day);
 assert.equal(b.days[b.day].kWh,0);
});
