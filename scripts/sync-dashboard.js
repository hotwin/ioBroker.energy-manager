'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
for (const [source, destination] of [['tab.html', 'index.html'], ['dashboard.js', 'dashboard.js']]) {
    const contents = fs.readFileSync(path.join(root, 'admin', source));
    const target = path.join(root, 'www', destination);
    if (process.argv.includes('--check')) {
        if (!contents.equals(fs.readFileSync(target))) {
            throw Error('Stale web dashboard: ' + destination);
        }
    } else {
        fs.writeFileSync(target, contents);
    }
}
