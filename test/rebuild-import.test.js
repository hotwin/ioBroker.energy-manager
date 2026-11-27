'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { importEnergyData } = require('../lib/rebuild-import');

test('copies old data and counts only the new delta from the matched meter', () => {
    const native = { networkCt: 9.25, deviceAliases: { kitchen: 'Kitchen' } };
    const ledger = {
        days: { '2026-11-26': { kWh: 8, costEUR: 2 } },
        meters: { kitchen: { value: 120, ts: 1000, meterId: 'meter.0.energy' } },
    };
    const imported = importEnergyData(native, ledger, [{ id: 'kitchen', meterId: 'meter.0.energy' }]);
    assert.deepEqual(imported.history, ledger);
    assert.deepEqual(imported.native, native);
    const record = kWh => imported.record('kitchen', { id: 'meter.0.energy', kWh, ts: 500000 }, () => '2026-11-26');
    assert.equal(record(122).kWh, 2);
    assert.equal(record(122).status, 'outOfOrder');
    imported.native.deviceAliases.kitchen = 'Test';
    imported.history.days['2026-11-26'].kWh = 0;
    assert.equal(native.deviceAliases.kitchen, 'Kitchen');
    assert.equal(ledger.days['2026-11-26'].kWh, 8);
});

test('starts fresh when the physical meter changed', () => {
    const ledger = { meters: { kitchen: { value: 120, ts: 1000, meterId: 'old' } } };
    const imported = importEnergyData({}, ledger, [{ id: 'kitchen', meterId: 'new' }]);
    assert.equal(imported.record('kitchen', { id: 'new', kWh: 125, ts: 2000 }, () => 'day').status, 'baseline');
});
