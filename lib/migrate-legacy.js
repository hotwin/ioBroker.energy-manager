'use strict';

const { open, unlink } = require('node:fs/promises');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { isDeepStrictEqual, parseArgs } = require('node:util');
const { native: defaults } = require('../io-package.json');

const configKeys = [...Object.keys(defaults), 'deviceAliases'];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function parseLedger(value, id) {
    if (value == null || value === 'null') return null;
    try {
        const ledger = typeof value === 'string' && JSON.parse(value);
        if (isRecord(ledger) && isRecord(ledger.days) &&
            ['meters', 'deviceDays', 'hourly', 'priceHistory'].every(key => !Object.hasOwn(ledger, key) || isRecord(ledger[key]))) {
            return ledger;
        }
    } catch {
        // Do not include values from the database in error messages.
    }
    throw new Error(`Unexpected consumption history format in ${id}.`);
}

async function readInstance({ objects, states }, name, number) {
    const namespace = `${name}.${number}`;
    const id = `system.adapter.${namespace}`;
    const consumption = `${namespace}.consumption`;
    const instance = await objects.getObjectAsync(id);
    if (!instance || instance.type !== 'instance' || instance.common?.name !== name || !isRecord(instance.native)) {
        throw new Error(`Expected an installed ${name} instance at ${id}.`);
    }
    const stateObject = await objects.getObjectAsync(consumption);
    if (stateObject && (stateObject.type !== 'state' || stateObject.common?.type !== 'string' ||
        stateObject.common.role !== 'json' || stateObject.common.alias)) {
        throw new Error(`Unexpected state object schema for ${consumption}.`);
    }
    const state = await states.getStateAsync(consumption);
    const ledger = parseLedger(state?.val, consumption);
    if (ledger && !stateObject) throw new Error(`Missing state object for existing history at ${consumption}.`);
    const alive = (await states.getStateAsync(id + '.alive'))?.val;
    return { id, consumption, instance, stateObject, state, ledger, stopped: instance.common.enabled === false && alive !== true };
}

async function inspect(db, { from, to }) {
    const source = await readInstance(db, 'energy-manager', from);
    const target = await readInstance(db, 'hotwin-energy-manager', to);
    const legacy = source.instance.native;
    const existing = target.instance.native;
    if (Object.hasOwn(legacy, 'deviceAliases') && (!isRecord(legacy.deviceAliases) ||
        Object.values(legacy.deviceAliases).some(alias => typeof alias !== 'string'))) {
        throw new Error('Unexpected legacy device alias format.');
    }

    const native = { ...existing };
    const changed = [];
    const conflicts = [];
    for (const key of configKeys) {
        if (!Object.hasOwn(legacy, key) || isDeepStrictEqual(legacy[key], existing[key])) continue;
        native[key] = legacy[key];
        changed.push(key);
        const initialValue = key === 'deviceAliases' ? {} : defaults[key];
        if (Object.hasOwn(existing, key) && !isDeepStrictEqual(existing[key], initialValue)) conflicts.push(key);
    }

    // Keep recorded series, but start a new meter baseline in the renamed instance.
    const history = source.ledger && { ...source.ledger, meters: {} };
    const copyHistory = history !== null && !isDeepStrictEqual(history, target.ledger);
    return {
        source, target, native, history, copyHistory,
        plan: {
            source: source.id, target: target.id, changedSettings: changed, conflictingSettings: conflicts,
            sourceHistoryDays: Object.keys(source.ledger?.days ?? {}).length,
            targetHistoryDays: Object.keys(target.ledger?.days ?? {}).length,
            copyHistory,
            historyConflict: copyHistory && target.ledger !== null,
            stopped: source.stopped && target.stopped,
        },
    };
}

