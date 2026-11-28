'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { storeLiveHistory } = require('../lib/daily-history');

test('writes each live state in the single-ID format accepted by History', async () => {
    const attempts = [];
    let rejectCost = true;
    const adapter = {
        namespace: 'hotwin-energy-manager.0',
        async getForeignStateAsync() { return { val: true }; },
        async sendToAsync(target, command, message) {
            assert.equal(target, 'history.0');
            if (command === 'getEnabledDPs') return {};
            assert.equal(command, 'storeState');
            if (!message.id || !message.state) return { error: 'Invalid call' };
            attempts.push(message.id);
            return message.id.endsWith('.todayCost') && rejectCost
                ? { error: 'Test rejection' } : { success: true, successCount: 1 };
        },
    };
    const values = { totalPower: 50, todayCost: 0 };
    await assert.rejects(storeLiveHistory(adapter, 'history.0', 1, values), /todayCost: Test rejection/);
    rejectCost = false;
    await storeLiveHistory(adapter, 'history.0', 2, values);
    await storeLiveHistory(adapter, 'history.0', 3, values);
    assert.deepEqual(attempts, ['totalPower', 'todayCost', 'todayCost'].map(id => adapter.namespace + '.' + id));
});
