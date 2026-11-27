'use strict';

const { historyKey, syncDailyHistory, storeLiveHistory } = require('./lib/daily-history');
const { publishPeriods, publishMonthlyArchive } = require('./lib/period-totals');
const MeasurementCache = require('./lib/measurement-cache');
const utils = require('@iobroker/adapter-core');
const accumulate = require('./lib/consumption');
const readDevices = require('./lib/sources');
const energyInsights = require('./lib/energy-insights');
const costManager = require('./lib/cost-manager');
const { priceSnapshot, normalizePriceFeed, normalizeEnergyCharts, marketFeed } = require('./lib/prices');
const { version } = require('./package.json');
const { instanceObjects } = require('./io-package.json');

const priceRetryMs = 60_000;
const priceRefreshMs = 900_000;

const historyStates = {
    power: ['Current power', 'value.power', 'W'],
    todayEnergy: ['Energy today', 'value', 'kWh'],
    todayCost: ['Recorded variable cost today', 'value', 'EUR'],
};

const states = {
    snapshot: ['Energy snapshot', 'string', 'json'],
    todayEnergy: ['Energy today', 'number', 'value', 'kWh'],
    todayCost: ['Recorded variable cost today', 'number', 'value', 'EUR'],
    currentMarketPrice: ['Current market price', 'number', 'value', 'ct/kWh'],
    currentGrossPrice: ['Current gross energy rate', 'number', 'value', 'ct/kWh'],
    houseMeterEnergy: ['Main meter reading', 'number', 'value', 'kWh'],
    totalPower: ['Measured power', 'number', 'value.power', 'W'],
    consumption: ['Daily consumption ledger', 'string', 'json'],
    costSummary: ['Cost manager summary', 'string', 'json'],
    'info.marketPriceAvailable': ['Market price source available', 'boolean', 'indicator'],
    energyInsights: ['Energy insights for scripts', 'string', 'json'],
    displayPower: ['Current power', 'string', 'text'],
    displayToday: ['Consumption today', 'string', 'text'],
    displayMarket: ['Market price', 'string', 'text'],
    displayTariff: ['Contract tariff', 'string', 'text'],
    displayCost: ['Recorded variable cost', 'string', 'text'],
};

class EnergyManager extends utils.Adapter {
    constructor(options = {}) {
        super({ ...options, name: 'hotwin-energy-manager' });
        this.measurements = new MeasurementCache(this);
        this.on('objectChange', id => this.measurements.invalidate(id));
        this.on('stateChange', (id, state) => this.measurements.update(id, state));
        this.on('ready', () => {
            this.pending = this.start().catch(error => this.log.error(String(error)));
        });
        this.on('unload', callback => void this.unloadAdapter().finally(callback));
    }

    async start() {
        for (const { _id, ...definition } of instanceObjects) {
            await this.setObjectNotExistsAsync(_id, definition);
        }
        for (const [id, [name, type, role, unit]] of Object.entries(states)) {
            await this.setObjectNotExistsAsync(id, {
                type: 'state', common: { name, type, role, ...(unit && { unit }), read: true, write: false }, native: {},
            });
        }
        try {
            this.ledger = JSON.parse((await this.getStateAsync('consumption'))?.val || 'null');
        } catch {
            this.ledger = null;
        }
        for (const id of ['devices', 'rooms']) {
            await this.setObjectNotExistsAsync(id, { type: 'folder', common: { name: id }, native: {} });
        }
        const oldChannels = await this.getObjectViewAsync('system', 'channel', {
            startkey: this.namespace + '.', endkey: this.namespace + '.\u9999',
        });
        this.historyObjects = new Map(oldChannels.rows
            .map(row => row.id.slice(this.namespace.length + 1))
            .filter(id => /^(devices|rooms)\.[a-f0-9]{24}$/.test(id))
            .map(id => [id, null]));
        await this.subscribeForeignObjectsAsync('*');
        await this.clearStatus();
        if (!this.stopping) await this.poll();
    }

    async poll() {
        try {
            await this.collect();
            if (!this.stopping) await this.setStateAsync('info.connection', true, true);
        } catch (error) {
            if (!this.stopping) {
                this.log.warn(String(error));
                await this.setStateAsync('info.connection', false, true).catch(() => {});
            }
        } finally {
            if (!this.stopping) {
                this.timer = this.setTimeout(() => {
                    this.timer = null;
                    this.pending = this.poll();
                }, 30000);
            }
        }
    }

    async unloadAdapter() {
        this.stopping = true;
        if (this.timer) this.clearTimeout(this.timer);
        this.priceRequest?.abort();
        await this.pending;
        await this.dailyHistoryTask;
        await this.liveHistoryTask;
        await this.clearStatus().catch(() => {});
    }

    async clearStatus() {
        await Promise.all(['info.connection', 'info.awattarAvailable', 'info.marketPriceAvailable'].map(id => this.setStateAsync(id, false, true)));
    }

