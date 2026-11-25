'use strict';

const utils = require('@iobroker/adapter-core');
const accumulate = require('./lib/consumption');
const readDevices = require('./lib/sources');
const { summarizeEnergy, analyzeEnergy } = require('./lib/energy-ai');
const calculateTariff = require('./lib/tariff');
const { version } = require('./package.json');

const states = {
    'info.connection': ['Local source access', 'boolean', 'indicator.connected'],
    snapshot: ['Energy snapshot', 'string', 'json'],
    totalPower: ['Measured power', 'number', 'value.power', 'W'],
    consumption: ['Daily consumption ledger', 'string', 'json'],
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
        await this.setObjectNotExistsAsync('info', { type: 'channel', common: { name: 'Adapter information' }, native: {} });
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
        await this.setStateAsync('info.connection', false, true);
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
        this.aiRequest?.abort();
        await this.aiPending;
        await this.pending;
        await this.setStateAsync('info.connection', false, true).catch(() => {});
    }

    async refreshPrices() {
        if (this.stopping || Date.now() < (this.nextPricePoll || 0)) return;
        this.nextPricePoll = Date.now() + 60000;
        this.priceRequest = new AbortController();
        const timeout = this.setTimeout(() => this.priceRequest?.abort(), 5000);
        try {
            const response = await fetch('https://api.awattar.de/v1/marketdata', { signal: this.priceRequest.signal });
            if (!response.ok) throw Error('HTTP ' + response.status);
            const { data } = await response.json();
            if (!Array.isArray(data)) throw Error('Invalid price data');
            this.prices = data.filter(item => Number.isFinite(item?.marketprice) &&
                Number.isFinite(item.start_timestamp) && Number.isFinite(item.end_timestamp) &&
                item.end_timestamp > item.start_timestamp).sort((a, b) => a.start_timestamp - b.start_timestamp);
            this.nextPricePoll = Date.now() + 900000;
        } catch (error) {
            if (!this.stopping) this.log.warn('aWATTar: ' + error.message);
        } finally {
            this.clearTimeout(timeout);
            this.priceRequest = null;
        }
    }

    refreshEnergyAnalysis(ledger, prices, now) {
        if (!this.config.aiEnabled || this.stopping || this.aiPending || now < (this.nextAiPoll || 0)) return;
        const facts = summarizeEnergy(ledger, prices, now);
        if (facts.yesterday.kWh === null && !facts.cheapestUpcomingGrossRate) {
            this.aiAnalysis = { status: 'aiNoData' };
            return;
        }
        this.nextAiPoll = now + 3600000;
        this.aiAnalysis = { ...this.aiAnalysis, status: 'aiLoading' };
        const request = new AbortController();
        this.aiRequest = request;
        const timeout = this.setTimeout(() => request.abort(), 60000);
        this.aiPending = analyzeEnergy(this.config, facts, request.signal)
            .then(text => { this.aiAnalysis = { status: 'aiReady', text, ts: Date.now() }; })
            .catch(() => { this.aiAnalysis = { ...this.aiAnalysis, status: 'aiError' }; })
            .finally(() => {
                this.clearTimeout(timeout);
                this.aiRequest = null;
                this.aiPending = null;
            });
    }

    async collect() {
        await this.refreshPrices();
        if (this.stopping) return;
        const devices = await readDevices(this);
        if (this.stopping) return;
        const now = Date.now();
        const priceDay = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
        });
        const prices = (this.prices || []).map(item => ({
            ...item,
            tariffCt: calculateTariff(this.config, item.marketprice / 10, priceDay.format(item.start_timestamp)).tariffCt,
        }));
        const current = prices.find(item => item.start_timestamp <= now && item.end_timestamp > now);
        const marketCt = current ? current.marketprice / 10 : null;
        const { contract, tariffCt } = calculateTariff(this.config, marketCt, accumulate.localDay(now));
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
        const ledger = accumulate(this.ledger, devices, now, tariffCt, 'Europe/Berlin', current?.start_timestamp ?? null);
        const priceHistory = new Map(Object.entries(this.ledger?.priceHistory || {}));
        for (const item of prices) {
            const key = String(item.start_timestamp);
            if (item.end_timestamp > now || !priceHistory.has(key)) priceHistory.set(key, item);
        }
        const cutoff = now - 7 * 86400000;
        ledger.priceHistory = Object.fromEntries([...priceHistory].filter(([, item]) => item.end_timestamp > cutoff));
        await this.setStateAsync('consumption', JSON.stringify(ledger), true);
        this.ledger = ledger;
        this.refreshEnergyAnalysis(ledger, prices, now);
        const today = ledger.days[ledger.day];
        const show = (value, unit) => Number.isFinite(value) ? value.toFixed(2) + ' ' + unit : '–';
        const display = {
            displayPower: Math.abs(totalPower) >= 1000 ? show(totalPower / 1000, 'kW') : show(totalPower, 'W'),
            displayToday: show(today.kWh, 'kWh'),
            displayMarket: show(marketCt, 'ct/kWh'),
            displayTariff: show(tariffCt, 'ct/kWh'),
            displayCost: today.pricedKWh > 0 ? show(today.costEUR, 'EUR') : '–',
            totalPower,
            snapshot: JSON.stringify({ ts: now, version, devices, totalPower, marketCt, tariffCt,
                prices: prices.filter(item => item.end_timestamp > now),
                daily: ledger.days, deviceDays: ledger.deviceDays, hourly: ledger.hourly,
                priceHistory: Object.values(ledger.priceHistory), contract,
                energyAnalysis: this.config.aiEnabled ? this.aiAnalysis : undefined, rooms: [...rooms.values()] }),
        };
        await Promise.all(Object.entries(display).map(([id, value]) => this.setStateAsync(id, value, true)));
    }
}

if (require.main === module) new EnergyManager();
else module.exports = options => new EnergyManager(options);
