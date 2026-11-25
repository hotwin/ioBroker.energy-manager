'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { mkdtemp, readFile, rm, stat } = require('node:fs/promises');
const { promisify } = require('node:util');
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
                const state = await harness.states.getStateAsync('hotwin-energy-manager.0.snapshot');
                const snapshot = JSON.parse(state.val);
                assert.equal(state.ack, true);
                assert.equal(snapshot.totalPower, 1325);
                assert.equal(snapshot.devices[0].energyKWh, 42);
                assert.equal(snapshot.devices[0].source, 'enum');
                await harness.stopAdapter();
                assert.equal((await harness.states.getStateAsync('hotwin-energy-manager.0.info.connection')).val, false);
            });
        });
        suite('Legacy migration', getHarness => {
            it('previews, protects and imports real controller data without changing the source', async function () {
                this.timeout(90000);
                const { objects, states } = getHarness();
                const oldId = 'system.adapter.energy-manager.3';
                const newId = 'system.adapter.hotwin-energy-manager.0';
                const oldHistory = 'energy-manager.3.consumption';
                const newHistory = 'hotwin-energy-manager.0.consumption';
                const legacy = {
                    type: 'instance',
                    common: { name: 'energy-manager', enabled: false },
                    native: { tariffConfigured: true, markupCt: 0.35, deviceAliases: { meter: 'Kitchen' }, sources: [] },
                };
                const schema = {
                    type: 'state',
                    common: { name: 'Consumption', type: 'string', role: 'json', read: true, write: false },
                    native: {},
                };
                const historical = {
                    days: { '2026-11-20': { kWh: 15, costEUR: 3, pricedKWh: 15 } },
                    meters: { meter: { value: 22 } },
                    hourly: { 18000: 10 },
                    deviceDays: { '2026-11-20': { meter: { kWh: 15 } } },
                    priceHistory: {},
                };
                const existing = { days: { '2026-11-21': { kWh: 2 } }, meters: {} };
                await objects.setObjectAsync(oldId, legacy);
                const target = await objects.getObjectAsync(newId);
                target.common.enabled = false;
                target.native.markupCt = 0.8;
                await objects.setObjectAsync(newId, target);
                for (const [id, ledger] of [[oldHistory, historical], [newHistory, existing]]) {
                    await objects.setObjectAsync(id, schema);
                    await states.setStateAsync(id, { val: JSON.stringify(ledger), ack: true });
                }
                // The test harness runs the controller databases without a host daemon.
                const hostId = 'system.host.' + os.hostname();
                await objects.setObjectAsync(hostId, { type: 'host', common: { name: os.hostname() }, native: {} });
                await states.setStateAsync(hostId + '.alive', { val: true, ack: true });
                const oldBefore = await objects.getObjectAsync(oldId);
                const oldStateBefore = await states.getStateAsync(oldHistory);
                const directory = await mkdtemp(path.join(os.tmpdir(), 'energy-migration-'));
                const backup = path.join(directory, 'original.json');
                const testHost = path.join(os.tmpdir(), 'test-iobroker.hotwin-energy-manager');
                const cli = path.join('node_modules', 'iobroker.hotwin-energy-manager', 'lib', 'migrate-legacy.js');
                const execute = promisify(execFile);
                const run = async (...args) => JSON.parse((await execute(process.execPath,
                    [cli, '--from', '3', '--to', '0', ...args], { cwd: testHost, timeout: 15000 })).stdout);

                try {
                    const preview = await run();
                    assert.deepEqual(preview.conflictingSettings, ['markupCt']);
                    assert.equal(preview.historyConflict, true);
                    assert.equal(preview.sourceHistoryDays, 1);
                    await states.setStateAsync(newId + '.alive', { val: true, ack: true });
                    await assert.rejects(run('--apply', '--backup', backup, '--overwrite'), /Stop and disable both instances/);
                    await states.setStateAsync(newId + '.alive', { val: false, ack: true });
                    await assert.rejects(run('--apply', '--backup', backup), /explicitly confirm replacement/);
                    await assert.rejects(stat(backup), { code: 'ENOENT' });
                    assert.equal((await states.getStateAsync(newHistory)).val, JSON.stringify(existing));
                    assert.equal((await objects.getObjectAsync(newId)).native.markupCt, 0.8);

                    const applied = await run('--apply', '--backup', backup, '--overwrite');
                    assert.equal(applied.applied, true);
                    assert.equal((await stat(backup)).mode & 0o777, 0o600);
                    const saved = JSON.parse(await readFile(backup, 'utf8'));
                    assert.equal(saved.target.instance.native.markupCt, 0.8);
                    assert.deepEqual(saved.target.ledger, existing);
                    const updated = await objects.getObjectAsync(newId);
                    assert.deepEqual(updated.acl, target.acl);
                    assert.equal(updated.native.markupCt, 0.35);
                    assert.equal(updated.native.tariffConfigured, true);
                    assert.deepEqual(updated.native.deviceAliases, { meter: 'Kitchen' });
                    const copied = await states.getStateAsync(newHistory);
                    assert.equal(copied.ack, true);
                    assert.deepEqual(JSON.parse(copied.val), { ...historical, meters: {} });
                    assert.deepEqual(await objects.getObjectAsync(oldId), oldBefore);
                    assert.deepEqual(await states.getStateAsync(oldHistory), oldStateBefore);
                    const retry = await run('--apply', '--backup', backup);
                    assert.deepEqual(retry.changedSettings, []);
                    assert.equal(retry.copyHistory, false);

                    await states.delState(newHistory);
                    await objects.delObjectAsync(newHistory);
                    const fresh = await run('--apply', '--backup', path.join(directory, 'fresh.json'));
                    assert.equal(fresh.applied, true);
                    assert.equal(fresh.historyConflict, false);
                    assert.equal((await objects.getObjectAsync(newHistory)).common.role, 'json');

                    await states.setStateAsync(oldHistory, { val: 'invalid', ack: true });
                    await assert.rejects(run(), /Unexpected consumption history format/);
                } finally {
                    await rm(directory, { force: true, recursive: true });
                }
            });
        });
        suite('Compact mode', getHarness => {
            it('loads saved contract changes after restarting in the same host process', async function () {
                this.timeout(45000);
                const harness = getHarness();
                const { states } = harness;
                const createAdapter = require(path.join(os.tmpdir(), 'test-iobroker.hotwin-energy-manager',
                    'node_modules', 'iobroker.hotwin-energy-manager'));
                const instance = 'hotwin-energy-manager.0';
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
                        await harness.changeAdapterConfig('hotwin-energy-manager', { native: {
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
