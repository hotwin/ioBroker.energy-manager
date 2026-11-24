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
        'zigbee.0.socket.maxPower': state('W'),
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
    assert.equal(devices[1].powerId, 'zigbee.0.socket.power');
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
