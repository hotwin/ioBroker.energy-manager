'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { summarizePeriods } = require('../lib/period-totals');
const { historyKey } = require('../lib/daily-history');

test('calendar periods cross New Year and room coverage counts distinct days', () => {
    const dailyDevices = {
        a: { name: 'A', room: 'Kitchen', kWh: 1, pricedKWh: 1, costEUR: 0.25 },
        b: { name: 'B', room: 'Kitchen', kWh: 0, pricedKWh: 0 },
    };
    const groups = summarizePeriods({
        day: '2027-01-02',
        days: {
            '2026-12-21': { kWh: 2 },
            '2026-12-31': { kWh: 1, pricedKWh: 1, costEUR: 0.25 },
            '2027-01-01': { kWh: 0 },
            '2027-01-02': { kWh: 0 },
        },
        deviceDays: {
            '2026-12-31': dailyDevices,
            '2027-01-01': { b: dailyDevices.b },
        },
    });
    const total = groups.get('total').periods;
    assert.deepEqual(total.currentWeek, { energy: 1, cost: 0.25, measuredDays: 2, pricedDays: 1 });
    assert.equal(total.previousWeek.energy, 2);
    assert.equal(total.previousMonth.energy, 3);
    assert.equal(total.previousYear.energy, 3);
    assert.deepEqual(total.currentMonth, { energy: 0, cost: null, measuredDays: 1, pricedDays: 0 });
    assert.deepEqual(groups.get('rooms.' + historyKey('Kitchen')).periods.currentWeek, total.currentWeek);
    const device = groups.get('devices.' + historyKey('b')).periods;
    assert.equal(device.currentWeek.measuredDays, 2);
    assert.equal(device.previousWeek.energy, null);
});
