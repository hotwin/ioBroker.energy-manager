'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { sourceSubscriptions } = require('../lib/source-subscriptions');

test('subscribes once, keeps newer live events and releases removed sources', async () => {
    const calls = [];
    const values = [];
    const id = 'meter.0.energy';
    const manager = sourceSubscriptions({
        async subscribeForeignStatesAsync(key) { calls.push(['subscribe', key]); },
        async getForeignStateAsync(key) {
            calls.push(['read', key]);
            manager.stateChange(key, { val: 12, ts: 200 });
            return { val: 11, ts: 100 };
        },
        async unsubscribeForeignStatesAsync(key) { calls.push(['unsubscribe', key]); },
    }, (key, state) => values.push([key, state?.val ?? null]));

    await manager.reconcile([id, id]);
    await manager.reconcile([id]);
    await manager.reconcile([]);
    manager.stateChange(id, { val: 13, ts: 300 });
    assert.deepEqual(calls, [['subscribe', id], ['read', id], ['unsubscribe', id]]);
    assert.deepEqual(values, [[id, 12], [id, null]]);
});
