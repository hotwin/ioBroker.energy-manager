'use strict';

const { execFileSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

function isAdmissionIssue(url) {
    return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(?:issues|pull)\/[1-9]\d*$/.test(url);
}

const missingPackageFindings = name => [
    `[E2000] Package ${name} not found on npm. Please publish at npm`,
    `[E2000] Package ${name} not found on npm. Please publish`,
];

async function registryConfirmsMissing(name) {
    try {
        const response = await fetch('https://registry.npmjs.org/' + encodeURIComponent(name), {
            signal: AbortSignal.timeout(10000),
        });
        return response.status === 404 && (await response.json()).error === 'Not found';
    } catch {
        return false;
    }
}

function reviewReport(report, { sha, packageName, adapterName, admissionIssue, npmMissing }) {
    const verified = report.result === 'OK' && report.lastCommitSha === sha && packageName === 'iobroker.' + adapterName &&
        report.checks.includes(`Name of adapter in package.json must be lowercase and be equal to "${packageName}".`) &&
        report.checks.includes('"common.name" is valid in io-package.json');
    // The upstream workflow lookup compares its ref argument to branch names.
    // CI verifies an immutable SHA in its own test jobs.
    const warnings = report.warnings.filter(finding => finding.startsWith('[W') &&
        !(finding.startsWith('[W3031]') && finding.includes(`and branch "${sha}"`)));
    const pending = [...report.errors, ...warnings];
    const canDefer = verified && isAdmissionIssue(admissionIssue);
    const deferred = canDefer ? pending.filter(finding =>
        finding === `[W4001] Cannot find "${adapterName}" in latest repository. Please ignore if PR to add adapter to repositories already exists.` ||
        (npmMissing && missingPackageFindings(packageName).includes(finding))) : [];
    return { verified, deferred, unresolved: pending.filter(finding => !deferred.includes(finding)) };
}

async function main() {
    const checkout = process.argv[2];
    if (!checkout) throw Error('Pass the path to the official ioBroker Repository Checker checkout.');
    const repository = process.env.GITHUB_REPOSITORY || 'hotwin/ioBroker.hotwin-energy-manager';
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim();
    const { handler } = require(path.resolve(checkout, 'index.js'));
    const identity = `${repository}@${sha} · ${pkg.name}@${pkg.version}`;
    console.log(identity);
    const report = await new Promise((resolve, reject) => {
        handler({
            queryStringParameters: {
                url: 'https://github.com/' + repository,
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
    const admissionIssue = process.env.IOBROKER_ADMISSION_ISSUE || '';
    if (admissionIssue && !isAdmissionIssue(admissionIssue)) {
        throw Error('Admission evidence must be a full GitHub issue or pull request URL.');
    }
    const adapterName = require('../io-package.json').common.name;
    const npmMissing = Boolean(admissionIssue) &&
        report.errors.some(finding => missingPackageFindings(pkg.name).includes(finding)) &&
        await registryConfirmsMissing(pkg.name);
    const { verified, deferred, unresolved } = reviewReport(report, {
        sha, packageName: pkg.name, adapterName, admissionIssue, npmMissing,
    });
    const passed = verified && unresolved.length === 0;
    const message = `Repository Checker ${report.version} reported SHA ${report.lastCommitSha || 'unavailable'}. ` +
        `Package identity ${verified ? 'verified' : 'unverified'}. ${report.errors.length} reported errors, ` +
        `${unresolved.length} unresolved findings, ${deferred.length} deferred. Gate ${passed ? 'passed' : 'failed'}.`;
    console.log(message);
    for (const finding of [...report.errors, ...report.warnings]) {
        console.log(JSON.stringify(finding));
    }
    const deferralNote = deferred.length ? `\n\nAdmission evidence ${admissionIssue}\n\n` +
        deferred.map(finding => `- ${finding}`).join('\n') : '';
    if (deferralNote) console.log(deferralNote);
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ioBroker Repository Checker\n\n${identity}\n\n${message}${deferralNote}\n`);
    }
    if (!passed) process.exitCode = 1;
}

if (require.main === module) {
    main().catch(error => {
        console.error('Repository Checker aborted: ' + error.message);
        process.exitCode = 1;
    });
}

module.exports = { reviewReport };
