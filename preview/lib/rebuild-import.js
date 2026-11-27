'use strict';

const { meterInterval } = require('./meter-interval');

// Copy the exported data. Only an explicitly matched physical meter may resume counting.
function importEnergyData(native, ledger, sources) {
    const baselines = new Map();
    for (const { id, meterId } of sources) {
        if (!meterId || !Object.hasOwn(ledger.meters ?? {}, id)) continue;
        const previous = ledger.meters[id];
        if (previous.meterId !== meterId || previous.exclude ||
            !Number.isFinite(previous.ts) || !Number.isFinite(previous.value) || previous.value < 0) continue;
        baselines.set(id, { id: meterId, ts: previous.ts, kWh: previous.value });
    }
    return {
        native: structuredClone(native),
        history: structuredClone(ledger),
        baselines,
        record(id, reading, localDay, priceInterval) {
            const result = meterInterval(baselines.get(id), reading, localDay, priceInterval);
            if (result.baseline) baselines.set(id, result.baseline);
            return result;
        },
    };
}

module.exports = { importEnergyData };
