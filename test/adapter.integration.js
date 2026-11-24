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
            it('loads saved contract changes after restarting in the same host process', async function () {
                this.timeout(45000);
                const harness = getHarness();
                const { states } = harness;
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
                const { native: original } = await harness.getAdapterConfig();
                for (let run = 0; run < 2; run++) {
                    if (run === 1) {
                        await harness.changeAdapterConfig('energy-manager', { native: {
                            provider: 'aWATTar', tariffName: 'HOURLY', tariffConfigured: true,
                            networkCt: 9.25, electricityTaxCt: 0, concessionCt: 0, leviesCt: 0,
                            markupCt: 0.3, vatPercent: 19, tariffFormula: 'awattarHourly', marketMarkupPercent: 3,
                        } });
                    }
                    const adapter = createAdapter({ compact: true, compactInstance: 0 });
                    try {
                        await waitForConnection();
                        assert.equal((await states.getStateAsync('system.adapter.' + instance + '.compactMode')).val, true);
                        const result = await states.getStateAsync(instance + '.snapshot');
                        const snapshot = JSON.parse(result.val);
                        assert.ok(Number.isFinite(snapshot.ts));
                        assert.equal(snapshot.contract.configured, run === 1);
                        if (run === 1) {
                            const { native: saved } = await harness.getAdapterConfig();
                            assert.equal(saved.tariffName, 'HOURLY');
                            assert.equal(saved.networkCt, 9.25);
                            assert.deepEqual(saved.sources, original.sources);
                            assert.equal(snapshot.contract.extraCt, 9.55);
                            if (snapshot.marketCt !== null) {
                                const expected = (snapshot.marketCt + Math.abs(snapshot.marketCt) * 0.03 + 9.55) * 1.19;
                                assert.ok(Math.abs(snapshot.tariffCt - expected) < 1e-10);
                            } else {
                                assert.equal(snapshot.contract.status, 'noMarket');
                                assert.equal(snapshot.tariffCt, null);
                            }
                        }
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
