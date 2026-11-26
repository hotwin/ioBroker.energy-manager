'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { priceSnapshot } = require('../lib/prices');

test('pairs the current market and contract prices at the exact interval boundary', () => {
    const boundary = Date.parse('2026-11-25T16:00:00Z');
    const hour = 3600000;
    const feed = [
        { start_timestamp: boundary - hour, end_timestamp: boundary, marketprice: 295.7 },
        { start_timestamp: boundary, end_timestamp: boundary + hour, marketprice: -100 },
    ];
    const config = {
        tariffConfigured: true, tariffFormula: 'awattarHourly', marketMarkupPercent: 3,
        markupCt: 0, networkCt: 5, electricityTaxCt: 0, concessionCt: 0, leviesCt: 0, vatPercent: 19,
    };
    const first = priceSnapshot(config, feed, boundary - 1);
    assert.ok(Math.abs(first.marketCt - 29.57) < 1e-10);
    assert.equal(first.currentPrice.end_timestamp, boundary);
    assert.equal(first.tariffCt, first.prices[0].tariffCt);
    assert.notEqual(first.tariffCt, first.prices[1].tariffCt);
    assert.ok(Math.abs(first.prices[1].tariffCt - (-10 + 0.3 + 5) * 1.19) < 1e-10);

    const second = priceSnapshot(config, feed, boundary);
    assert.equal(second.marketCt, -10);
    assert.equal(second.tariffCt, first.prices[1].tariffCt);
    assert.equal(second.currentPrice.start_timestamp, boundary);
    const expired = priceSnapshot(config, feed, boundary + hour);
    assert.equal(expired.currentPrice, null);
    assert.equal(expired.marketCt, null);
    assert.equal(expired.tariffCt, null);
});

test('activates a contract on its local start day even during a spanning price interval', () => {
    const midnight = Date.parse('2026-11-25T23:00:00Z');
    const feed = [{ start_timestamp: midnight - 900000, end_timestamp: midnight + 900000, marketprice: 200 }];
    const config = {
        tariffConfigured: true, contractStart: '2026-11-26',
        markupCt: 0, networkCt: 0, electricityTaxCt: 0, concessionCt: 0, leviesCt: 0, vatPercent: 0,
    };
    assert.equal(priceSnapshot(config, feed, midnight - 1).tariffCt, null);
    const active = priceSnapshot(config, feed, midnight);
    assert.equal(active.tariffCt, 20);
    assert.equal(active.prices[0].tariffCt, active.tariffCt);
});

test('accepts a custom EUR/MWh series and rejects overlapping intervals', () => {
    const { normalizePriceFeed } = require('../lib/prices');
    const first = { start_timestamp: 0, end_timestamp: 3600000, marketprice: -15 };
    const second = { start_timestamp: 3600000, end_timestamp: 7200000, marketprice: 0 };
    assert.deepEqual(normalizePriceFeed({ data: [second, first] }), [first, second]);
    assert.deepEqual(normalizePriceFeed([first, { ...second, start_timestamp: 1 }]), []);
    assert.deepEqual(normalizePriceFeed({ data: null }), []);
});

test('normalizes Energy-Charts in EUR/MWh and preserves gaps', () => {
    const { normalizeEnergyCharts } = require('../lib/prices');
    const timestamp = '2026-11-26T12:00:00+01:00';
    const feed = { bidding_zone: 'DE-LU', unit: 'EUR/MWh', interval_minutes: 15,
        series: [{ id: 'price' }], data: [{ timestamp, values: { price: -5 } },
            { timestamp: '2026-11-26T12:15:00+01:00', values: { price: null } }] };
    assert.deepEqual(normalizeEnergyCharts(feed, 'DE-LU'), [{ start_timestamp: Date.parse(timestamp),
        end_timestamp: Date.parse(timestamp) + 900000, marketprice: -5 }]);
    assert.deepEqual(normalizeEnergyCharts(feed, 'AT'), []);
});
