'use strict';

const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { betaAlreadyPublished } = require('../scripts/check-published-beta');

test('resumes GitHub archival only for the exact archive already on the npm beta channel', async t => {
    const name = 'iobroker.hotwin-energy-manager';
    const version = '0.3.0-beta.14';
    const archive = Buffer.from('checked release package');
    const integrity = 'sha512-' + createHash('sha512').update(archive).digest('base64');
    const metadata = { name, versions: { [version]: { name, version, dist: { integrity } } }, 'dist-tags': { beta: version } };
    let response = Response.json(metadata);
    const fetch = t.mock.method(globalThis, 'fetch', async () => response);
    assert.equal(await betaAlreadyPublished(name, version, archive), true);
    assert.equal(fetch.mock.calls[0].arguments[0], 'https://registry.npmjs.org/' + name);
    response = Response.json(metadata);
    await assert.rejects(betaAlreadyPublished(name, version, Buffer.from('different archive')), /differs/);
    metadata['dist-tags'].beta = '0.3.0-beta.13';
    response = Response.json(metadata);
    await assert.rejects(betaAlreadyPublished(name, version, archive), /outside the beta channel/);
    response = Response.json({ ...metadata, versions: {} });
    assert.equal(await betaAlreadyPublished(name, version, archive), false);
    response = Response.json({ error: 'Not found' }, { status: 404 });
    assert.equal(await betaAlreadyPublished(name, version, archive), false);
    response = Response.json({ error: 'Forbidden' }, { status: 403 });
    await assert.rejects(betaAlreadyPublished(name, version, archive), /HTTP 403/);
});
