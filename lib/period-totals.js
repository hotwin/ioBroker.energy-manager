'use strict';

const { recordedKWh } = require('./consumption');
const { historyKey } = require('./daily-history');

const metrics = {
    energy: ['Recorded consumption', 'kWh'],
    cost: ['Recorded variable cost', 'EUR'],
    measuredDays: ['Days with consumption measurements', undefined],
    pricedDays: ['Days with recorded variable costs', undefined],
};

function periodRanges(day) {
    const date = new Date(day + 'T00:00:00Z');
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const monday = date.getUTCDate() - (date.getUTCDay() + 6) % 7;
    const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
    const week = iso(year, month, monday);
    const monthStart = iso(year, month, 1);
    const yearStart = iso(year, 0, 1);
    return {
        currentWeek: [week, day + '~'],
        previousWeek: [iso(year, month, monday - 7), week],
        currentMonth: [monthStart, day + '~'],
        previousMonth: [iso(year, month - 1, 1), monthStart],
        currentYear: [yearStart, day + '~'],
        previousYear: [iso(year - 1, 0, 1), yearStart],
    };
}

function emptyPeriods(ranges) {
    return Object.fromEntries(Object.keys(ranges).map(period =>
        [period, { energy: null, cost: null, measuredDays: 0, pricedDays: 0 }]));
}

function summarizePeriods(ledger, ranges = periodRanges(ledger.day)) {
    const groups = new Map();
    function group(id, name) {
        if (!groups.has(id)) {
            groups.set(id, { name, periods: emptyPeriods(ranges) });
        }
        return groups.get(id);
    }
    function add(target, periods, energy, cost) {
        for (const period of periods) {
            const summary = target.periods[period];
            if (Number.isFinite(energy)) {
                summary.energy = (summary.energy ?? 0) + energy;
                summary.measuredDays++;
            }
            if (Number.isFinite(cost)) {
                summary.cost = (summary.cost ?? 0) + cost;
                summary.pricedDays++;
            }
        }
    }
    const total = group('total', 'Total');
    for (const day of Object.keys(ledger.days).sort()) {
        const periods = Object.keys(ranges).filter(period => day >= ranges[period][0] && day < ranges[period][1]);
        if (!periods.length) continue;
        const entry = ledger.days[day];
        add(total, periods, recordedKWh(ledger, day), entry?.pricedKWh > 0 ? entry.costEUR : null);
        const rooms = new Map();
        for (const [key, device] of Object.entries(ledger.deviceDays?.[day] || {})) {
            if (!Number.isFinite(device?.kWh)) continue;
            const cost = device.pricedKWh > 0 && Number.isFinite(device.costEUR) ? device.costEUR : null;
            const target = group('devices.' + historyKey(key), device.name || key);
            target.name = device.name || key;
            add(target, periods, device.kWh, cost);
            if (typeof device.room !== 'string') continue;
            const room = rooms.get(device.room) ?? { energy: 0, cost: null };
            room.energy += device.kWh;
            if (cost !== null) room.cost = (room.cost ?? 0) + cost;
            rooms.set(device.room, room);
        }
        for (const [name, room] of rooms) {
            add(group('rooms.' + historyKey(name), name || 'Unassigned'), periods, room.energy, room.cost);
        }
    }
    return groups;
}

async function publishPeriods(adapter, ledger) {
    const names = adapter.periodObjectNames ??= new Map();
    for (const folder of ['periods', 'periods.devices', 'periods.rooms']) {
        if (names.has(folder)) continue;
        await adapter.setObjectNotExistsAsync(folder, {
            type: 'folder', common: { name: folder.split('.').at(-1) }, native: {},
        });
        names.set(folder, folder);
    }
    if (!adapter.periodGroups) {
        const prefix = adapter.namespace + '.periods.';
        const existing = await adapter.getObjectViewAsync('system', 'channel', {
            startkey: prefix, endkey: prefix + '\u9999',
        });
        adapter.periodGroups = new Set(existing.rows.map(row => row.id.slice(prefix.length))
            .filter(id => /^(devices|rooms)\.[a-f0-9]{24}\.currentYear$/.test(id))
            .map(id => id.slice(0, -'.currentYear'.length)));
    }
    const groups = summarizePeriods(ledger);
    for (const groupId of adapter.periodGroups) {
        if (adapter.stopping) return;
        if (groups.has(groupId)) continue;
        for (const [period, values] of Object.entries(emptyPeriods(periodRanges(ledger.day)))) {
            await Promise.all(Object.entries(values).map(([key, value]) =>
                adapter.setStateChangedAsync('periods.' + groupId + '.' + period + '.' + key, value, true)));
        }
        adapter.periodGroups.delete(groupId);
    }
    for (const [groupId, group] of groups) {
        adapter.periodGroups.add(groupId);
        await publishGroup(adapter, 'periods.' + groupId, group, names);
    }
}

