'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const costManager = require('../lib/cost-manager');
const now = Date.parse('2026-11-25T18:00:00Z');
const contract = { configured: true, status: 'available', fixedMonthlyGross: 12, advanceMonthly: 100 };
const ledger = { days: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [
    '2026-11-' + (18 + i), { kWh: 10, pricedKWh: 10, costEUR: 3 },
])) };

test('forecasts from completed recorded days, excludes today, separates fixed charges and advances', () => {
    const result = costManager({ days: { ...ledger.days, '2026-11-25': { kWh: 2, pricedKWh: 2, costEUR: 0.6 } } }, contract, now);
    assert.equal(result.month.kWh, 72);
    assert.equal(result.sample.days, 7);
    assert.equal(result.monthForecast, 102);
    assert.equal(result.monthBalance, -2);
    assert.equal(result.yearForecast, 1239);
    assert.equal(result.annualBalance, -39);
    assert.equal(result.seven.length, 7);
});

test('missing data and low tariff coverage do not produce cost estimates', () => {
    const empty = costManager({ days: {} }, contract, now);
    assert.equal(empty.month.kWh, null);
    assert.equal(empty.monthForecast, null);
    assert.equal(empty.seven[0].costEUR, null);
    const incomplete = { days: Object.fromEntries(Object.entries(ledger.days).map(([day, item]) =>
        [day, { ...item, pricedKWh: 5 }])) };
    assert.equal(costManager(incomplete, contract, now).monthForecast, null);
    assert.equal(costManager(ledger, { ...contract, configured: false }, now).yearForecast, null);
});

test('measured zero remains distinct from absent data and negative prices are retained', () => {
    const result = costManager({ days: { '2026-11-24': { kWh: 4, pricedKWh: 4, costEUR: -1 },
        '2026-11-25': { kWh: 0, pricedKWh: 0, costEUR: 0 } }, deviceDays: { '2026-11-25': { meter: { kWh: 0 } } } }, contract, now);
    assert.equal(result.today.kWh, 0);
    assert.equal(result.month.variableEUR, -1);
    assert.equal(result.monthForecast, null);
});
