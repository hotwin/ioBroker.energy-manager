'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pkg = require('../package.json');
const io = require('../io-package.json');
test('package metadata and versions match', () => {
 assert.equal(pkg.name, 'iobroker.hotwin-energy-manager');
 assert.equal(io.common.name, 'hotwin-energy-manager');
 assert.equal(pkg.version, io.common.version);
 assert.equal(pkg.license, io.common.licenseInformation.license);
});
test('required adapter metadata exists', () => {
 for (const key of ['type','connectionType','dataSource','authors','adminUI']) assert.ok(io.common[key], key);
 assert.ok(fs.existsSync(path.join(root, 'LICENSE')));
});
test('admin config is parseable JSON', () => {
 for (const file of ['jsonConfig.json']) assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root,'admin',file),'utf8')));
});

test('native settings tabs preserve unique configuration fields and translated labels', () => {
 const config = JSON.parse(fs.readFileSync(path.join(root, 'admin', 'jsonConfig.json'), 'utf8'));
 assert.equal(config.type, 'tabs');
 const fields = Object.values(config.items).flatMap(panel => {
  assert.equal(panel.type, 'panel');
  return Object.entries(panel.items).filter(([, item]) => item.type !== 'header').map(([key]) => key);
 });
 assert.equal(new Set(fields).size, fields.length);
 assert.deepEqual(fields.sort(), ["advanceMonthly","autoShelly","baseMonthly","batterySocId","compareHousePower","concessionCt","contractStart","electricityTaxCt","feedInPowerId","houseEnergyId","housePowerId","leviesCt","marketPriceSource","marketPriceStateId","markupCt","meterAnnual","networkCt","solarPowerId","sources","tariffConfigured","vatPercent"]);
 for (const lang of fs.readdirSync(path.join(root, 'admin', 'i18n'))) {
  const translations = JSON.parse(fs.readFileSync(path.join(root, 'admin', 'i18n', lang, 'translations.json'), 'utf8'));
  for (const panel of Object.values(config.items)) {
   assert.ok(translations[panel.label], lang + ': ' + panel.label);
   for (const item of Object.values(panel.items)) {
    if (item.type === 'header') assert.ok(translations[item.text], lang + ': ' + item.text);
   }
  }
 }
});