    async readExternalPrices() {
        const id = this.config.marketPriceStateId?.trim();
        if (!id) return { status: 'notConfigured', prices: [] };
        try {
            const state = await this.getForeignStateAsync(id);
            if (!state) return { status: 'missing', prices: [] };
            if (state.q) return { status: 'unavailable', prices: [] };
            if (typeof state.val !== 'string') return { status: 'invalid', prices: [] };
            const prices = normalizePriceFeed(JSON.parse(state.val));
            return { status: prices.length ? 'ready' : 'invalid', prices };
        } catch (error) {
            return { status: error instanceof SyntaxError ? 'invalid' : 'unavailable', prices: [] };
        }
    }

    async refreshPrices(provider) {
        if (this.stopping || Date.now() < (this.nextPricePoll || 0)) return;
        this.priceRequest = new AbortController();
        const timeout = this.setTimeout(() => this.priceRequest?.abort(), 5000);
        try {
            const response = await fetch(provider.url, { signal: this.priceRequest.signal });
            if (!response.ok) throw Error('HTTP ' + response.status);
            const payload = await response.json();
            const prices = provider.zone ? normalizeEnergyCharts(payload, provider.zone) : normalizePriceFeed(payload);
            if (prices.length === 0) throw Error('No valid price intervals');
            this.prices = prices;
            this.priceRetryDelay = priceRetryMs;
            this.nextPricePoll = Date.now() + priceRefreshMs;
        } catch (error) {
            const delay = this.priceRetryDelay ?? priceRetryMs;
            this.nextPricePoll = Date.now() + delay;
            this.priceRetryDelay = Math.min(delay * 2, priceRefreshMs);
            if (!this.stopping) this.log.warn(provider.name + ': ' + error.message);
        } finally {
            this.clearTimeout(timeout);
            this.priceRequest = null;
        }
    }

    async publishHistory(devices, rooms, ledger) {
        const day = ledger.deviceDays[ledger.day] || {};
        const roomTotals = new Map();
        for (const entry of Object.values(day)) {
            const totals = roomTotals.get(entry.room) || { energy: 0, cost: null };
            totals.energy += entry.kWh;
            if (entry.pricedKWh > 0) totals.cost = (totals.cost ?? 0) + entry.costEUR;
            roomTotals.set(entry.room, totals);
        }

        const entries = new Map();
        for (const device of devices) {
            const key = device.aliasKey || device.id;
            const entry = day[key];
            entries.set('devices.' + historyKey(key), {
                name: device.name,
                values: [device.powerW, entry?.kWh, entry?.pricedKWh > 0 ? entry.costEUR : null],
            });
        }
        for (const [key, room] of rooms) {
            const totals = roomTotals.get(key);
            entries.set('rooms.' + historyKey(key), {
                name: room.name || 'Unassigned',
                values: [room.powerW, totals?.energy, totals?.cost],
            });
        }

        const known = this.historyObjects ??= new Map();
        const values = {};
        for (const [id, entry] of entries) {
            if (known.get(id) !== entry.name) {
                await this.setObjectNotExistsAsync(id, { type: 'channel', common: { name: entry.name }, native: {} });
                await this.extendObjectAsync(id, { common: { name: entry.name } });
                for (const [state, [name, role, unit]] of Object.entries(historyStates)) {
                    await this.setObjectNotExistsAsync(id + '.' + state, {
                        type: 'state', common: { name, type: 'number', role, unit, read: true, write: false }, native: {},
                    });
                }
                known.set(id, entry.name);
            }
            await Promise.all(Object.keys(historyStates).map((state, index) => {
                const stateId = id + '.' + state;
                values[stateId] = entry.values[index] ?? null;
                return this.setStateChangedAsync(stateId, values[stateId], true);
            }));
        }
        for (const id of known.keys()) {
            if (entries.has(id)) continue;
            await Promise.all(Object.keys(historyStates).map(state => {
                const stateId = id + '.' + state;
                values[stateId] = null;
                return this.setStateChangedAsync(stateId, null, true);
            }));
            known.delete(id);
        }
        return values;
    }

    scheduleDailyHistory(ledger, target) {
        if (this.stopping || this.dailyHistoryTask || this.archivedDay === ledger.day ||
            Date.now() < (this.nextHistoryAttempt || 0)) return;
        this.nextHistoryAttempt = Date.now() + 300000;
        this.dailyHistoryTask = syncDailyHistory(this, ledger, target)
            .then(synced => {
                if (synced) this.archivedDay = ledger.day;
            })
            .catch(error => this.log.warn('Daily storage: ' + error.message))
            .finally(() => { this.dailyHistoryTask = null; });
    }

