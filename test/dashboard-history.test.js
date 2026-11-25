'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const accumulate = require('../lib/consumption');

test('maintains legacy totals and records per-device and hourly deltas without crossing gaps', () => {
    const start = Date.parse('2026-11-24T09:59:00Z');
    const day = '2026-11-24';
    const meter = (id, energyKWh, exclude = false) => ({
        id, name: id, aliasKey: 'meter:' + id, room: 'Kitchen', meterId: id + '.energy', energyKWh, exclude,
    });
    const old = { days: { [day]: { kWh: 3, pricedKWh: 0, costEUR: 0 } } };
    const first = accumulate(old, [meter('washer', 10), meter('dryer', 20), meter('excluded', 2, true)], start, 30);
    assert.equal(first.days[day].kWh, 3);
    assert.equal(Object.keys(first.hourly).length, 0);
    const second = accumulate(first,
        [meter('washer', 10.5), meter('dryer', 20.25), meter('excluded', 3, true)], start + 30000, 30);
    assert.equal(second.days[day].kWh, 3.75);
    assert.equal(second.deviceDays[day]['meter:washer'].kWh, 0.5);
    assert.equal(second.deviceDays[day]['meter:dryer'].kWh, 0.25);
    assert.equal(Object.hasOwn(second.deviceDays[day], 'meter:excluded'), false);
    assert.equal(second.hourly[Date.parse('2026-11-24T09:00:00Z')], 0.75);
    const third = accumulate(second, [meter('washer', 11), meter('dryer', 20.25)], start + 90000, 30);
    assert.equal(third.days[day].kWh, 4.25);
    assert.equal(Object.hasOwn(third.hourly, Date.parse('2026-11-24T10:00:00Z')), false);
    const gap = accumulate(third, [meter('washer', 12)], start + 360000, 30);
    assert.equal(gap.days[day].kWh, 4.25);
});

test('distinguishes a measured zero from an empty daily entry', () => {
    const ledger = {
        days: { first: { kWh: 0 }, second: { kWh: 0 }, third: { kWh: 4 } },
        deviceDays: { second: { meter: { kWh: 0 } } },
    };
    assert.equal(accumulate.recordedKWh(ledger, 'first'), null);
    assert.equal(accumulate.recordedKWh(ledger, 'second'), 0);
    assert.equal(accumulate.recordedKWh(ledger, 'third'), 4);
    assert.equal(accumulate.recordedKWh(ledger, 'fourth'), null);
});
