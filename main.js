'use strict';

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

const states = {
    snapshot: ['Energy snapshot', 'string', 'json'],
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
        const [devices, meter, solar] = await Promise.all([
            readDevices(this),
            readDevices.readHouseMeter(this),
            readDevices.readSolar(this),
        ]);
        if (this.stopping) return;
        const difference = meter && this.config.compareHousePower === true
            ? await readDevices.unassignedPower(this, meter, devices, Date.now()) : null;
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
        const display = {
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
                daily: ledger.days, deviceDays: ledger.deviceDays, hourly: ledger.hourly,
                priceHistory: Object.values(ledger.priceHistory), contract, rooms: [...rooms.values()] }),
        };
        await Promise.all(Object.entries(display).map(([id, value]) => this.setStateAsync(id, value, true)));
    }
}

if (require.main === module) new EnergyManager();
else module.exports = options => new EnergyManager(options);
