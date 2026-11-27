'use strict';

const hourMs = 3600000;
const maxGapMs = 180000;

function localDay(now, zone = 'Europe/Berlin') {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function dayBoundary(from, to, nextDay, zone) {
    while (to - from > 1) {
        const middle = Math.floor((from + to) / 2);
        if (localDay(middle, zone) === nextDay) to = middle;
        else from = middle;
    }
    return to;
}

function accumulate(previous, devices, now, tariffCt, zone = 'Europe/Berlin', priceSlot = null, priceEnd = null) {
    const day = localDay(now, zone);
    const old = previous || {};
    const days = { ...old.days };
    const deviceDays = { ...old.deviceDays };
    const dailyDevices = new Map();
    const hourly = { ...old.hourly };
    const meters = Object.create(null);
    const hour = Math.floor(now / hourMs) * hourMs;
    const boundaries = new Map();

    function dailyEntry(date) {
        return days[date] = { kWh: 0, costEUR: 0, pricedKWh: 0, ...days[date] };
    }

    dailyEntry(day);
    for (const device of devices) {
        if (!Number.isFinite(device.energyKWh) || device.energyKWh < 0) continue;
        const prior = Object.hasOwn(old.meters || {}, device.id) ? old.meters[device.id] : null;
        meters[device.id] = { value: device.energyKWh, ts: now, day, meterId: device.meterId, exclude: device.exclude };
        if (!prior || device.exclude || prior.exclude || prior.meterId !== device.meterId ||
            now - prior.ts > maxGapMs || now <= prior.ts || device.energyKWh < prior.value) continue;

        const delta = device.energyKWh - prior.value;
        const crossesDay = prior.day !== day;
        if (crossesDay && !boundaries.has(prior.ts)) boundaries.set(prior.ts, dayBoundary(prior.ts, now, day, zone));
        const midnight = boundaries.get(prior.ts);
        const sameRate = Number.isFinite(tariffCt) && old.tariffCt === tariffCt;
        const contiguous = Number.isFinite(priceSlot) && old.priceEnd === priceSlot &&
            priceSlot >= prior.ts && priceSlot <= now;
        const constantRate = sameRate && (old.priceSlot === priceSlot || contiguous);
        const cuts = [...new Set([prior.ts, now, midnight, contiguous ? priceSlot : null])]
            .filter(cut => Number.isFinite(cut) && cut >= prior.ts && cut <= now).sort((a, b) => a - b);

        for (let index = 1; index < cuts.length; index++) {
            const from = cuts[index - 1];
            const energy = delta * ((cuts[index] - from) / (now - prior.ts));
            const rate = constantRate ? tariffCt : contiguous ? (from < priceSlot ? old.tariffCt : tariffCt) : null;
            const isPriced = Number.isFinite(rate);
            const cost = isPriced ? energy * rate / 100 : 0;
            const date = crossesDay && from < midnight ? prior.day : day;
            const entry = dailyEntry(date);
            entry.kWh += energy;
            entry.costEUR += cost;
            if (isPriced) entry.pricedKWh += energy;
            if ((crossesDay || contiguous && !constantRate) && energy > 0) {
                entry.estimatedKWh = (entry.estimatedKWh || 0) + energy;
            }

            if (!dailyDevices.has(date)) dailyDevices.set(date, new Map(Object.entries(deviceDays[date] || {})));
            const records = dailyDevices.get(date);
            const key = device.aliasKey || device.id;
            const existing = records.get(key);
            records.set(key, {
                name: device.name || device.id, room: device.room || '',
                kWh: (existing?.kWh || 0) + energy,
                pricedKWh: (existing?.pricedKWh || 0) + (isPriced ? energy : 0),
                costEUR: (existing?.costEUR || 0) + cost,
            });
        }
        if (Math.floor(prior.ts / hourMs) * hourMs === hour) hourly[hour] = (hourly[hour] || 0) + delta;
    }

    const keys = Object.keys(days).sort();
    while (keys.length > 400) delete days[keys.shift()];
    for (const [date, records] of dailyDevices) deviceDays[date] = Object.fromEntries(records);
    for (const date of Object.keys(deviceDays)) {
        if (!Object.hasOwn(days, date)) delete deviceDays[date];
    }
    for (const key of Object.keys(hourly)) {
        if (Number(key) < hour - 7 * 24 * hourMs) delete hourly[key];
    }
    return { meters, days, tariffCt, day, priceSlot, priceEnd, deviceDays, hourly };
}

module.exports = accumulate;
module.exports.localDay = localDay;

// Older ledgers created zero-valued daily entries before any counter delta was recorded.
module.exports.recordedKWh = function recordedKWh(ledger, day) {
    const kWh = ledger.days?.[day]?.kWh;
    const hasMeasurement = Object.keys(ledger.deviceDays?.[day] || {}).length > 0;
    return Number.isFinite(kWh) && (kWh > 0 || (kWh === 0 && hasMeasurement)) ? kWh : null;
};
