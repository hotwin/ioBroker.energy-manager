'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const calculateTariff = require('../lib/tariff');

test('net tariff, tax, fixed charges, advance and contract start are kept separate', () => {
    const config = { tariffConfigured: true, contractStart: '2026-11-24', markupCt: 5, networkCt: 10,
        vatPercent: 20, baseMonthly: 10, meterAnnual: 24, advanceMonthly: 40 };
    const { contract, tariffCt } = calculateTariff(config, -5, '2026-11-24');
    assert.equal(tariffCt, 12);
    assert.ok(Math.abs(contract.fixedMonthlyGross - 14.4) < 1e-10);
    assert.equal(contract.advanceMonthly, 40);
    assert.equal(calculateTariff(config, -5, '2026-11-23').tariffCt, null);
    assert.equal(calculateTariff(config, null, '2026-11-24').tariffCt, null);
});
