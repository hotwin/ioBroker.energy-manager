'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { reviewReport } = require('../scripts/check-repository');

const sha = '0'.repeat(40);
const packageName = 'iobroker.hotwin-energy-manager';
const adapterName = 'hotwin-energy-manager';
const absent = `[E2000] Package ${packageName} not found on npm. Please publish`;
const unlisted = `[W4001] Cannot find "${adapterName}" in latest repository. Please ignore if PR to add adapter to repositories already exists.`;
const issue = 'https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/24';
const report = {
    result: 'OK', lastCommitSha: sha, errors: [], warnings: [],
    checks: [
        `Name of adapter in package.json must be lowercase and be equal to "${packageName}".`,
        '"common.name" is valid in io-package.json',
    ],
};

test('requires the exact checker SHA and positive package identity evidence', () => {
    const candidate = { sha, packageName, adapterName };
    assert.equal(reviewReport(report, candidate).verified, true);
    for (const mismatch of [
        { lastCommitSha: '1'.repeat(40) }, { result: 'Errors found' }, { checks: [] },
        { checks: [report.checks[0].replace(packageName, 'iobroker.energy-manager'), report.checks[1]] },
    ]) {
        assert.equal(reviewReport({ ...report, ...mismatch }, candidate).verified, false);
    }
});

test('defers only documented admission findings for the checked adapter', () => {
    const otherPackage = absent.replace(packageName, 'iobroker.energy-manager');
    const unpublished = `[E2000] Package ${packageName} was unpublished. Please republish at npm`;
    const observed = { ...report, errors: [absent, otherPackage, unpublished], warnings: [
        unlisted, '[W3032] Release 0.3.0-beta.14 has not yet been tagged.',
    ] };
    const candidate = { sha, packageName, adapterName, admissionIssue: issue, npmMissing: true };
    const reviewed = reviewReport(observed, candidate);
    assert.deepEqual(reviewed.deferred, [absent, unlisted]);
    assert.equal(reviewed.unresolved.length, 3);
    assert.deepEqual(reviewReport(observed, { ...candidate, npmMissing: false }).deferred, [unlisted]);
    assert.deepEqual(reviewReport(observed, { ...candidate, admissionIssue: '' }).deferred, []);
    assert.deepEqual(reviewReport({ ...observed, checks: [] }, candidate).deferred, []);
});

test('defers W2004 only for this exact candidate with verified npm absence', () => {
    const version = '0.3.0-beta.14';
    const candidateWarning = `[W2004] Version "${version}" listed at common.news at io-package.json does not exist at NPM and will be ignored at repository listing. Please remove from news section.`;
    const otherWarning = candidateWarning.replace(version, '0.3.0-beta.13');
    const observed = { ...report, warnings: [candidateWarning, otherWarning] };
    const candidate = { sha, packageName, adapterName, version, candidateMissing: true };
    assert.deepEqual(reviewReport(observed, candidate).deferred, [candidateWarning]);
    assert.deepEqual(reviewReport(observed, { ...candidate, candidateMissing: false }).deferred, []);
    assert.deepEqual(reviewReport({ ...observed, checks: [] }, candidate).deferred, []);
});
