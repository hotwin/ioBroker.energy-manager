'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { once } = require('node:events');
const { setTimeout: wait } = require('node:timers/promises');
const { tests } = require('@iobroker/testing');

tests.integration(path.join(__dirname, '..'), {
    controllerVersion: '7.2.5',
    defineAdditionalTests({ suite, it }) {
        suite('Energy Manager', getHarness => {
            it('publishes a live snapshot from the Strommessung enum', async function () {
                this.timeout(20000);
                const harness = getHarness();
                const power = 'zigbee2mqtt.0.test.power';
                const energy = 'zigbee2mqtt.0.test.energy';
                for (const [id, unit, value] of [[power, 'W', 1325], [energy, 'kWh', 42]]) {
                    await harness.objects.setObjectAsync(id, {
                        type: 'state', common: { name: id, type: 'number', role: 'value', unit, read: true, write: false }, native: {},
                    });
                    await harness.states.setStateAsync(id, { val: value, ack: true });
                }
                await harness.objects.setObjectAsync('enum.functions.strommessung', {
                    type: 'enum', common: { name: 'Strommessung', members: ['zigbee2mqtt.0.test'] }, native: {},
                });
                await harness.startAdapterAndWait(true);
                const state = await harness.states.getStateAsync('energy-manager.0.snapshot');
                const snapshot = JSON.parse(state.val);
                assert.equal(state.ack, true);
                assert.equal(snapshot.totalPower, 1325);
                assert.equal(snapshot.devices[0].energyKWh, 42);
                assert.equal(snapshot.devices[0].source, 'enum');
                await harness.stopAdapter();
                assert.equal((await harness.states.getStateAsync('energy-manager.0.info.connection')).val, false);
            });
        });
        suite('Compact mode', getHarness => {
            it('starts, unloads and restarts in the same host process', async function () {
                this.timeout(45000);
                const { states } = getHarness();
                const createAdapter = require(path.join(os.tmpdir(), 'test-iobroker.energy-manager',
                    'node_modules', 'iobroker.energy-manager'));
                const instance = 'energy-manager.0';
                async function waitForConnection() {
                    const end = Date.now() + 12000;
                    while (Date.now() < end) {
                        if ((await states.getStateAsync(instance + '.info.connection'))?.val === true) return;
                        await wait(100);
                    }
                    assert.fail('Compact adapter did not publish its connected state');
                }
                for (let run = 0; run < 2; run++) {
                    const adapter = createAdapter({ compact: true, compactInstance: 0 });
                    try {
                        await waitForConnection();
                        assert.equal((await states.getStateAsync('system.adapter.' + instance + '.compactMode')).val, true);
                        const result = await states.getStateAsync(instance + '.snapshot');
                        assert.ok(Number.isFinite(JSON.parse(result.val).ts));
                    } finally {
                        const exit = once(adapter, 'exit');
                        await adapter.stop();
                        await exit;
                    }
                    assert.equal((await states.getStateAsync(instance + '.info.connection')).val, false);
                }
            });
        });
    },
});
