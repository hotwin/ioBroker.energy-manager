'use strict';

const { mkdir, readFile, rename, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const utils = require('@iobroker/adapter-core');
const { importEnergyData } = require('./lib/rebuild-import');
const { meterInterval } = require('./lib/meter-interval');
const { sourceSubscriptions } = require('./lib/source-subscriptions');

const adapterName = 'hotwin-energy-manager-preview';
const legacyPattern = /^(?:hotwin-energy-manager|energy-manager)\.\d+$/;
const dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', dateStyle: 'short' });
const localDay = timestamp => dayFormat.format(timestamp);
const units = new Map([['Wh', 0.001], ['kWh', 1], ['MWh', 1000]]);
const outputs = {
    meterEnergy: ['Meter reading', 'kWh'],
    lastDelta: ['Last accepted meter delta', 'kWh'],
    measuredEnergy: ['Energy recorded since import', 'kWh'],
    unallocatedEnergy: ['Energy across day boundaries since import', 'kWh'],
    todayEnergy: ['Energy today', 'kWh'],
};

class EnergyPreview extends utils.Adapter {
    constructor(options = {}) {
        super({ ...options, name: adapterName });
        this.queue = Promise.resolve();
        this.sources = sourceSubscriptions(this, (id, state) => {
            if (!this.stopping) this.enqueue(() => this.record(id, state));
        });
        this.on('stateChange', this.sources.stateChange);
        this.on('ready', () => this.enqueue(() => this.start()));
        this.on('unload', callback => {
            this.stopping = true;
            this.enqueue(async () => {
                await this.sources.reconcile([]);
                await this.setStateAsync('info.connection', false, true);
            }).finally(callback);
        });
    }

    enqueue(operation) {
        this.queue = this.queue.then(operation).catch(async error => {
            this.log.error(error.message);
            await this.setStateAsync('info.connection', false, true).catch(() => {});
        });
        return this.queue;
    }

    async start() {
        await this.setStateAsync('info.connection', false, true);
        const directory = utils.getAbsoluteInstanceDataDir(this);
        await mkdir(directory, { recursive: true });
        this.filename = join(directory, 'preview-ledger.json');
        const saved = await readFile(this.filename, 'utf8').catch(error => {
            if (error.code !== 'ENOENT') throw error;
            return null;
        });
        if (saved !== null) {
            this.data = JSON.parse(saved);
            if (this.data.version !== 1) throw new Error('Unsupported preview ledger format.');
        } else {
            this.data = await this.importLegacy();
        }
        const object = await this.getForeignObjectAsync(this.data.meterId);
        this.factor = units.get(object?.common?.unit);
        if (object?.type !== 'state' || object.common.type !== 'number' || !this.factor) {
            throw new Error('Selected meter must be a numeric ioBroker state with unit Wh, kWh or MWh.');
        }
        await this.save(this.data);
        for (const [id, [name, unit]] of Object.entries(outputs)) {
            await this.setObjectNotExistsAsync(id, {
                type: 'state', common: { name, unit, type: 'number', role: 'value.energy', read: true, write: false },
                native: {},
            });
        }
        await this.publish();
        if (!this.stopping) await this.sources.reconcile([this.data.meterId]);
    }

    async importLegacy() {
        const source = this.config.legacyNamespace?.trim();
        if (!legacyPattern.test(source ?? '')) throw new Error('Enter the existing Energy Manager namespace.');
        const instance = await this.getForeignObjectAsync('system.adapter.' + source);
        if (instance?.type !== 'instance' || !instance.native) throw new Error('Existing instance not found.');
        const state = await this.getForeignStateAsync(source + '.consumption');
        const ledger = typeof state?.val === 'string' && JSON.parse(state.val);
        if (!ledger?.days || Array.isArray(ledger.days) || typeof ledger.days !== 'object') {
            throw new Error('Existing consumption history could not be read.');
        }
        const meterId = this.config.energyStateId?.trim();
        const matches = Object.entries(ledger.meters ?? {}).filter(([, meter]) => meter && !meter.exclude && meter.meterId === meterId);
        if (!meterId || matches.length !== 1) throw new Error('Select a meter with exactly one active baseline in the existing history.');
        const imported = importEnergyData(instance.native, ledger, [{ id: matches[0][0], meterId }]);
        const baseline = imported.baselines.get(matches[0][0]);
        if (!baseline) throw new Error('Existing meter baseline is invalid.');
        return {
            version: 1, source, meterId, baseline, configuration: imported.native,
            history: imported.history, addedByDay: {}, measuredEnergy: 0, unallocatedEnergy: 0, lastDelta: null,
        };
    }

    async save(data) {
        const temporary = this.filename + '.tmp';
        await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
        await rename(temporary, this.filename);
    }

    async record(id, state) {
        if (this.stopping) return;
        if (!state || state.q || state.ack !== true || typeof state.val !== 'number') {
            await this.setStateAsync('info.connection', false, true);
            return;
        }
        const result = meterInterval(this.data.baseline, { id, ts: state.ts, kWh: state.val * this.factor },
            localDay, undefined, 0.001);
        if (['reset', 'measured'].includes(result.status)) {
            const next = { ...this.data, baseline: result.baseline };
            if (result.status === 'measured') {
                next.lastDelta = result.kWh;
                next.measuredEnergy += result.kWh;
                if (result.day) {
                    next.addedByDay = { ...next.addedByDay, [result.day]: (next.addedByDay[result.day] ?? 0) + result.kWh };
                } else {
                    next.unallocatedEnergy += result.kWh;
                }
            } else {
                next.lastDelta = null;
            }
            await this.save(next);
            this.data = next;
        }
        if (result.status !== 'invalid') await this.publish();
        await this.setStateAsync('info.connection', result.status !== 'invalid', true);
    }

    async publish() {
        const { baseline, lastDelta, measuredEnergy, unallocatedEnergy, addedByDay } = this.data;
        const values = { meterEnergy: baseline.kWh, lastDelta, measuredEnergy, unallocatedEnergy,
            todayEnergy: addedByDay[localDay(Date.now())] ?? 0 };
        await Promise.all(Object.entries(values).map(([id, value]) => this.setStateAsync(id, value, true)));
    }
}

if (require.main === module) new EnergyPreview();
else module.exports = options => new EnergyPreview(options);
