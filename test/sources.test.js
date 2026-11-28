'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const readDevices = require('../lib/sources');

test('Strommessung accepts states and channels across vendors and groups room assignment', async () => {
    const state = unit => ({ type: 'state', common: { type: 'number', unit } });
    const objects = {
        'enum.functions.meter': { common: { name: { de: 'Strommessung' }, members: ['zigbee.0.socket', 'mqtt.0.socket.total'] } },
        'enum.rooms.office': { common: { name: 'Office', members: ['zigbee.0.socket.power'] } },
        'zigbee.0.socket': { type: 'device', common: { name: 'Socket' } },
        'zigbee.0.socket.power': state('kW'),
        'zigbee.0.socket.total': state('Wh'),
        'zigbee.0.socket.today': state('kWh'),
        'zigbee.0.socket.temperature': state('°C'),
        'mqtt.0.socket.total': state('kWh'),
        'shelly.0.device.Power': state('W'),
    };
    const adapter = {
        config: { autoShelly: false },
        getForeignObjectAsync: async id => objects[id],
        getForeignObjectsAsync: async (pattern, type) => Object.fromEntries(
            Object.entries(objects).filter(([id, object]) => id.startsWith(pattern.slice(0, -1)) && (type === 'enum' || object.type === type)),
        ),
        getForeignStateAsync: async id => ({ val: id.endsWith('.total') ? 1500 : 1.25, ts: 10 }),
    };
    const devices = await readDevices(adapter);
    assert.equal(devices.length, 2);
    assert.equal(devices[0].energyKWh, 1500);
    assert.equal(devices[1].powerW, 1250);
    assert.equal(devices[1].energyKWh, 1.5);
    assert.equal(devices[1].room, 'Office');
});

test('manual exclusion takes precedence over the Shelly fallback', async () => {
    const id = 'shelly.0.socket.Power';
    const power = { type: 'state', common: { type: 'number', unit: 'W' } };
    const devices = await readDevices({
        config: { sources: [{ powerId: id, exclude: true }] },
        getForeignObjectsAsync: async pattern => pattern === 'shelly.*' ? { [id]: power } : {},
        getForeignObjectAsync: async stateId => stateId === id ? power : null,
        getForeignStateAsync: async () => ({ val: 25 }),
    });
    assert.equal(devices.length, 1);
    assert.equal(devices[0].powerW, 25);
    assert.equal(devices[0].exclude, true);
});

test('keeps live power and aliases distinct for identically named channels in one room', async () => {
    const first = 'shelly.0.washer.relay0';
    const second = 'shelly.0.dryer.relay0';
    const measurement = unit => ({ type: 'state', common: { type: 'number', unit } });
    const objects = {
        'enum.functions.meter': { type: 'enum', common: { name: 'Strommessung', members: [first, second] } },
        'enum.rooms.utility': { type: 'enum', common: { name: 'Utility', members: [first, second] } },
        'shelly.0.washer': { type: 'device', common: { name: 'Washer' } },
        'shelly.0.dryer': { type: 'device', common: { name: 'Dryer' } },
        [first]: { type: 'channel', common: { name: 'Channel Relay0' } },
        [second]: { type: 'channel', common: { name: 'Channel Relay0' } },
        [first + '.MaxPower']: measurement('W'),
        [first + '.Power']: measurement('W'),
        [second + '.MaxPower']: measurement('W'),
        [second + '.Power']: measurement('kW'),
    };
    const values = { [first + '.Power']: 247, [second + '.Power']: 1.25 };
    const config = { autoShelly: false, deviceAliases: { ['meter:' + first + '.Power']: 'Laundry' } };
    const discover = () => readDevices({
        config: JSON.parse(JSON.stringify(config)),
        getForeignObjectAsync: async id => objects[id],
        getForeignObjectsAsync: async (pattern, type) => Object.fromEntries(
            Object.entries(objects).filter(([id, item]) => id.startsWith(pattern.slice(0, -1)) && item.type === type),
        ),
        getForeignStateAsync: async id => ({ val: values[id] ?? 2500 }),
    });
    for (let discovery = 0; discovery < 2; discovery++) {
        const devices = await discover();
        const washer = devices.find(device => device.id === first);
        const dryer = devices.find(device => device.id === second);
        assert.equal(devices.length, 2);
        assert.equal(washer.name, 'Laundry');
        assert.equal(washer.room, dryer.room);
        assert.equal(washer.originalName, 'Washer / Channel Relay0');
        assert.equal(washer.powerId, first + '.Power');
        assert.equal(washer.powerUnit, 'W');
        assert.equal(washer.powerW, 247);
        assert.equal(dryer.name, 'Dryer / Channel Relay0');
        assert.equal(dryer.powerUnit, 'kW');
        assert.equal(dryer.powerW, 1250);
    }
});

