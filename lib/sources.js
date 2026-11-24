'use strict';

const powerUnits = { W: 1, kW: 1000 };
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

async function readDevices(adapter) {
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
        const unit = object.common?.unit;
        if (object.common?.type !== 'number' || !unit) return;
        const kind = Object.hasOwn(powerUnits, unit) ? 'power' : 'energy';
        if (kind === 'energy' && (!Object.hasOwn(energyUnits, unit) ||
            /price|cost|forecast|today|yesterday|daily|monthly|weekly|currentday/i.test(id))) return;
        const stateName = id.split('.').at(-1);
        if (kind === 'power' && (
            /^(?:level|switch|button)(?:\.|$)/.test(object.common.role || '') ||
            /limit|threshold|(?:^|[_-])(?:max|min)(?:[_-]|$)|^(?:max|min)power|power(?:max|min)$/i.test(stateName)
        )) return;
        const base = parent(id);
        const group = groups.get(base) || { id: base, source };
        if (!group[kind] || members.has(id) && !members.has(group[kind].id)) {
            group[kind] = { id, unit };
        }
        groups.set(base, group);
    }

    for (const member of [...members].sort()) {
        if (member.startsWith('energy-manager.') || member.startsWith('system.')) continue;
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
        const measured = (state, meter, units) => Number.isFinite(state?.val) &&
            (!state.q || state.q === 0) && Object.hasOwn(units, meter.unit) ? state.val * units[meter.unit] : null;
        const matching = prefix => enums.filter(([id, object]) => id.startsWith(prefix) &&
            object.common?.members?.some(member => ids.some(id => contains(member, id))));
        const object = await getObject(group.source === 'manual' ? parent(group.id) : group.id);
        const deviceName = label(object?.common?.name);
        const parentName = group.source === 'shelly' ? label((await getObject(parent(group.id)))?.common?.name) : null;
        devices.push({
            id: group.id,
            name: group.name || [parentName, deviceName].filter(Boolean).join(' / ') || group.id,
            room: group.room || label(matching('enum.rooms.')[0]?.[1].common.name) || '',
            functions: matching('enum.functions.').map(([id, item]) => label(item.common.name) || id),
            exclude: Boolean(group.exclude),
            source: group.source,
            powerW: measured(power, group.power, powerUnits),
            energyKWh: measured(energy, group.energy, energyUnits),
            ts: Math.max(power?.ts || 0, energy?.ts || 0) || null,
            powerId: group.power?.id,
            meterId: group.energy?.id,
        });
    }

    for (const source of Array.isArray(adapter.config.sources) ? adapter.config.sources : []) {
        if (!source) continue;
        const power = source.powerId && { id: source.powerId,
            unit: (await getObject(source.powerId))?.common?.unit === 'kW' ? 'kW' : 'W' };
        const energy = source.energyId && { id: source.energyId,
            unit: Object.hasOwn(energyUnits, source.unit) ? source.unit : (await getObject(source.energyId))?.common?.unit };
        await append({ ...source, id: source.powerId || source.energyId, power, energy, source: 'manual' });
    }
    for (const group of groups.values()) await append(group);
    return devices;
}

module.exports = readDevices;
