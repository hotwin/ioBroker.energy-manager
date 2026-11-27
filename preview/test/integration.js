'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { readFile } = require('node:fs/promises');
const { setTimeout: wait } = require('node:timers/promises');
const { tests } = require('@iobroker/testing');

const adapter = 'hotwin-energy-manager-preview';
const old = 'hotwin-energy-manager.0';
const meter = 'smartmeter.0.house.energy';

tests.integration(path.join(__dirname, '..'), {
    controllerVersion: '7.2.5',
    defineAdditionalTests({ suite, it }) {
        suite('Parallel preview migration', getHarness => {
            it('keeps the original data and records the first new delta only once across a restart', async function () {
                this.timeout(60000);
                const harness = getHarness();
                const { objects, states } = harness;
                const namespace = adapter + '.0';
                const oldInstance = 'system.adapter.' + old;
                const oldHistory = old + '.consumption';
                const native = { deviceAliases: { house: 'Haus' }, sources: [{ energyId: meter }] };
                const history = JSON.stringify({
                    days: { '2026-11-26': { kWh: 8 } },
                    meters: { house: { meterId: meter, value: 120, ts: Date.now() - 60000 } },
                });
                await objects.setObjectAsync(oldInstance, {
                    type: 'instance', common: { name: 'hotwin-energy-manager', enabled: true }, native,
                });
                await states.setStateAsync(oldHistory, { val: history, ack: true });
                await objects.setObjectAsync(meter, {
                    type: 'state', common: { name: meter, type: 'number', role: 'value.energy', unit: 'kWh',
                        read: true, write: false }, native: {},
                });
                await states.setStateAsync(meter, { val: 122, ack: true });
                await harness.changeAdapterConfig(adapter, { native: { legacyNamespace: old, energyStateId: meter } });
                const expectState = async (id, value) => {
                    for (let attempt = 0; attempt < 100; attempt++) {
                        if ((await states.getStateAsync(namespace + '.' + id))?.val === value) return;
                        await wait(50);
                    }
                    assert.equal((await states.getStateAsync(namespace + '.' + id))?.val, value);
                };
                await harness.startAdapterAndWait(true);
                await expectState('lastDelta', 2);
                const ledgerPath = path.join(os.tmpdir(), 'test-iobroker.' + adapter,
                    'iobroker-data', namespace, 'preview-ledger.json');
                const imported = JSON.parse(await readFile(ledgerPath, 'utf8'));
                assert.deepEqual(imported.configuration, native);
                assert.deepEqual(imported.history, JSON.parse(history));
                await expectState('measuredEnergy', 2);
                await states.setStateAsync(meter, { val: 123, ack: true });
                await expectState('measuredEnergy', 3);
                await harness.stopAdapter();
                await harness.startAdapterAndWait(true);
                await expectState('measuredEnergy', 3);
                await expectState('info.connection', true);
                await states.setStateAsync(meter, { val: 124, ack: true });
                await expectState('measuredEnergy', 4);
                assert.deepEqual((await objects.getObjectAsync(oldInstance)).native, native);
                assert.equal((await states.getStateAsync(oldHistory)).val, history);
                await harness.stopAdapter();
            });
        });
    },
});
