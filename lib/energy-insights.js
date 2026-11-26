'use strict';

const { localDay, recordedKWh } = require('./consumption');

function cheapestWindow(prices, now, duration) {
    const intervals = prices.filter(item => Number.isFinite(item.start_timestamp) &&
        Number.isFinite(item.end_timestamp) && item.start_timestamp >= now &&
        item.end_timestamp <= now + 24 * 3600000 && item.end_timestamp > item.start_timestamp &&
        Number.isFinite(item.tariffCt)).sort((a, b) => a.start_timestamp - b.start_timestamp);
    let best = null;
    for (let start = 0; start < intervals.length; start++) {
        const from = intervals[start].start_timestamp;
        const to = from + duration;
        let cursor = from;
        let weighted = 0;
        for (let index = start; index < intervals.length && cursor < to; index++) {
            const item = intervals[index];
            if (item.start_timestamp !== cursor) break;
            const end = Math.min(to, item.end_timestamp);
            weighted += (end - cursor) * item.tariffCt;
            cursor = end;
        }
        if (cursor !== to) continue;
        const rate = weighted / duration;
        if (!best || rate < best.rate) best = { from, to, rate };
    }
    return best;
}

function energyInsights(ledger, prices, now) {
    const date = new Date(localDay(now) + 'T12:00:00Z');
    const dayBefore = () => {
        date.setUTCDate(date.getUTCDate() - 1);
        return date.toISOString().slice(0, 10);
    };
    const readDay = day => recordedKWh(ledger, day);

    const yesterday = dayBefore();
    const kWh = readDay(yesterday);
    const samples = Array.from({ length: 7 }, () => readDay(dayBefore())).filter(value => value !== null);
    let comparison = null;
    if (kWh !== null && samples.length >= 3) {
        const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        const difference = kWh - average;
        // Use both a relative and an absolute threshold to suppress small fluctuations.
        const threshold = Math.max(0.5, average * 0.25);
        const trend = difference >= threshold ? 'high' : difference <= -threshold ? 'low' : 'usual';
        comparison = { yesterday, kWh, average, difference, trend, days: samples.length };
    }

    const cheapest = prices.filter(item => item.start_timestamp >= now &&
        item.end_timestamp <= now + 24 * 3600000 && Number.isFinite(item.tariffCt))
        .reduce((best, item) => !best || item.tariffCt < best.tariffCt ||
            (item.tariffCt === best.tariffCt && item.start_timestamp < best.start_timestamp) ? item : best, null);
    return {
        comparison,
        cheapestTwoHours: cheapestWindow(prices, now, 2 * 3600000),
        cheapest: cheapest && { from: cheapest.start_timestamp, to: cheapest.end_timestamp, rate: cheapest.tariffCt },
    };
}

module.exports = energyInsights;