async function migrate(db, options) {
    const data = await inspect(db, options);
    const { source, target, native, history, copyHistory, plan } = data;
    if (!options.apply || (!plan.changedSettings.length && !copyHistory)) return plan;
    if (target.instance.common.host !== options.host) throw new Error('Run the migration on the target instance host.');
    if (!plan.stopped) throw new Error('Stop and disable both instances before applying the migration.');
    if ((plan.conflictingSettings.length || plan.historyConflict) && !options.overwrite) {
        throw new Error('The target already has data. Review a dry run, then explicitly confirm replacement with --overwrite.');
    }

    const backup = await open(options.backup, 'wx', 0o600);
    try {
        await backup.writeFile(JSON.stringify({ version: 1, source, target }, null, 2) + '\n');
        await backup.sync();
    } finally {
        await backup.close();
    }

    const current = await inspect(db, options);
    if (!current.plan.stopped || !isDeepStrictEqual(current.source, source) || !isDeepStrictEqual(current.target, target)) {
        throw new Error('An instance changed during backup. Keep both instances disabled and run a new dry run.');
    }

    try {
        if (copyHistory) {
            if (!target.stateObject) {
                await db.objects.setObjectAsync(target.consumption, {
                    type: 'state',
                    common: { name: 'Daily consumption ledger', type: 'string', role: 'json', read: true, write: false },
                    native: {},
                });
            }
            await db.states.setStateAsync(target.consumption, { val: JSON.stringify(history), ack: true });
        }
        if (plan.changedSettings.length) {
            await db.objects.setObjectAsync(target.id, { ...target.instance, native });
        }
        const saved = await readInstance(db, 'hotwin-energy-manager', options.to);
        if (!isDeepStrictEqual(saved.instance.native, native) || (copyHistory && !isDeepStrictEqual(saved.ledger, history))) {
            throw new Error('Verification failed.');
        }
    } catch (error) {
        throw new Error('Migration could not be verified and some writes may have succeeded. Keep both instances disabled, retain the backup and repeat the dry run.', { cause: error });
    }
    return { ...plan, applied: true };
}

const usage = 'Usage: node lib/migrate-legacy.js --from <legacy instance number> --to <new instance number> [--apply --backup <new file> [--overwrite]]';

async function run(args) {
    const { values } = parseArgs({
        args,
        options: {
            from: { type: 'string' }, to: { type: 'string' }, backup: { type: 'string' },
            apply: { type: 'boolean' }, overwrite: { type: 'boolean' }, help: { type: 'boolean' },
        },
    });
    if (values.help) {
        return usage;
    }
    const validNumber = number => /^(0|[1-9]\d*)$/.test(number ?? '') && Number.isSafeInteger(Number(number));
    if (!validNumber(values.from) || !validNumber(values.to) ||
        (values.apply ? !values.backup : values.backup !== undefined || values.overwrite)) {
        throw new Error(usage);
    }

    // Use the controller's CLI connection with the same local privileges as `iobroker object`.
    const localRequire = createRequire(resolve('package.json'));
    let connect;
    let host;
    try {
        const controllerRequire = createRequire(localRequire.resolve('iobroker.js-controller/package.json'));
        connect = controllerRequire('@iobroker/js-controller-cli').dbConnectAsync;
        host = controllerRequire('@iobroker/js-controller-common').tools.getHostName();
    } catch {
        throw new Error('Run this command from the ioBroker installation directory as the ioBroker host operator.');
    }

    const lockPath = resolve('iobroker-data/.hotwin-energy-manager-migration.lock');
    const lock = values.apply ? await open(lockPath, 'wx', 0o600) : null;
    try {
        const db = await connect(false);
        try {
            if (db.isOffline) throw new Error('Start the ioBroker controller and keep both adapter instances disabled.');
            return JSON.stringify(await migrate(db, { ...values, host }), null, 2);
        } finally {
            await Promise.all([db.objects?.destroy(), db.states?.destroy()]);
        }
    } finally {
        if (lock) {
            await lock.close();
            await unlink(lockPath);
        }
    }
}

if (require.main === module) {
    // Only this standalone CLI sets an exit status; never force the controller process to exit.
    run(process.argv.slice(2)).then(
        output => { process.stdout.write(output + '\n'); },
        error => {
            process.exitCode = 1;
            process.stderr.write(error.message + '\n');
        },
    );
}
