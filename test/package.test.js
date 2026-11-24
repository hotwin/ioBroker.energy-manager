'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pkg = require('../package.json');
const io = require('../io-package.json');
test('package metadata and versions match', () => {
 assert.equal(pkg.name, 'iobroker.energy-manager');
 assert.equal(io.common.name, 'energy-manager');
 assert.equal(pkg.version, io.common.version);
 assert.equal(pkg.license, io.common.license);
});
test('required adapter metadata exists', () => {
 for (const key of ['type','connectionType','dataSource','authors','adminUI']) assert.ok(io.common[key], key);
 assert.ok(fs.existsSync(path.join(root, 'LICENSE')));
});
test('admin config is parseable JSON', () => {
 for (const file of ['jsonConfig.json','jsonTab.json']) assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root,'admin',file),'utf8')));
});