    async collect() {
        const externalPrices = this.config.marketPriceSource === 'state';
        const provider = marketFeed(this.config.marketPriceSource, Date.now());
        if (!externalPrices) await this.refreshPrices(provider);
        const externalFeed = externalPrices ? await this.readExternalPrices() : null;
        const feed = externalFeed ? externalFeed.prices : this.prices;
        if (this.stopping) return;
        const now = Date.now();
        const { prices, currentPrice, marketCt, tariffCt, contract } = priceSnapshot(this.config, feed, now);
        const marketSource = {
            external: externalPrices,
            ...(!externalPrices && { name: provider.name }),
            status: externalFeed && externalFeed.status !== 'ready' ? externalFeed.status : currentPrice ? 'ready' : 'noInterval',
            availableUntil: feed?.at(-1)?.end_timestamp ?? null,
        };
        await Promise.all([
            this.setStateAsync('info.awattarAvailable', !externalPrices && !provider.zone && Boolean(currentPrice), true),
            this.setStateAsync('info.marketPriceAvailable', Boolean(currentPrice), true),
        ]);
        this.measurements.requested.clear();
        const [devices, meter, solar] = await Promise.all([
            readDevices(this.measurements),
            readDevices.readHouseMeter(this.measurements),
            readDevices.readSolar(this.measurements),
        ]);
        if (this.stopping) return;
        const difference = meter && this.config.compareHousePower === true
            ? await readDevices.unassignedPower(this.measurements, meter, devices, Date.now()) : null;
        await this.measurements.finish();
        const houseMeter = difference ? { ...meter, ...difference } : meter;
        if (this.stopping) return;
        const rooms = new Map();
        let totalPower = null;
        for (const device of devices) {
            const room = rooms.get(device.room) || { name: device.room, devices: 0, powerW: null };
            room.devices++;
            if (!device.exclude && Number.isFinite(device.powerW)) {
                totalPower = (totalPower || 0) + device.powerW;
                room.powerW = (room.powerW || 0) + device.powerW;
            }
            rooms.set(device.room, room);
        }
        const ledger = accumulate(this.ledger, devices, now, tariffCt, 'Europe/Berlin', currentPrice?.start_timestamp ?? null);
        const priceHistory = new Map(Object.entries(this.ledger?.priceHistory || {}));
        for (const item of prices) {
            const key = String(item.start_timestamp);
            if (item.end_timestamp > now || !priceHistory.has(key)) priceHistory.set(key, item);
        }
        const cutoff = now - 7 * 86400000;
        ledger.priceHistory = Object.fromEntries([...priceHistory].filter(([, item]) => item.end_timestamp > cutoff));
        await this.setStateAsync('consumption', JSON.stringify(ledger), true);
        this.ledger = ledger;
        const today = ledger.days[ledger.day];
        const show = (value, unit) => Number.isFinite(value) ? value.toFixed(2) + ' ' + unit : '–';
        const costs = costManager(ledger, contract, now);
        const insights = energyInsights(ledger, prices, now);
        await publishPeriods(this, ledger);
        const monthlyArchive = await publishMonthlyArchive(this, ledger);
        const display = {
            todayEnergy: accumulate.recordedKWh(ledger, ledger.day),
            todayCost: today.pricedKWh > 0 ? today.costEUR : null,
            currentMarketPrice: marketCt,
            currentGrossPrice: tariffCt,
            houseMeterEnergy: houseMeter?.energyKWh ?? null,
            energyInsights: JSON.stringify(insights),
            costSummary: JSON.stringify(costs),
            displayPower: Math.abs(totalPower) >= 1000 ? show(totalPower / 1000, 'kW') : show(totalPower, 'W'),
            displayToday: show(accumulate.recordedKWh(ledger, ledger.day), 'kWh'),
            displayMarket: show(marketCt, 'ct/kWh'),
            displayTariff: show(tariffCt, 'ct/kWh'),
            displayCost: today.pricedKWh > 0 ? show(today.costEUR, 'EUR') : '–',
            totalPower,
            snapshot: JSON.stringify({ ts: now, version, devices, houseMeter, solar, totalPower, marketSource, marketCt, tariffCt, currentPrice,
                prices: prices.filter(item => item.end_timestamp > now),
                insights, costs,
                monthlyArchive, daily: ledger.days, deviceDays: ledger.deviceDays, hourly: ledger.hourly,
                priceHistory: Object.values(ledger.priceHistory), contract, rooms: [...rooms.values()] }),
        };
        await Promise.all(Object.entries(display).map(([id, value]) => this.setStateAsync(id, value, true)));
        const liveValues = await this.publishHistory(devices, rooms, ledger);
        const target = Object.hasOwn(this.config, 'storageInstance') ? this.config.storageInstance : 'history.0';
        if (typeof target !== 'string' || !/^(history|influxdb|sql)\.\d+$/.test(target) || this.stopping) return;
        this.scheduleDailyHistory(ledger, target);
        if (!this.liveHistoryTask) {
            this.liveHistoryTask = storeLiveHistory(this, target, now, {
                totalPower, todayEnergy: display.todayEnergy, todayCost: display.todayCost, ...liveValues,
            }).catch(error => this.log.warn('Live storage: ' + error.message))
                .finally(() => { this.liveHistoryTask = null; });
        }
    }
}

if (require.main === module) new EnergyManager();
else module.exports = options => new EnergyManager(options);
