'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { reviewReport, legacyErrors } = require('../scripts/check-repository');
const sha = '0'.repeat(40);
const packageName = 'iobroker.hotwin-energy-manager';
const adapterName = 'hotwin-energy-manager';
const version = '0.6.1';
const registry = { latest: '0.3.0-beta.8', candidateMissing: true };
const report = {
    result: 'OK', lastCommitSha: sha, errors: [], warnings: [],
    checks: [
        `Name of adapter in package.json must be lowercase and be equal to "${packageName}".`,
        '"common.name" is valid in io-package.json',
    ],
};
const candidate = { sha, packageName, adapterName, version, registry, phase: 'prepublish', tagVerified: true };
const missingTag = '[E3032] Release 0.6.1 from io-package.json/package.json has not yet been tagged. Tagging releases is required.';
const news = '[W2004] Version "0.6.1" listed at common.news at io-package.json does not exist at NPM and will be ignored at repository listing. Please remove from news section.';
const unlisted = '[W4001] Cannot find "hotwin-energy-manager" in latest repository. Please ignore if PR to add adapter to repositories already exists.';

test('requires exact candidate SHA and verified package identity', () => {
    assert.equal(reviewReport(report, candidate).verified, true);
    for (const mismatch of [{ lastCommitSha: '1'.repeat(40) }, { result: 'Errors found' }, { checks: [] }]) {
        const result = reviewReport({ ...report, ...mismatch, errors: legacyErrors }, candidate);
        assert.equal(result.verified, false);
        assert.equal(result.deferred.length, 0);
    }
});

test('only exact historical findings are deferred for the unpublished migration candidate', () => {
    const unrelated = '[E3053] different job or version';
    const observed = { ...report, errors: [...legacyErrors, unrelated], warnings: [news, unlisted] };
    const result = reviewReport(observed, candidate);
    assert.deepEqual(result.unresolved, [unrelated]);
    assert.equal(result.deferred.length, 6);
    assert.ok(reviewReport(observed, { ...candidate, registry: { latest: 'other', candidateMissing: true } }).unresolved.includes(legacyErrors[0]));
    assert.ok(reviewReport(observed, { ...candidate, version: '0.6.2' }).unresolved.includes(legacyErrors[0]));
});

test('missing tag is allowed in preview only; tag release must match and be unpublished', () => {
    const observed = { ...report, errors: [missingTag] };
    assert.deepEqual(reviewReport(observed, { ...candidate, phase: 'preview' }).unresolved, []);
    assert.deepEqual(reviewReport(observed, candidate).unresolved, [missingTag]);
    assert.equal(reviewReport(report, { ...candidate, tagVerified: false }).unresolved.length, 1);
    assert.equal(reviewReport(report, { ...candidate, registry: { latest: version, candidateMissing: false } }).unresolved.length, 1);
});

test('postpublish does not defer historical errors and requires npm latest to match', () => {
    const post = { ...candidate, phase: 'postpublish', registry: { latest: version, candidateMissing: false } };
    assert.deepEqual(reviewReport({ ...report, errors: legacyErrors, warnings: [news, unlisted] }, post).unresolved, [...legacyErrors, news]);
    assert.equal(reviewReport(report, post).unresolved.length, 0);
    assert.equal(reviewReport(report, { ...post, registry }).unresolved.length, 1);
    assert.deepEqual(reviewReport({ ...report, warnings: [unlisted] }, { ...post, phase: 'strict' }).unresolved, [unlisted]);
});

const versionMismatch = "[W2002] Version of package.json (0.6.1) doesn't match latest version on NPM (0.3.0-beta.8)";

test('W2002 is deferred only for the exact unpublished migration before publication', () => {
    const observed = { ...report, warnings: [versionMismatch] };
    for (const phase of ['preview', 'prepublish']) {
        const result = reviewReport(observed, { ...candidate, phase });
        assert.deepEqual(result.unresolved, []);
        assert.deepEqual(result.deferred, [versionMismatch]);
    }
    for (const context of [
        { phase: 'strict' },
        { phase: 'postpublish', registry: { latest: version, candidateMissing: false } },
        { registry: { latest: '0.3.0-beta.7', candidateMissing: true } },
        { registry: { latest: '0.3.0-beta.8', candidateMissing: false } },
        { version: '0.6.2' },
        { packageName: 'iobroker.other', adapterName: 'other' },
        { registry: undefined },
    ]) {
        assert.ok(reviewReport(observed, { ...candidate, ...context }).unresolved.includes(versionMismatch));
    }
    const unrelated = versionMismatch.replace('0.3.0-beta.8', '0.3.0-beta.7');
    assert.deepEqual(reviewReport({ ...report, warnings: [unrelated] }, candidate).unresolved, [unrelated]);
    const wrongSha = reviewReport({ ...observed, lastCommitSha: '1'.repeat(40) }, candidate);
    assert.equal(wrongSha.verified, false);
    assert.deepEqual(wrongSha.deferred, []);
    assert.deepEqual(wrongSha.unresolved, [versionMismatch]);
});
