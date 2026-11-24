'use strict';

const surchargeKeys = ['markupCt', 'electricityTaxCt', 'networkCt', 'concessionCt', 'leviesCt'];
const numeric = (value, fallback = 0) => value === null || value === '' || !Number.isFinite(Number(value))
    ? fallback
    : Number(value);

function calculateTariff(config, marketCt, day) {
    const extraCt = surchargeKeys.reduce((sum, key) => sum + numeric(config[key]), 0);
    const vat = 1 + numeric(config.vatPercent, 19) / 100;
    const start = config.contractStart || null;
    const configured = config.tariffConfigured === true;
    const contract = {
        configured,
        start,
        extraCt,
        fixedMonthlyGross: (numeric(config.baseMonthly) + numeric(config.meterAnnual) / 12) * vat,
        advanceMonthly: numeric(config.advanceMonthly),
    };
    const tariffCt = configured && (!start || day >= start) && Number.isFinite(marketCt)
        ? (marketCt + extraCt) * vat
        : null;
    return { contract, tariffCt };
}

module.exports = calculateTariff;
