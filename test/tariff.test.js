'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const calculateTariff = require('../lib/tariff');

test('net tariff, tax, fixed charges, advance and contract start are kept separate', () => {
    const config = { tariffConfigured: true, contractStart: '2026-11-24', markupCt: 5, networkCt: 10,
        electricityTaxCt: 0, concessionCt: 0, leviesCt: 0, vatPercent: 20, baseMonthly: 10, meterAnnual: 24, advanceMonthly: 40 };
    const { contract, tariffCt } = calculateTariff(config, -5, '2026-11-24');
    assert.equal(tariffCt, 12);
    assert.ok(Math.abs(contract.fixedMonthlyGross - 14.4) < 1e-10);
    assert.equal(contract.advanceMonthly, 40);
    assert.equal(calculateTariff(config, -5, '2026-11-23').tariffCt, null);
    assert.equal(calculateTariff(config, null, '2026-11-24').tariffCt, null);
});

test('aWATTar HOURLY adds the percentage to the absolute spot price and caps only gross energy', () => {
    const config = { tariffConfigured: true, tariffFormula: 'awattarHourly', marketMarkupPercent: '3,0',
        vatPercent: '19,0', markupCt: '0,5', networkCt: '9,5', electricityTaxCt: 0,
        concessionCt: 0, leviesCt: 0, energyMinGrossCt: '-80', energyMaxGrossCt: '80' };
    const calculate = spot => calculateTariff(config, spot, '2026-11-24').tariffCt;
    assert.ok(Math.abs(calculate(-10) - 0.357) < 1e-10);
    assert.ok(Math.abs(calculate(10) - 24.157) < 1e-10);
    assert.equal(calculate(100), 91.9);
    assert.equal(calculate(-100), -68.1);
});

test('unknown inputs are distinguishable from zero and unsupported formulas', () => {
    const config = { tariffConfigured: true, markupCt: 0, networkCt: 0, electricityTaxCt: 0,
        concessionCt: 0, leviesCt: 0, vatPercent: 0, baseMonthly: 0, meterAnnual: 0 };
    const calculate = (override, spot = 0) => calculateTariff({ ...config, ...override }, spot, '2026-11-24');
    assert.equal(calculate({}).tariffCt, 0);
    assert.equal(calculate({}).contract.advanceMonthly, null);
    assert.equal(calculate({ baseMonthly: null }).contract.fixedMonthlyGross, null);
    assert.equal(calculate({ networkCt: ' ' }).contract.status, 'incomplete');
    assert.equal(calculate({ vatPercent: null }).tariffCt, null);
    assert.equal(calculate({ contractStart: '2026-02-31' }).contract.status, 'incomplete');
    assert.equal(calculate({ tariffFormula: 'unsupported' }).contract.status, 'unsupported');
    assert.equal(calculate({}, null).contract.status, 'noMarket');
    assert.equal(calculate({ tariffConfigured: false }).contract.status, 'inactive');
});

test('blank optional energy limits differ from explicit zero limits (field report #23)', () => {
    const config = { tariffConfigured: true, tariffFormula: 'awattarHourly', marketMarkupPercent: 0,
        vatPercent: 19, markupCt: 0, networkCt: 7.46, electricityTaxCt: 2.05,
        concessionCt: 2.39, leviesCt: 2.95 };
    const rate = (min, max, spot) => calculateTariff({ ...config, energyMinGrossCt: min,
        energyMaxGrossCt: max }, spot, '2026-11-25').tariffCt;
    assert.ok(Math.abs(rate(null, null, 29.57) - 52.8598) < 1e-10);
    assert.equal(rate('', '', 29.57), rate(null, null, 29.57));
    assert.ok(Math.abs(rate(0, 0, 29.57) - 17.6715) < 1e-10);
    assert.ok(rate(null, null, -10) < rate(0, null, -10));
});
