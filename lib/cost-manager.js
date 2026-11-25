'use strict';

const { localDay, recordedKWh } = require('./consumption');

const DAY = 86400000;
const dayOffset = (day, offset) => new Date(Date.parse(day + 'T00:00:00Z') + offset * DAY).toISOString().slice(0, 10);
const countDays = (from, to) => (Date.parse(to) - Date.parse(from)) / DAY + 1;

function dailyRecord(ledger, day) {
    const energy = recordedKWh(ledger, day);
    if (!Number.isFinite(energy) || energy < 0) return null;
    const item = ledger.days[day];
    const priced = Number.isFinite(item.pricedKWh) && item.pricedKWh > 0 ? Math.min(energy, item.pricedKWh) : 0;
    return { day, kWh: energy, pricedKWh: priced, costEUR: priced > 0 && Number.isFinite(item.costEUR) ? item.costEUR : null };
}

function summarize(records) {
    const kWh = records.reduce((sum, item) => sum + item.kWh, 0);
    const priced = records.filter(item => item.costEUR !== null);
    const pricedKWh = priced.reduce((sum, item) => sum + item.pricedKWh, 0);
    return { days: records.length, kWh: records.length ? kWh : null, pricedKWh,
        variableEUR: priced.length ? priced.reduce((sum, item) => sum + item.costEUR, 0) : null,
        coverage: kWh > 0 ? Math.min(1, pricedKWh / kWh) : null };
}

function costManager(ledger, contract, now) {
    const today = localDay(now);
    const monthStart = today.slice(0, 7) + '-01';
    const yearStart = today.slice(0, 4) + '-01-01';
    const yearEnd = today.slice(0, 4) + '-12-31';
    const monthDate = new Date(monthStart + 'T00:00:00Z');
    monthDate.setUTCMonth(monthDate.getUTCMonth() + 1);
    const monthEnd = dayOffset(monthDate.toISOString().slice(0, 10), -1);
    const monthDays = countDays(monthStart, monthEnd);
    const yearDays = countDays(yearStart, yearEnd);
    const records = Object.keys(ledger.days || {}).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= today)
        .map(day => dailyRecord(ledger, day)).filter(Boolean);
    const month = summarize(records.filter(item => item.day >= monthStart));
    const year = summarize(records.filter(item => item.day >= yearStart));
    const sample = summarize(records.filter(item => item.day < today && item.day >= dayOffset(today, -30) &&
        (!contract.start || item.day >= contract.start)));
    // Recorded days can be incomplete even when the price coverage is high.
    // Exclude today's partial day and require seven recorded days and 95% price coverage.
    const fixed = contract.configured && !['inactive','future','incomplete','unsupported'].includes(contract.status) &&
        (!contract.start || contract.start <= today) && Number.isFinite(contract.fixedMonthlyGross)
        ? contract.fixedMonthlyGross : null;
    const advance = Number.isFinite(contract.advanceMonthly) ? contract.advanceMonthly : null;
    const dailyCost = sample.days >= 7 && sample.coverage >= 0.95 ? sample.variableEUR / sample.days : null;
    const dailyEnergy = sample.days >= 7 ? sample.kWh / sample.days : null;
    const monthForecast = dailyCost !== null && fixed !== null ? dailyCost * monthDays + fixed : null;
    const yearForecast = dailyCost !== null && fixed !== null ? dailyCost * yearDays + fixed * 12 : null;
    return { today: dailyRecord(ledger, today), month, year, sample, monthDays, yearDays, fixedMonthly: fixed, advanceMonthly: advance,
        monthForecast, yearForecast, monthEnergyForecast: dailyEnergy === null ? null : dailyEnergy * monthDays,
        annualEnergyForecast: dailyEnergy === null ? null : dailyEnergy * yearDays,
        monthBalance: monthForecast !== null && advance !== null ? advance - monthForecast : null,
        annualBalance: yearForecast !== null && advance !== null ? advance * 12 - yearForecast : null,
        seven: Array.from({ length: 7 }, (_, index) => {
            const day = dayOffset(today, index - 6);
            return dailyRecord(ledger, day) || { day, kWh: null, pricedKWh: null, costEUR: null };
        }) };
}

module.exports = costManager;
