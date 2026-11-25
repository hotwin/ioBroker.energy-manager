'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeEnergy, summarizeEnergy } = require('../lib/energy-ai');

test('compares completed Berlin days and excludes unknown meter and tariff values', () => {
    const now = Date.parse('2026-11-24T23:30:00Z');
    const ledger = {
        days: {
            '2026-11-25': { kWh: 20 },
            '2026-11-24': { kWh: 4 },
            '2026-11-23': { kWh: 0 },
            '2026-11-22': { kWh: 0 },
        },
        deviceDays: { '2026-11-22': { meter: { kWh: 0 } } },
    };
    const price = (offset, tariffCt) => ({
        start_timestamp: now + offset * 3600000,
        end_timestamp: now + (offset + 1) * 3600000,
        tariffCt,
    });
    const facts = summarizeEnergy(ledger, [price(0, 30), price(1, null), price(2, 20), price(24, 10)], now);
    assert.deepEqual(facts.yesterday, { day: '2026-11-24', kWh: 4 });
    assert.deepEqual(facts.priorDays, [{ day: '2026-11-22', kWh: 0 }]);
    assert.equal(facts.currentGrossRate.ctPerKWh, 30);
    assert.equal(facts.cheapestUpcomingGrossRate.ctPerKWh, 20);
});

test('sends only aggregate facts to the configured Ollama chat endpoint', async t => {
    const facts = { yesterday: { day: '2026-11-24', kWh: 4 } };
    const signal = new AbortController().signal;
    const fetchMock = t.mock.method(globalThis, 'fetch', async (url, request) => {
        assert.equal(url.href, 'http://ollama.lan:11434/api/chat');
        assert.equal(request.signal, signal);
        assert.equal(request.redirect, 'error');
        const body = JSON.parse(request.body);
        assert.equal(body.model, 'test-model');
        assert.equal(body.stream, false);
        assert.deepEqual(JSON.parse(body.messages[1].content), facts);
        return new Response(JSON.stringify({ message: { content: ' Gestern wurden 4 kWh erfasst. ' } }));
    });
    const config = { aiUrl: 'http://ollama.lan:11434', aiModel: 'test-model' };
    assert.equal(await analyzeEnergy(config, facts, signal), 'Gestern wurden 4 kWh erfasst.');
    await assert.rejects(analyzeEnergy({ ...config, aiUrl: 'ftp://ollama.lan' }, facts, signal), /Invalid Ollama/);
    assert.equal(fetchMock.mock.callCount(), 1);
});
