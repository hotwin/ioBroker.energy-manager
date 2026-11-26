'use strict';

const powerUnits = { W: 1, kW: 1000 };
const nonMeasurement = /limit|threshold|rated|nominal|maximum|minimum|maxpower|minpower|overpower|setpoint|alarm|capacity|forecast|target|apparent|reactive|aggregate|group|rated|powerfactor/i;
const energyUnits = { Wh: 0.001, kWh: 1 };
const parent = id => id.slice(0, id.lastIndexOf('.'));
const contains = (member, id) => id === member || id.startsWith(member + '.');
const label = name => typeof name === 'string' ? name : name?.de || name?.en;
const isEnergyEnum = (id, object) => {
    const name = object.common?.name;
    const aliases = [id.split('.').at(-1), ...(typeof name === 'object' && name ? Object.values(name) : [name])];
    return aliases.some(value => /^(strommessung|energiemessung|stromverbrauch|energymeasurement|powermetering)$/
        .test(String(value).toLowerCase().replace(/[^a-z]/g, '')));
};

function measured(state, unit, units) {
    if (!Number.isFinite(state?.val) || state.q || !Object.hasOwn(units, unit)) return null;
    const value = state.val * units[unit];
    return Number.isFinite(value) ? value : null;
}

async function readMeterState(adapter, id, units) {
    if (!id) return { value: null, status: 'unconfigured' };
    const [object, state] = await Promise.all([
        adapter.getForeignObjectAsync(id),
        adapter.getForeignStateAsync(id),
    ]);
    if (object?.type !== 'state') return { value: null, status: 'missing' };
    if (!Object.hasOwn(units, object.common?.unit)) return { value: null, status: 'unit' };
    const value = measured(state, object.common.unit, units);
    return { value, status: value === null ? 'unavailable' : 'available', ts: state?.ts ?? null };
}

async function readHouseMeter(adapter) {
    const { housePowerId, houseEnergyId } = adapter.config;
    if (!housePowerId && !houseEnergyId) return null;
    const [power, energy] = await Promise.all([
        readMeterState(adapter, housePowerId, powerUnits),
        readMeterState(adapter, houseEnergyId, energyUnits),
    ]);
    return {
        ...(housePowerId && { powerW: power.value, powerTs: power.ts ?? null }),
        ...(houseEnergyId && { energyKWh: energy.value }),
        energyStatus: energy.status,
    };
}

async function unassignedPower(adapter, meter, devices, now) {
    const powerMeasurements = devices.filter(device => !device.exclude && device.powerId);
    if (!powerMeasurements.length || !Number.isFinite(meter.powerW)) return null;
    const timestamps = [meter.powerTs, ...powerMeasurements.map(device => device.powerTs)];
    if (timestamps.some(ts => !Number.isFinite(ts) || ts <= now - 60000 || ts > now) ||
        Math.max(...timestamps) - Math.min(...timestamps) > 30000) return null;
    const values = [meter.powerW, ...powerMeasurements.map(device => device.powerW)];
    if (values.some(value => !Number.isFinite(value) || value < 0)) return null;

    async function resolvePowerId(id) {
        const visited = new Set();
        while (id && !visited.has(id)) {
            visited.add(id);
            const object = await adapter.getForeignObjectAsync(id);
            if (object?.type !== 'state') return null;
            const alias = object.common?.alias?.id;
            if (!alias) return id;
            id = typeof alias === 'string' ? alias : alias.read;
        }
        return null;
    }

    const ids = await Promise.all([adapter.config.housePowerId, ...powerMeasurements.map(device => device.powerId)].map(resolvePowerId));
    if (ids.includes(null) || new Set(ids).size !== ids.length) return null;
    const rest = meter.powerW - powerMeasurements.reduce((sum, device) => sum + device.powerW, 0);
    return rest >= 0 ? { unassignedW: rest, unassignedUntil: Math.min(...timestamps) + 60000 } : null;
}

