'use strict';

const { execFileSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

const migrationVersion = '0.6.1';
const oldLatest = '0.3.0-beta.8';
const legacyRun = '45858804016';
const legacyJobs = { 22: '140044093344', 24: '140044093309' };
const repository = 'hotwin/ioBroker.hotwin-energy-manager';
const missingCandidateNews = version =>
    `[W2004] Version "${version}" listed at common.news at io-package.json does not exist at NPM and will be ignored at repository listing. Please remove from news section.`;
const missingTag = version =>
    `[E3032] Release ${version} from io-package.json/package.json has not yet been tagged. Tagging releases is required.`;
const unlisted = adapterName =>
    `[W4001] Cannot find "${adapterName}" in latest repository. Please ignore if PR to add adapter to repositories already exists.`;
const legacyErrors = [
    `[E2007] Version ${oldLatest} is tagged as "latest" at npm. Pre-release versions must not be tagged as "latest" and will be ignored by repository updates.`,
    `[E2008] Version ${oldLatest} tagged as "latest" at npm is not signed with provenance. Trusted publishing is recommended.`,
    ...Object.entries(legacyJobs).map(([node, job]) =>
        `[E3053] "test-and-release.yml": "testing-action-adapter" job "adapter-tests (${node})" in [run #174](https://github.com/${repository}/actions/runs/${legacyRun}) for npm latest release ${oldLatest} does not log the expected defaults for "npm run test:integration". Please check the [log](https://github.com/${repository}/actions/runs/${legacyRun}/job/${job}).`),
];

// Explicit, reviewed advisory warnings. No error-class wildcard is allowed.
const advisory = [
    '[W0062] Consider adding and using package "@iobroker/eslint-config".',
    '[W0062] Consider adding and using package "@iobroker/adapter-dev".',
];
const pendingReview = [
    `[W8004] Please process issue [[#43] "IMPORTANT: cleanup Changelog"](https://github.com/${repository}/issues/43)`,
    `[W8004] Please process issue [[#39] "IMPORTANT: use standard test-and-release workflow"](https://github.com/${repository}/issues/39)`,
];

async function registryState(name, version) {
    const response = await fetch('https://registry.npmjs.org/' + encodeURIComponent(name), {
        signal: AbortSignal.timeout(15000), headers: { accept: 'application/json' },
    });
    if (!response.ok) throw Error('npm registry verification failed: HTTP ' + response.status);
    const data = await response.json();
    if (data.name !== name || !data.versions || !data['dist-tags']) throw Error('Invalid npm registry metadata');
    return {
        latest: data['dist-tags'].latest,
        candidateMissing: !Object.hasOwn(data.versions, version),
    };
}

function reviewReport(report, { sha, packageName, adapterName, version, phase, registry, tagVerified }) {
    const verified = report.result === 'OK' && report.lastCommitSha === sha && packageName === 'iobroker.' + adapterName &&
        report.checks.includes(`Name of adapter in package.json must be lowercase and be equal to "${packageName}".`) &&
        report.checks.includes('"common.name" is valid in io-package.json');
    const warnings = report.warnings.filter(finding => finding.startsWith('[W') &&
        !(finding.startsWith('[W3031]') && finding.includes(`and branch "${sha}"`)));
    const pending = [...report.errors, ...warnings];
    const migration = version === migrationVersion && packageName === 'iobroker.hotwin-energy-manager';
    const pre = phase === 'preview' || phase === 'prepublish';
    const bootstrap = migration && pre && registry?.candidateMissing === true && registry.latest === oldLatest;
    const deferred = verified ? pending.filter(finding => {
        if (advisory.includes(finding)) return true;
        if (phase === 'preview' && finding === missingTag(version)) return true;
        if (pre && registry?.candidateMissing === true && finding === missingCandidateNews(version)) return true;
        if (bootstrap && (legacyErrors.includes(finding) || pendingReview.includes(finding))) return true;
        // Admission is a separate documented step after npm publication.
        if (migration && (bootstrap || phase === 'postpublish') && finding === unlisted(adapterName)) return true;
        return false;
    }) : [];
    const unresolved = pending.filter(finding => !deferred.includes(finding));
    if (phase === 'prepublish' && (!tagVerified || registry?.candidateMissing !== true)) {
        unresolved.push('Release tag must match the candidate and the npm version must be unpublished.');
    }
    if (phase === 'postpublish' && (registry?.candidateMissing !== false || registry.latest !== version)) {
        unresolved.push('npm latest must equal the published regular candidate.');
    }
    return { verified, deferred, unresolved };
}

async function main() {
    const checkout = process.argv[2];
    if (!checkout) throw Error('Pass the path to the official ioBroker Repository Checker checkout.');
    const repo = process.env.GITHUB_REPOSITORY || repository;
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim();
    const { handler } = require(path.resolve(checkout, 'index.js'));
    const identity = `${repo}@${sha} · ${pkg.name}@${pkg.version}`;
    console.log(identity);
    const report = await new Promise((resolve, reject) => {
        handler({
            queryStringParameters: {
                url: 'https://github.com/' + repo,
                branch: sha,
                githubToken: process.env.GITHUB_TOKEN,
            },
        }, null, (error, response) => {
            if (error || response?.statusCode !== 200) return reject(error || Error('Repository Checker request failed.'));
            try {
                resolve(JSON.parse(response.body));
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
    if (!Array.isArray(report.errors) || !Array.isArray(report.warnings) || !Array.isArray(report.checks)) {
        throw Error('Repository Checker did not return a complete report.');
    }
    const phase = process.env.REPOSITORY_CHECK_PHASE || 'strict';
    if (!['preview', 'prepublish', 'postpublish', 'strict'].includes(phase)) throw Error('Invalid checker phase');
    const adapterName = require('../io-package.json').common.name;
    const registry = await registryState(pkg.name, pkg.version);
    const tagVerified = process.env.GITHUB_REF === 'refs/tags/v' + pkg.version;
    const { verified, deferred, unresolved } = reviewReport(report, {
        sha, packageName: pkg.name, adapterName, version: pkg.version, phase, registry, tagVerified,
    });
    const passed = verified && unresolved.length === 0;
    const message = `Repository Checker ${report.version} phase ${phase} at SHA ${report.lastCommitSha || 'unavailable'}. ` +
        `Package identity ${verified ? 'verified' : 'unverified'}. ${report.errors.length} reported errors, ` +
        `${unresolved.length} unresolved findings, ${deferred.length} documented deferrals/advisories. Gate ${passed ? 'passed' : 'failed'}.`;
    console.log(message);
    for (const finding of [...report.errors, ...report.warnings]) console.log(JSON.stringify(finding));
    const details = '\n\nPolicy: https://github.com/' + repo + '/issues/24\n' +
        'npm latest: ' + registry.latest + '; candidate missing: ' + registry.candidateMissing + '\n\n' +
        'Deferred/advisory:\n' + deferred.map(finding => '- ' + finding).join('\n') +
        '\n\nUnresolved:\n' + unresolved.map(finding => '- ' + finding).join('\n');
    console.log(details);
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## ioBroker Repository Checker\n\n' + identity + '\n\n' + message + details + '\n');
    }
    if (!passed) process.exitCode = 1;
}

if (require.main === module) {
    main().catch(error => {
        console.error('Repository Checker aborted: ' + error.message);
        process.exitCode = 1;
    });
}

module.exports = { reviewReport, legacyErrors };
