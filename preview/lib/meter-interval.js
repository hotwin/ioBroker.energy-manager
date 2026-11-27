'use strict';

const validReading = reading => typeof reading?.id === 'string' &&
    Number.isFinite(reading.ts) && Number.isFinite(reading.kWh) && reading.kWh >= 0;

/**
 * Preserve a counter delta independently of whether it can be assigned to a day or price.
 * The caller must persist the baseline and choose mutually exclusive sources for totals.
 */
function meterInterval(previous, reading, localDay, priceInterval, jitterKWh = 0) {
    if (!validReading(reading)) return { baseline: previous, status: 'invalid' };
    if (!validReading(previous) || previous.id !== reading.id) {
        return { baseline: reading, status: 'baseline' };
    }
    if (reading.ts <= previous.ts) return { baseline: previous, status: 'outOfOrder' };
    if (reading.kWh < previous.kWh) {
        const drop = previous.kWh - reading.kWh;
        if (drop <= jitterKWh) return { baseline: previous, status: 'jitter' };
        return { baseline: reading, status: 'reset' };
    }

    const kWh = reading.kWh - previous.kWh;
    const day = localDay(previous.ts);
    const rate = priceInterval?.ctPerKWh;
    const priced = Number.isFinite(rate) && priceInterval.start <= previous.ts &&
        reading.ts <= priceInterval.end;
    return {
        baseline: reading,
        status: 'measured',
        kWh,
        day: day === localDay(reading.ts) ? day : null,
        costEUR: priced ? kWh * rate / 100 : null,
    };
}

module.exports = { meterInterval };