async function readDevices(adapter) {
    const houseIds = new Set([adapter.config.housePowerId, adapter.config.houseEnergyId].filter(Boolean));
    const enums = Object.entries(await adapter.getForeignObjectsAsync('enum.*', 'enum') || {});
    const members = new Set(enums.filter(([id, object]) => isEnergyEnum(id, object))
        .flatMap(([, object]) => object.common?.members || []));
    const groups = new Map();
    const objects = new Map();
    const getObject = async id => {
        if (!objects.has(id)) objects.set(id, await adapter.getForeignObjectAsync(id));
        return objects.get(id);
    };

    function add(id, object, source) {
        if (houseIds.has(id)) return;
        const unit = object.common?.unit;
        if (object.common?.type !== 'number' || !unit) return;
        const kind = Object.hasOwn(powerUnits, unit) ? 'power' : 'energy';
        if (kind === 'energy' && (!Object.hasOwn(energyUnits, unit) ||
            /price|cost|forecast|today|yesterday|daily|monthly|weekly|currentday/i.test(id))) return;
        const leaf = id.split('.').at(-1);
        if (kind === 'power' && (object.common.write === true || nonMeasurement.test(leaf) ||
            nonMeasurement.test(object.common.role || ''))) return;
        const preferred = members.has(id) ? 3 : kind === 'power' &&
            (/^(?:power|apower|activepower|realpower|instantaneouspower|currentpower|loadpower)$/i.test(leaf.replace(/[_ -]/g, '')) ||
                object.common.role === 'value.power') ? 2 : 1;
        const base = parent(id);
        const group = groups.get(base) || { id: base, source };
        if (!group[kind] || preferred > group[kind].priority) {
            group[kind] = { id, unit, priority: preferred };
        }
        groups.set(base, group);
    }

    for (const member of [...members].sort()) {
        if (member.startsWith('hotwin-energy-manager.') || member.startsWith('energy-manager.') ||
            member.startsWith('system.')) continue;
        const object = await getObject(member);
        if (object?.type === 'state') {
            add(member, object, 'enum');
        } else {
            const children = await adapter.getForeignObjectsAsync(member + '.*', 'state');
            for (const id of Object.keys(children || {}).sort()) add(id, children[id], 'enum');
        }
    }
    if (adapter.config.autoShelly !== false) {
        const shelly = await adapter.getForeignObjectsAsync('shelly.*', 'state') || {};
        for (const id of Object.keys(shelly).sort()) {
            if (/\.(Power|Energy)$/.test(id) && (id.endsWith('.Power') || shelly[parent(id) + '.Power'])) {
                add(id, shelly[id], 'shelly');
            }
        }
    }

    const used = new Set();
    const devices = [];
    async function append(group) {
        const ids = [group.power?.id, group.energy?.id].filter(Boolean);
        if (!ids.length || ids.some(id => used.has(id))) return;
        ids.forEach(id => used.add(id));
        const read = meter => meter ? adapter.getForeignStateAsync(meter.id) : null;
        const [power, energy] = await Promise.all([read(group.power), read(group.energy)]);
        const matching = prefix => enums.filter(([id, object]) => id.startsWith(prefix) &&
            object.common?.members?.some(member => ids.some(id => contains(member, id))));
        const object = await getObject(group.source === 'manual' ? parent(group.id) : group.id);
        const channelId = group.source === 'manual' ? parent(group.id) : group.id;
        const channelName = label(object?.common?.name);
        let deviceName;
        for (let id = parent(channelId); id.split('.').length > 2; id = parent(id)) {
            const ancestor = await getObject(id);
            if (!ancestor || ancestor.type !== 'device' && ancestor.type !== 'channel') continue;
            deviceName = label(ancestor.common?.name);
            if (deviceName && !/^(?:channel|relay|switch|meter)(?:\s*(?:channel|relay|switch|meter))*[\s_#-]*\d*$/i.test(deviceName)) break;
            deviceName = undefined;
        }
        const technicalName = [...new Set([deviceName, channelName].filter(Boolean))].join(' / ') || group.id;
        const originalName = group.name || technicalName;
        const aliasKey = 'meter:' + (group.power?.id || group.energy?.id);
        const alias = adapter.config.deviceAliases?.[aliasKey];
        devices.push({
            id: group.id,
            name: typeof alias === 'string' && alias.trim() ? alias : originalName,
            originalName,
            technicalName,
            aliasKey,
            powerId: group.power?.id,
            powerUnit: group.power?.unit,
            room: group.room || label(matching('enum.rooms.')[0]?.[1].common.name) || '',
            functions: matching('enum.functions.').map(([id, item]) => label(item.common.name) || id),
            exclude: Boolean(group.exclude),
            source: group.source,
            powerTs: power?.ts ?? null,
            powerW: measured(power, group.power?.unit, powerUnits),
            energyKWh: measured(energy, group.energy?.unit, energyUnits),
            ts: Math.max(power?.ts || 0, energy?.ts || 0) || null,
            meterId: group.energy?.id,
        });
    }

    for (const source of Array.isArray(adapter.config.sources) ? adapter.config.sources : []) {
        if (!source || houseIds.has(source.powerId) || houseIds.has(source.energyId)) continue;
        const power = source.powerId && { id: source.powerId,
            unit: (await getObject(source.powerId))?.common?.unit };
        const energy = source.energyId && { id: source.energyId,
            unit: Object.hasOwn(energyUnits, source.unit) ? source.unit : (await getObject(source.energyId))?.common?.unit };
        await append({ ...source, id: source.powerId || source.energyId, power, energy, source: 'manual' });
    }
    for (const group of groups.values()) await append(group);
    return devices;
}

module.exports = readDevices;
module.exports.readHouseMeter = readHouseMeter;
module.exports.unassignedPower = unassignedPower;

module.exports.readSolar = async function readSolar(adapter) {
    const { solarPowerId, feedInPowerId, batterySocId } = adapter.config;
    if (!solarPowerId && !feedInPowerId && !batterySocId) return null;
    const [solar, feedIn, battery] = await Promise.all([
        readMeterState(adapter, solarPowerId, powerUnits),
        readMeterState(adapter, feedInPowerId, powerUnits),
        readMeterState(adapter, batterySocId, { '%': 1 }),
    ]);
    const soc = battery.value;
    return { solarW: solar.value, feedInW: feedIn.value, batterySoc: soc !== null && soc >= 0 && soc <= 100 ? soc : null };
};
