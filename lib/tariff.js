'use strict';

const surchargeKeys = ['markupCt', 'electricityTaxCt', 'networkCt', 'concessionCt', 'leviesCt'];

function numeric(value) {
    if (typeof value === 'string') {
        const input = value.trim();
        if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(input)) return null;
        value = Number(input.replace(',', '.'));
    }
    return Number.isFinite(value) ? value : null;
}

function isDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function calculateTariff(config, marketCt, day) {
    const formula = config.tariffFormula || 'additive';
    const hourly = formula === 'awattarHourly';
    const surcharges = surchargeKeys.map(key => numeric(config[key]));
    const extraCt = surcharges.every(value => value !== null && value >= 0)
        ? surcharges.reduce((sum, value) => sum + value, 0)
        : null;
    const vatPercent = numeric(config.vatPercent);
    const vat = vatPercent !== null && vatPercent >= 0 && vatPercent <= 100 ? 1 + vatPercent / 100 : null;
    const start = config.contractStart || null;
    const configured = config.tariffConfigured === true;
    const base = numeric(config.baseMonthly);
    const meter = numeric(config.meterAnnual);
    const advance = numeric(config.advanceMonthly);
    const marketMarkup = numeric(config.marketMarkupPercent);
    const min = numeric(config.energyMinGrossCt);
    const max = numeric(config.energyMaxGrossCt);
    const invalidLimit = key => config[key] != null && config[key] !== '' && numeric(config[key]) === null;

    let status = 'available';
    if (!configured) status = 'inactive';
    else if (!hourly && formula !== 'additive') status = 'unsupported';
    else if (extraCt === null || vat === null || (start && !isDate(start)) ||
        (hourly && (marketMarkup === null || marketMarkup < 0 || marketMarkup > 100 ||
            invalidLimit('energyMinGrossCt') || invalidLimit('energyMaxGrossCt') ||
            (min !== null && max !== null && min > max)))) status = 'incomplete';
    else if (start && day < start) status = 'future';
    else if (!Number.isFinite(marketCt)) status = 'noMarket';

    let tariffCt = null;
    let breakdown = null;
    if (status === 'available') {
        const percentageCt = hourly ? Math.abs(marketCt) * marketMarkup / 100 : 0;
        const energyNet = marketCt + percentageCt;
        let energyGross = energyNet * vat;
        if (hourly) energyGross = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, energyGross));
        tariffCt = energyGross + extraCt * vat;
        if (!Number.isFinite(tariffCt)) {
            tariffCt = null;
            status = 'incomplete';
        } else {
            breakdown = { marketCt, percentageCt, ...Object.fromEntries(surchargeKeys.map((key, index) => [key, surcharges[index]])),
                vatCt: (energyNet + extraCt) * (vat - 1), limitCt: energyGross - energyNet * vat };
        }
    }
    const contract = {
        configured,
        start,
        status,
        extraCt,
        ...(breakdown && { breakdown }),
        fixedMonthlyGross: vat !== null && base !== null && base >= 0 && meter !== null && meter >= 0
            ? (base + meter / 12) * vat
            : null,
        advanceMonthly: advance !== null && advance >= 0 ? advance : null,
    };
    return { contract, tariffCt };
}

module.exports = calculateTariff;
