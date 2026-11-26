'use strict';

const utils = require('@iobroker/adapter-core');
const accumulate = require('./lib/consumption');
const readDevices = require('./lib/sources');
const energyInsights = require('./lib/energy-insights');
const costManager = require('./lib/cost-manager');
const { priceSnapshot } = require('./lib/prices');
const { version } = require('./package.json');
const { instanceObjects } = require('./io-package.json');

const priceRetryMs = 60_000;
const priceRefreshMs = 900_000;

const states = {
    snapshot: ['Energy snapshot', 'string', 'json'],
    totalPower: ['Measured power', 'number', 'value.power', 'W'],
    consumption: ['Daily consumption ledger', 'string', 'json'],
    costSummary: ['Cost manager summary', 'string', 'json'],
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
        await Promise.all(['info.connection', 'info.awattarAvailable'].map(id => this.setStateAsync(id, false, true)));
    }

    async refreshPrices() {
        if (this.stopping || Date.now() < (this.nextPricePoll || 0)) return;
        this.priceRequest = new AbortController();
        const timeout = this.setTimeout(() => this.priceRequest?.abort(), 5000);
        try {
            const response = await fetch('https://api.awattar.de/v1/marketdata', { signal: this.priceRequest.signal });
            if (!response.ok) throw Error('HTTP ' + response.status);
            const { data } = await response.json();
            if (!Array.isArray(data)) throw Error('Invalid price data');
            const prices = data.filter(item => Number.isFinite(item?.marketprice) &&
                Number.isFinite(item.start_timestamp) && Number.isFinite(item.end_timestamp) &&
                item.end_timestamp > item.start_timestamp).sort((a, b) => a.start_timestamp - b.start_timestamp);
            if (prices.length === 0) throw Error('No valid price intervals');
            this.prices = prices;
            this.priceRetryDelay = priceRetryMs;
            this.nextPricePoll = Date.now() + priceRefreshMs;
        } catch (error) {
            const delay = this.priceRetryDelay ?? priceRetryMs;
            this.nextPricePoll = Date.now() + delay;
            this.priceRetryDelay = Math.min(delay * 2, priceRefreshMs);
            if (!this.stopping) this.log.warn('aWATTar: ' + error.message);
        } finally {
            this.clearTimeout(timeout);
            this.priceRequest = null;
        }
    }

    async collect() {
        await this.refreshPrices();
        if (this.stopping) return;
        const now = Date.now();
        const { prices, currentPrice, marketCt, tariffCt, contract } = priceSnapshot(this.config, this.prices, now);
        await this.setStateAsync('info.awattarAvailable', Boolean(currentPrice), true);
        const [devices, meter] = await Promise.all([
            readDevices(this),
            readDevices.readHouseMeter(this),
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
        const display = {
            costSummary: JSON.stringify(costs),
            displayPower: Math.abs(totalPower) >= 1000 ? show(totalPower / 1000, 'kW') : show(totalPower, 'W'),
            displayToday: show(accumulate.recordedKWh(ledger, ledger.day), 'kWh'),
            displayMarket: show(marketCt, 'ct/kWh'),
            displayTariff: show(tariffCt, 'ct/kWh'),
            displayCost: today.pricedKWh > 0 ? show(today.costEUR, 'EUR') : '–',
            totalPower,
            snapshot: JSON.stringify({ ts: now, version, devices, houseMeter, totalPower, marketCt, tariffCt, currentPrice,
                prices: prices.filter(item => item.end_timestamp > now),
                insights: energyInsights(ledger, prices, now), costs,
                daily: ledger.days, deviceDays: ledger.deviceDays, hourly: ledger.hourly,
                priceHistory: Object.values(ledger.priceHistory), contract, rooms: [...rooms.values()] }),
        };
        await Promise.all(Object.entries(display).map(([id, value]) => this.setStateAsync(id, value, true)));
    }
}

if (require.main === module) new EnergyManager();
else module.exports = options => new EnergyManager(options);
