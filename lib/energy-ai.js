'use strict';

const { localDay } = require('./consumption');

function summarizeEnergy(ledger, prices, now) {
    const today = localDay(now);
    const date = new Date(today + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - 1);
    const latestDay = date.toISOString().slice(0, 10);
    const readDay = day => {
        const value = ledger.days?.[day]?.kWh;
        // Older ledgers recorded zero even when no meter delta was observed.
        const hasDeviceReading = Object.keys(ledger.deviceDays?.[day] || {}).length > 0;
        return Number.isFinite(value) && (value > 0 || (value === 0 && hasDeviceReading)) ? value : null;
    };
    const recent = [];
    for (let index = 0; index < 7; index++) {
        date.setUTCDate(date.getUTCDate() - 1);
        const day = date.toISOString().slice(0, 10);
        const kWh = readDay(day);
        if (kWh !== null) recent.push({ day, kWh });
    }
    const berlinTime = new Intl.DateTimeFormat('de-DE', {
        timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset',
    });
    const rate = item => ({
        start: berlinTime.format(item.start_timestamp),
        end: berlinTime.format(item.end_timestamp),
        ctPerKWh: item.tariffCt,
    });
    const current = prices.find(item => item.start_timestamp <= now && item.end_timestamp > now);
    const cheapest = prices.filter(item => item.start_timestamp >= now &&
        item.end_timestamp <= now + 24 * 3600000 && Number.isFinite(item.tariffCt))
        .reduce((best, item) => !best || item.tariffCt < best.tariffCt ? item : best, null);
    const latestKWh = readDay(latestDay);
    const averageKWh = recent.length >= 3 ? recent.reduce((sum, entry) => sum + entry.kWh, 0) / recent.length : null;
    return {
        timeZone: 'Europe/Berlin',
        yesterday: { day: latestDay, kWh: latestKWh },
        priorDays: recent,
        priorAverageKWh: averageKWh,
        differenceKWh: latestKWh !== null && averageKWh !== null ? latestKWh - averageKWh : null,
        currentGrossRate: Number.isFinite(current?.tariffCt) ? rate(current) : null,
        cheapestUpcomingGrossRate: cheapest ? rate(cheapest) : null,
    };
}

async function analyzeEnergy(config, facts, signal) {
    const url = new URL(config.aiUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw Error('Invalid Ollama server URL');
    const model = config.aiModel?.trim();
    if (!model) throw Error('Missing Ollama model');
    const response = await fetch(new URL('/api/chat', url), {
        method: 'POST',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
            model, stream: false, options: { num_predict: 250, temperature: 0.2 },
            messages: [
                { role: 'system', content: 'Antworte auf Deutsch in maximal drei kurzen, verständlichen Sätzen. ' +
                    'Nutze ausschließlich die Mess- und Tarifdaten aus dem JSON. Vergleiche den gestrigen Verbrauch ' +
                    'anhand von priorAverageKWh und differenceKWh, wenn beide vorhanden sind. Fehlende Werte ' +
                    'sind keine Nullwerte. Nenne gegebenenfalls das günstigste verfügbare Tarifintervall in ' +
                    'Berliner Ortszeit. Unterstelle keine Ursache, keine Geräte und keine sichere Ersparnis. ' +
                    'Wenn Daten für eine Aussage fehlen, sage das.' },
                { role: 'user', content: JSON.stringify(facts) },
            ],
        }),
    });
    if (!response.ok) throw Error('Ollama HTTP ' + response.status);
    const result = await response.json();
    const text = result?.message?.content?.trim();
    if (!text) throw Error('Empty Ollama response');
    return text.slice(0, 1800);
}

module.exports = { summarizeEnergy, analyzeEnergy };
