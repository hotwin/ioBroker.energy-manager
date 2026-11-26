'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const energyInsights = require('../lib/energy-insights');

test('compares completed Berlin days using only recorded measurements', () => {
    const now = Date.parse('2026-11-24T23:30:00Z');
    const ledger = {
        days: Object.fromEntries(Object.entries({
            '2026-11-25': 20, '2026-11-24': 6, '2026-11-23': 0, '2026-11-22': 2,
            '2026-11-21': 4, '2026-11-20': 0, '2026-11-16': 100,
        }).map(([day, kWh]) => [day, { kWh }])),
        deviceDays: { '2026-11-20': { meter: { kWh: 0 } } },
    };
    assert.deepEqual(energyInsights(ledger, [], now).comparison, {
        yesterday: '2026-11-24', kWh: 6, average: 2, difference: 4, trend: 'high', days: 3,
    });
    assert.equal(energyInsights({ days: ledger.days }, [], now).comparison, null);
});

test('chooses the earliest fully upcoming interval at the lowest known gross rate', () => {
    const now = Date.parse('2026-11-25T09:30:00Z');
    const hour = 3600000;
    const price = (offset, tariffCt) => ({
        start_timestamp: now + offset * hour,
        end_timestamp: now + (offset + 1) * hour,
        tariffCt,
    });
    const prices = [price(-0.5, -20), price(1, null), price(4, -1), price(2, -1), price(24, -10)];
    assert.deepEqual(energyInsights({}, prices, now), {
        comparison: null, cheapestTwoHours: null, cheapest: { from: now + 2 * hour, to: now + 3 * hour, rate: -1 },
    });
});

test('finds a continuous two-hour window using duration-weighted rates', () => {
    const hour = 3600000;
    const price = (from, to, tariffCt) => ({ start_timestamp: from * hour, end_timestamp: to * hour, tariffCt });
    const prices = [price(1, 3, 20), price(4, 4.5, -5), price(4.5, 6, 3), price(7, 8, -100)];
    assert.deepEqual(energyInsights({ days: {} }, prices, 0).cheapestTwoHours, {
        from: 4 * hour, to: 6 * hour, rate: 1,
    });
    assert.equal(energyInsights({ days: {} }, [price(1, 2, 3), price(3, 4, 3)], 0).cheapestTwoHours, null);
});
