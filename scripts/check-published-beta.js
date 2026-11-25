'use strict';

const { createHash } = require('node:crypto');
const { appendFile, readFile } = require('node:fs/promises');

async function betaAlreadyPublished(name, version, archive) {
    const response = await fetch('https://registry.npmjs.org/' + encodeURIComponent(name), {
        signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404 && (await response.json()).error === 'Not found') return false;
    if (!response.ok) throw Error('Cannot verify npm registry state (HTTP ' + response.status + ').');

    const metadata = await response.json();
    if (metadata.name !== name || !metadata.versions || !metadata['dist-tags']) {
        throw Error('Unexpected npm package metadata.');
    }
    const published = metadata.versions[version];
    if (!published) return false;
    const integrity = 'sha512-' + createHash('sha512').update(archive).digest('base64');
    if (published.name !== name || published.version !== version || published.dist?.integrity !== integrity) {
        throw Error('Existing npm version differs from the checked release archive.');
    }
    if (metadata['dist-tags'].beta !== version) {
        throw Error('Existing npm version is outside the beta channel.');
    }
    return true;
}

if (require.main === module) {
    const { name, version } = require('../package.json');
    readFile(process.argv[2]).then(archive => betaAlreadyPublished(name, version, archive)).then(async published => {
        console.log(published ? 'Verified the existing npm beta archive.' : 'The candidate is available for npm publication.');
        await appendFile(process.env.GITHUB_OUTPUT, 'published=' + published + '\n');
    }).catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { betaAlreadyPublished };
