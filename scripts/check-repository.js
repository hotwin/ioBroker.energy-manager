'use strict';

const { execFileSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

async function main() {
    const checkout = process.argv[2];
    if (!checkout) throw Error('Pass the path to the official ioBroker Repository Checker checkout.');
    const repository = process.env.GITHUB_REPOSITORY || 'hotwin/ioBroker.energy-manager';
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
    if (!Array.isArray(report.errors) || !Array.isArray(report.warnings)) {
        throw Error('Repository Checker did not return a complete report.');
    }
    // The upstream checker searches for a workflow whose branch name equals its ref argument.
    // With an immutable SHA that lookup is empty. CI verifies this revision in its own test jobs.
    const auditedWarnings = report.warnings.filter(message => message.startsWith('[W') &&
        !(message.startsWith('[W3031]') && message.includes(`and branch "${sha}"`)));
    const passed = report.result === 'OK' && report.lastCommitSha === sha &&
        report.errors.length === 0 && auditedWarnings.length === 0;
    const message = `Repository Checker ${report.version} reported SHA ${report.lastCommitSha || 'unavailable'}. ` +
        `${report.errors.length} errors, ${auditedWarnings.length} unresolved warnings. Gate ${passed ? 'passed' : 'failed'}.`;
    console.log(message);
    for (const finding of [...report.errors, ...report.warnings]) {
        // Keep the report readable without treating remote text as a GitHub Actions workflow command.
        console.log(JSON.stringify(finding));
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ioBroker Repository Checker\n\n${identity}\n\n${message}\n`);
    }
    if (!passed) process.exitCode = 1;
}

main().catch(error => {
    console.error('Repository Checker aborted: ' + error.message);
    process.exitCode = 1;
});
