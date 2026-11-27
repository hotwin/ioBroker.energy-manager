'use strict';

const { createHash } = require('node:crypto');
const { recordedKWh } = require('./consumption');

const fields = {
    energy: { name: 'Daily energy', unit: 'kWh' },
    cost: { name: 'Recorded variable cost per day', unit: 'EUR' },
};

function historyKey(key) {
    return createHash('sha256').update(key).digest('hex').slice(0, 24);
}

function dailySeries(ledger) {
    const series = new Map();
    function add(channel, name, metric, ts, value) {
        if (!Number.isFinite(value)) return;
        const id = channel + '.' + metric;
        if (!series.has(id)) series.set(id, { channel, name, metric, points: [] });
        series.get(id).points.push({ ts, val: value, ack: true });
    }

    for (const date of Object.keys(ledger.days).sort()) {
        if (date >= ledger.day || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        // Noon UTC stays within the recorded Berlin calendar day year-round.
        const ts = Date.parse(date + 'T12:00:00Z');
        if (!Number.isFinite(ts) || new Date(ts).toISOString().slice(0, 10) !== date) continue;
        const total = ledger.days[date];
        add('daily.total', 'Total', 'energy', ts, recordedKWh(ledger, date));
        if (total?.pricedKWh > 0) add('daily.total', 'Total', 'cost', ts, total.costEUR);

        const rooms = new Map();
        for (const [key, device] of Object.entries(ledger.deviceDays?.[date] || {})) {
            if (!device || !Number.isFinite(device.kWh)) continue;
            const channel = 'daily.devices.' + historyKey(key);
            const name = device.name || key;
            add(channel, name, 'energy', ts, device.kWh);
            const cost = device.pricedKWh > 0 && Number.isFinite(device.costEUR) ? device.costEUR : null;
            add(channel, name, 'cost', ts, cost);

            if (typeof device.room !== 'string') continue;
            const totals = rooms.get(device.room) || { energy: 0, cost: null };
            totals.energy += device.kWh;
            if (cost !== null) totals.cost = (totals.cost ?? 0) + cost;
            rooms.set(device.room, totals);
        }
        for (const [room, totals] of rooms) {
            const channel = 'daily.rooms.' + historyKey(room);
            add(channel, room || 'Unassigned', 'energy', ts, totals.energy);
            add(channel, room || 'Unassigned', 'cost', ts, totals.cost);
        }
    }
    return series;
}

async function syncDailyHistory(adapter, ledger) {
    const target = 'history.0';
    if ((await adapter.getForeignStateAsync('system.adapter.' + target + '.alive'))?.val !== true) return false;
    const series = dailySeries(ledger);
    if (!series.size) return true;
    for (const id of ['daily', 'daily.devices', 'daily.rooms']) {
        await adapter.setObjectNotExistsAsync(id, { type: 'folder', common: { name: id.split('.').at(-1) }, native: {} });
    }
    for (const [id, { channel, name, metric, points }] of series) {
        if (adapter.stopping) return false;
        await adapter.setObjectNotExistsAsync(channel, { type: 'channel', common: { name }, native: {} });
        await adapter.setObjectNotExistsAsync(id, {
            type: 'state', common: { ...fields[metric], type: 'number', role: 'value', read: true, write: false }, native: {},
        });
        const fullId = adapter.namespace + '.' + id;
        const response = await adapter.sendToAsync(target, 'getHistory', {
            id: fullId,
            options: { start: points[0].ts, end: points.at(-1).ts + 1, aggregate: 'none', removeBorderValues: true },
        }, { timeout: 5000 });
        if (response?.error || !Array.isArray(response?.result)) throw Error('Could not read History for ' + fullId);
        const saved = new Set(response.result.map(point => point.ts));
        const missing = points.filter(point => !saved.has(point.ts));
        if (!missing.length) continue;
        const result = await adapter.sendToAsync(target, 'storeState', {
            id: fullId, state: missing.map(point => ({ ...point, from: 'system.adapter.' + adapter.namespace })),
        }, { timeout: 5000 });
        if (!result || result.error || result.success === false) throw Error('Could not store History for ' + fullId);
    }
    return true;
}

module.exports = { historyKey, syncDailyHistory };
