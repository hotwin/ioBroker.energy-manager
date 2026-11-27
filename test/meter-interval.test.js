'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { meterInterval } = require('../preview/lib/meter-interval');
const day = ts => Math.floor(ts / 86400000);
const point = (ts, kWh) => ({ id: 'meter', ts, kWh });

test('counts a persisted meter delta across a long gap', () => {
    const prior = JSON.parse(JSON.stringify(point(1000, 12)));
    assert.equal(meterInterval(prior, point(3600000, 14), day).kWh, 2);
});

test('keeps measured energy across day and tariff boundaries without assigning it', () => {
    const result = meterInterval(point(86399000, 12), point(86401000, 14), day,
        { start: 0, end: 86400000, ctPerKWh: 30 });
    assert.equal(result.kWh, 2);
    assert.equal(result.day, null);
    assert.equal(result.costEUR, null);
});

test('supports a negative tariff when it covers the entire interval', () => {
    const result = meterInterval(point(1000, 12), point(2000, 14), day,
        { start: 0, end: 2000, ctPerKWh: -5 });
    assert.equal(result.costEUR, -0.1);
});

test('classifies a counter decrease and uses the new baseline', () => {
    const reset = meterInterval(point(1000, 12), point(2000, 1), day);
    assert.equal(reset.status, 'reset');
    assert.equal(meterInterval(reset.baseline, point(3000, 2), day).kWh, 1);
});

test('stale and invalid readings preserve the baseline', () => {
    const baseline = point(2000, 12);
    assert.equal(meterInterval(baseline, point(1000, 11), day).baseline, baseline);
    assert.equal(meterInterval(baseline, point(3000, NaN), day).baseline, baseline);
});

test('a small dip and recovery do not count as new consumption', () => {
    const original = point(1000, 120);
    const dip = meterInterval(original, point(2000, 119.99), day, null, 0.02);
    assert.equal(dip.status, 'jitter');
    assert.equal(meterInterval(dip.baseline, point(3000, 120), day, null, 0.02).kWh, 0);
});
