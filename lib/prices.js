'use strict';

const calculateTariff = require('./tariff');
const { localDay } = require('./consumption');

function normalizePriceFeed(payload) {
    const data = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(data)) return [];
    const prices = data.filter(item => Number.isFinite(item?.marketprice) &&
        Number.isFinite(item.start_timestamp) && Number.isFinite(item.end_timestamp) &&
        item.end_timestamp > item.start_timestamp).sort((a, b) => a.start_timestamp - b.start_timestamp);
    if (prices.some((item, index) => index > 0 && item.start_timestamp < prices[index - 1].end_timestamp)) return [];
    return prices;
}

const energyChartsZones = ['DE-LU', 'AT', 'CH', 'FR', 'NL', 'BE', 'PL', 'CZ', 'DK1', 'DK2'];

function marketFeed(source, now) {
    if (source === 'awattarAt') return { name: 'aWATTar AT', url: 'https://api.awattar.at/v1/marketdata' };
    const zone = energyChartsZones.find(item => source === 'energyCharts:' + item);
    if (zone) {
        const params = new URLSearchParams({ bzn: zone, start: new Date(now - 3600000).toISOString(),
            end: new Date(now + 48 * 3600000).toISOString() });
        return { name: 'Energy-Charts · ' + zone, url: 'https://api.energy-charts.info/v2/price?' + params, zone };
    }
    return { name: 'aWATTar DE', url: 'https://api.awattar.de/v1/marketdata' };
}

function normalizeEnergyCharts(payload, zone) {
    const series = payload?.series;
    const interval = payload?.interval_minutes;
    if (payload?.bidding_zone !== zone || !Array.isArray(series) || series.length !== 1 ||
        !['EUR/MWh', '€/MWh'].includes(series[0].unit ?? payload.unit) ||
        ![15, 30, 60].includes(interval) || !Array.isArray(payload.data)) return [];
    return normalizePriceFeed(payload.data.map(item => {
        const start = Date.parse(item?.timestamp);
        return { start_timestamp: start, end_timestamp: start + interval * 60000,
            marketprice: item?.values?.[series[0].id] };
    }));
}

function priceSnapshot(config, feed = [], now) {
    const current = feed.find(item => item.start_timestamp <= now && now < item.end_timestamp);
    const marketCt = current ? current.marketprice / 10 : null;
    const { tariffCt, contract } = calculateTariff(config, marketCt, localDay(now));
    const prices = feed.map(item => ({
        ...item,
        tariffCt: item === current ? tariffCt
            : calculateTariff(config, item.marketprice / 10, localDay(item.start_timestamp)).tariffCt,
    }));
    const currentPrice = current ? {
        start_timestamp: current.start_timestamp, end_timestamp: current.end_timestamp,
    } : null;
    return { prices, currentPrice, marketCt, tariffCt, contract };
}

module.exports = { priceSnapshot, normalizePriceFeed, normalizeEnergyCharts, marketFeed };
