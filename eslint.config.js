'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    { ignores: ['node_modules/**', '.tmp/**'] },
    js.configs.recommended,
    { files: ['**/*.js'], languageOptions: { globals: globals.node, sourceType: 'commonjs' } },
    { files: ['admin/dashboard.js', 'www/dashboard.js'], languageOptions: { globals: globals.browser, sourceType: 'script' } },
];