async function publishGroup(adapter, prefix, group, names) {
    if (adapter.stopping) return;
    if (names.get(prefix) !== group.name) {
        await adapter.setObjectNotExistsAsync(prefix, { type: 'folder', common: { name: group.name }, native: {} });
        await adapter.extendObjectAsync(prefix, { common: { name: group.name } });
        names.set(prefix, group.name);
    }
    for (const [period, values] of Object.entries(group.periods)) {
        const channel = prefix + '.' + period;
        if (!names.has(channel)) {
            await adapter.setObjectNotExistsAsync(channel, { type: 'channel', common: { name: period }, native: {} });
            for (const [key, [name, unit]] of Object.entries(metrics)) {
                await adapter.setObjectNotExistsAsync(channel + '.' + key, {
                    type: 'state', common: { name, type: 'number', role: 'value', ...(unit && { unit }), read: true, write: false },
                    native: {},
                });
            }
            names.set(channel, period);
        }
        await Promise.all(Object.entries(values).map(([key, value]) =>
            adapter.setStateChangedAsync(channel + '.' + key, value, true)));
    }
}

async function publishMonthlyArchive(adapter, ledger) {
    const days = Object.keys(ledger.days).sort();
    if (!adapter.monthlyArchive) {
        const archive = new Map();
        const saved = await adapter.getStatesAsync('archive.*.summary');
        for (const [id, state] of Object.entries(saved)) {
            const month = id.match(/\.archive\.(\d{4}-\d{2})\.summary$/)?.[1];
            if (!month || typeof state?.val !== 'string') continue;
            try {
                const groups = JSON.parse(state.val);
                if (Array.isArray(groups)) archive.set(month, state.val);
            } catch {
                adapter.log.warn('Invalid monthly archive for ' + month);
            }
        }
        await adapter.setObjectNotExistsAsync('archive', { type: 'folder', common: { name: 'Monthly archive' }, native: {} });
        adapter.monthlyArchive = archive;
    }

    const months = new Set(days.map(day => day.slice(0, 7)));
    for (const month of months) {
        if (adapter.stopping) break;
        const old = adapter.monthlyArchive.get(month);
        // Keep the last published total once daily pruning reaches this month.
        if (old && days.length >= 400 && days[0].startsWith(month) && !days[0].endsWith('-01')) continue;
        const groups = summarizePeriods(ledger, { totals: [month + '-01', month + '-32'] });
        const pricedEnergy = new Map();
        for (const day of days.filter(day => day.startsWith(month))) {
            for (const [key, device] of Object.entries(ledger.deviceDays?.[day] || {})) {
                if (!(device?.pricedKWh > 0)) continue;
                const id = 'devices.' + historyKey(key);
                pricedEnergy.set(id, (pricedEnergy.get(id) || 0) + device.pricedKWh);
            }
        }
        const data = JSON.stringify([...groups].filter(([, group]) => group.periods.totals.measuredDays > 0)
            .map(([id, group]) => [id, { ...group, pricedEnergy: pricedEnergy.get(id) || 0 }]));
        if (data === '[]' || data === old) continue;
        const prefix = 'archive.' + month;
        for (const [suffix, name] of [['', month], ['.devices', 'Devices'], ['.rooms', 'Rooms']]) {
            await adapter.setObjectNotExistsAsync(prefix + suffix, { type: 'folder', common: { name }, native: {} });
        }
        for (const [id, group] of JSON.parse(data)) await publishGroup(adapter, prefix + '.' + id, group, adapter.periodObjectNames);
        await adapter.setObjectNotExistsAsync(prefix + '.summary', {
            type: 'state', common: { name: 'Monthly archive index', type: 'string', role: 'json', read: true, write: false }, native: {},
        });
        await adapter.setStateChangedAsync(prefix + '.summary', data, true);
        adapter.monthlyArchive.set(month, data);
    }
    return Object.fromEntries([...adapter.monthlyArchive].map(([month, data]) => [
        month, JSON.parse(data).filter(([id]) => id.startsWith('devices.')).map(([, group]) => ({ name: group.name, ...group.periods.totals,
            coverage: group.periods.totals.energy > 0 ? (group.pricedEnergy ?? 0) / group.periods.totals.energy * 100 : null })),
    ]));
}

module.exports = { publishPeriods, publishMonthlyArchive, summarizePeriods };
