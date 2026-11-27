'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const MeasurementCache = require('../lib/measurement-cache');

test('subscribed measurement events supersede initial reads and stale subscriptions are removed', async () => {
    const id = 'shelly.0.meter.Power';
    const unsubscribed = [];
    let scans = 0;
    let reads = 0;
    const cache = new MeasurementCache({
        async subscribeForeignStatesAsync() {},
        async unsubscribeForeignStatesAsync(ids) { unsubscribed.push(...ids); },
        async getForeignStateAsync() {
            reads++;
            cache.update(id, { val: 20 });
            return { val: 10 };
        },
        async getForeignObjectsAsync() { return ++scans; },
    });
    assert.equal(await cache.getForeignObjectsAsync('shelly.*', 'state'), 1);
    cache.invalidate('unrelated.0.value');
    assert.equal(await cache.getForeignObjectsAsync('shelly.*', 'state'), 1);
    cache.invalidate('shelly.0.new.Power');
    assert.equal(await cache.getForeignObjectsAsync('shelly.*', 'state'), 2);
    assert.deepEqual(await cache.getForeignStateAsync(id), { val: 20 });
    cache.update(id, { val: 30 });
    assert.deepEqual(await cache.getForeignStateAsync(id), { val: 30 });
    assert.equal(reads, 1);
    await cache.finish();
    assert.deepEqual(unsubscribed, []);
    cache.requested.clear();
    await cache.finish();
    assert.deepEqual(unsubscribed, [id]);
});
