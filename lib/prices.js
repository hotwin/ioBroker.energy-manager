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

module.exports = { priceSnapshot, normalizePriceFeed };