test('reports the main meter reading separately from power and diagnoses a missing or invalid reading', async () => {
    const objects = { power: { type: 'state', common: { unit: 'kW' } },
        energy: { type: 'state', common: { unit: 'Wh' } } };
    const states = { power: { val: 2.89, ts: 30 }, energy: { val: 15000, ts: 25 } };
    const adapter = {
        config: { housePowerId: 'power' },
        getForeignObjectAsync: async id => objects[id],
        getForeignStateAsync: async id => states[id],
    };
    assert.deepEqual(await readDevices.readHouseMeter(adapter), {
        powerW: 2890, powerTs: 30, energyStatus: 'unconfigured',
    });
    adapter.config.houseEnergyId = 'wrongId';
    assert.equal((await readDevices.readHouseMeter(adapter)).energyStatus, 'missing');
    adapter.config.houseEnergyId = 'energy';
    assert.equal((await readDevices.readHouseMeter(adapter)).energyKWh, 15);
    states.energy.q = 1;
    assert.equal((await readDevices.readHouseMeter(adapter)).energyStatus, 'unavailable');
    objects.energy.common.unit = 'W';
    assert.equal((await readDevices.readHouseMeter(adapter)).energyStatus, 'unit');
});

test('only compares fresh, distinct main and submeter power readings', async () => {
    const now = 100000;
    const meter = { powerW: 2890, powerTs: now - 5000 };
    const device = { powerId: 'device', powerW: 2570, powerTs: now - 10000 };
    const adapter = {
        config: { housePowerId: 'main' },
        getForeignObjectAsync: async id => ({ type: 'state', common: id.startsWith('alias.')
            ? { alias: { id: { read: id === 'alias.main' ? 'main' : 'device' } } } : {} }),
    };
    const difference = (...devices) => readDevices.unassignedPower(adapter, meter, devices, now);
    assert.deepEqual(await difference(device, { ...device, exclude: true }), {
        unassignedW: 320, unassignedUntil: now + 50000,
    });
    for (const changed of [
        { powerTs: now - 60000 }, { powerTs: now - 35001 }, { powerTs: now + 1 },
        { powerW: null }, { powerW: 3000 }, { powerW: -1 }, { powerId: 'alias.main' },
    ]) {
        assert.equal(await difference({ ...device, ...changed }), null);
    }
    assert.equal(await difference(device, { ...device, powerId: 'alias.device' }), null);
    assert.equal(await difference({ ...device, exclude: true }), null);
});

test('alias chains cannot count a main meter or another selected meter twice', async () => {
    const state = (alias) => ({ type: 'state', common: { type: 'number', unit: 'W', ...(alias && { alias: { id: alias } }) } });
    const objects = {
        'meter.0.main.power': state(),
        'meter.0.device.power': state(),
        'alias.0.main.power': state({ read: 'meter.0.main.power' }),
        'alias.0.device.power': state({ read: 'alias.0.second.power' }),
        'alias.0.second.power': state('meter.0.device.power'),
        'alias.0.loop.power': state('alias.0.loop.power'),
    };
    const ids = ['alias.0.main.power', 'alias.0.device.power', 'meter.0.device.power', 'alias.0.loop.power'];
    const devices = await readDevices({
        config: { autoShelly: false, housePowerId: 'meter.0.main.power', sources: ids.map(powerId => ({ powerId })) },
        getForeignObjectsAsync: async () => ({}),
        getForeignObjectAsync: async id => objects[id],
        getForeignStateAsync: async () => ({ val: 50 }),
    });
    assert.deepEqual(devices.map(device => device.powerId), ['alias.0.device.power']);
});
