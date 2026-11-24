'use strict';

const translations = {
    en: {
        overview: 'Overview', devices: 'Devices', rooms: 'Rooms', statistics: 'Consumption statistics',
        prices: 'Electricity prices', contract: 'Electricity contract', updates: 'Updates', device: 'Device',
        room: 'Room', power: 'Current power', meter: 'Meter reading', source: 'Source', market: 'Market price',
        tariff: 'Contract rate', today: 'Today', seven: 'Last 7 days', month: 'This month', quarter: 'This quarter',
        year: 'This year', period: 'Period', start: 'Start', end: 'End', todayEnergy: 'Consumption today',
        todayCost: 'Recorded variable cost today', unassigned: 'Unassigned', noDevices: 'No meters discovered.',
        noPrices: 'No price data available.', noHistory: 'No consumption recorded for this period.',
        coverage: 'Totals cover the selected measurement points. Exclude overlapping meters in the instance settings.',
        deviceHint: 'Add a meter, channel or device to the Strommessung enum, or configure it manually.',
        priceHint: 'aWATTar day-ahead prices for Germany, before taxes and surcharges. Times shown in Europe/Berlin.',
        costHint: 'Variable costs cover consumption with an attributable tariff. Monthly charges are shown under Electricity contract.',
        contractHint: 'Edit the tariff components in the Energy Manager instance settings.',
        fixed: 'Monthly fixed charge (gross)', extra: 'Surcharges (net)', advance: 'Monthly advance',
        contractStart: 'Contract start', ready: 'Updated', waiting: 'Waiting for the first snapshot',
        stale: 'Last available snapshot', offline: 'Disconnected', connectionError: 'Could not read ioBroker data',
        socketError: 'The ioBroker socket client could not be loaded', installed: 'Installed version',
        releases: 'View releases and changelog', excluded: 'Excluded', enum: 'Energy measurement enum',
        manual: 'Manual', shelly: 'Shelly', priced: 'priced', instance: 'ioBroker instance',
    },
    de: {
        overview: 'Übersicht', devices: 'Geräte', rooms: 'Räume', statistics: 'Verbrauchsstatistik',
        prices: 'Strompreise', contract: 'Stromvertrag', updates: 'Updates', device: 'Gerät', room: 'Raum',
        power: 'Aktuelle Leistung', meter: 'Zählerstand', source: 'Quelle', market: 'Börsenpreis',
        tariff: 'Vertragstarif', today: 'Heute', seven: 'Letzte 7 Tage', month: 'Dieser Monat', quarter: 'Dieses Quartal',
        year: 'Dieses Jahr', period: 'Zeitraum', start: 'Beginn', end: 'Ende', todayEnergy: 'Verbrauch heute',
        todayCost: 'Erfasste variable Kosten heute', unassigned: 'Ohne Raum', noDevices: 'Keine Messgeräte gefunden.',
        noPrices: 'Keine Strompreise verfügbar.', noHistory: 'In diesem Zeitraum wurde kein Verbrauch erfasst.',
        coverage: 'Die Summe umfasst die ausgewählten Messpunkte. Überlappende Zähler lassen sich in der Instanzkonfiguration ausschließen.',
        deviceHint: 'Füge einen Zähler, Kanal oder ein Gerät zur Aufzählung Strommessung hinzu oder hinterlege es manuell.',
        priceHint: 'aWATTar-Spotmarktpreise für Deutschland vor Steuern und Aufschlägen. Uhrzeit in Europe/Berlin.',
        costHint: 'Die variablen Kosten umfassen Verbrauch mit zuordenbarem Tarif. Monatliche Fixkosten stehen unter Stromvertrag.',
        contractHint: 'Die Tarifbestandteile lassen sich in der Instanzkonfiguration bearbeiten.',
        fixed: 'Monatliche Fixkosten (brutto)', extra: 'Aufschläge (netto)', advance: 'Monatlicher Abschlag',
        contractStart: 'Vertragsbeginn', ready: 'Messstand', waiting: 'Warte auf den ersten Messstand',
        stale: 'Letzter verfügbarer Messstand', offline: 'Verbindung getrennt', connectionError: 'ioBroker-Daten konnten nicht gelesen werden',
        socketError: 'Der ioBroker-Socket-Client konnte nicht geladen werden', installed: 'Installierte Version',
        releases: 'Versionen und Änderungsprotokoll ansehen', excluded: 'Ausgeschlossen', enum: 'Aufzählung Strommessung',
        manual: 'Manuell', shelly: 'Shelly', priced: 'bewertet', instance: 'ioBroker-Instanz',
    },
};

const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const adminTab = location.pathname.endsWith('/tab.html');
const pages = ['overview', 'devices', 'rooms', 'statistics', 'prices', 'contract', 'updates'];
const periods = ['today', 'seven', 'month', 'quarter', 'year'];
let language = 'en';
let words = translations.en;
let snapshot;
let displayStatus = 'waiting';

function node(tag, value, className) {
    const item = document.createElement(tag);
    if (value != null) item.textContent = value;
    if (className) item.className = className;
    return item;
}

function format(value, unit, digits = 2) {
    if (!Number.isFinite(value)) return '–';
    if (unit === 'W' && Math.abs(value) >= 1000) return format(value / 1000, 'kW');
    return value.toLocaleString(language, { maximumFractionDigits: digits }) + ' ' + unit;
}

function dateTime(value) {
    return new Date(value).toLocaleString(language, { timeZone: 'Europe/Berlin', timeZoneName: 'short' });
}

function dayKey(value) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}

function updateStatus() {
    const stale = snapshot && Date.now() - snapshot.ts > 120000;
    const key = stale && displayStatus === 'ready' ? 'stale' : displayStatus;
    el('status').textContent = words[key] + (snapshot ? ' · ' + dateTime(snapshot.ts) : '');
}

function selectPage() {
    const hash = location.hash.slice(1);
    const active = pages.includes(hash) ? hash : 'overview';
    for (const page of pages) el(page).hidden = page !== active;
    for (const link of el('navigation').children) {
        if (link.hash === '#' + active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    }
}

function translate() {
    document.documentElement.lang = language;
    words = translations[language];
    for (const item of document.querySelectorAll('[data-text]')) item.textContent = words[item.dataset.text];
    el('instance').setAttribute('aria-label', words.instance);
    el('navigation').replaceChildren(...pages.map(page => {
        const link = node('a', words[page]);
        link.href = '#' + page;
        return link;
    }));
    const period = el('period').value || 'today';
    el('period').replaceChildren(...periods.map(key => new Option(words[key], key)));
    el('period').value = period;
    selectPage();
    render();
}

function cards(target, entries) {
    el(target).replaceChildren(...entries.map(([label, value, detail]) => {
        const card = node('article');
        card.append(node('p', label), node('strong', value, 'value'));
        if (detail) card.append(node('small', detail));
        return card;
    }));
}

function rows(target, records, empty, columns) {
    const result = records.map(record => {
        const row = node('tr');
        row.append(...record.map(value => node('td', value)));
        return row;
    });
    if (!result.length) {
        const row = node('tr');
        const cell = node('td', empty);
        cell.colSpan = columns;
        row.append(cell);
        result.push(row);
    }
    el(target).replaceChildren(...result);
}

function renderStats() {
    const today = dayKey(Date.now());
    const start = new Date(today + 'T12:00:00Z');
    switch (el('period').value) {
        case 'seven': start.setUTCDate(start.getUTCDate() - 6); break;
        case 'month': start.setUTCDate(1); break;
        case 'quarter': start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3, 1); break;
        case 'year': start.setUTCMonth(0, 1); break;
    }
    const from = start.toISOString().slice(0, 10);
    const days = Object.entries(snapshot?.daily || {}).filter(([key]) => key >= from && key <= today).sort();
    const total = key => days.reduce((sum, [, day]) => sum + (day[key] || 0), 0);
    const priced = total('pricedKWh');
    el('statsTotal').textContent = days.length ? [
        format(total('kWh'), 'kWh', 3),
        priced > 0 && format(total('costEUR'), '€') + ' · ' + format(priced, 'kWh', 3) + ' ' + words.priced,
    ].filter(Boolean).join(' · ') : words.noHistory;
    const max = Math.max(0.001, ...days.map(([, day]) => day.kWh));
    el('statsBars').replaceChildren(...days.map(([key, day]) => {
        const row = node('div', null, 'stat-row');
        const progress = node('progress');
        progress.max = max;
        progress.value = day.kWh;
        progress.setAttribute('aria-label', key + ': ' + format(day.kWh, 'kWh', 3));
        row.append(node('small', key), progress, node('small', format(day.kWh, 'kWh', 3)));
        return row;
    }));
}

function render() {
    const data = snapshot || {};
    const today = data.daily?.[dayKey(Date.now())];
    updateStatus();
    cards('summary', [
        [words.power, format(data.totalPower, 'W')], [words.todayEnergy, format(today?.kWh, 'kWh', 3)],
        [words.market, format(data.marketCt, 'ct/kWh')], [words.tariff, format(data.tariffCt, 'ct/kWh')],
        [words.todayCost, format(today?.pricedKWh > 0 ? today.costEUR : null, '€')],
    ]);
    rows('deviceRows', (data.devices || []).map(device => [
        device.name || device.id, device.room || words.unassigned, format(device.powerW, 'W'),
        format(device.energyKWh, 'kWh', 3), [words[device.source], device.exclude && words.excluded].filter(Boolean).join(' · '),
    ]), words.noDevices, 5);
    cards('roomCards', (data.rooms || []).map(room => [
        room.name === 'Ohne Raum' ? words.unassigned : room.name || words.unassigned,
        format(room.powerW, 'W'), room.devices + ' · ' + words.devices,
    ]));
    if (!data.rooms?.length) el('roomCards').append(node('p', words.noDevices));
    rows('priceRows', (data.prices || []).filter(price => price.end_timestamp > Date.now()).map(price => [
        dateTime(price.start_timestamp), dateTime(price.end_timestamp), format(price.marketprice / 10, 'ct/kWh'),
    ]), words.noPrices, 3);
    const contract = data.contract || {};
    cards('contractCards', [
        [words.fixed, format(contract.configured ? contract.fixedMonthlyGross : null, '€')],
        [words.extra, format(contract.configured ? contract.extraCt : null, 'ct/kWh')],
        [words.advance, format(contract.configured ? contract.advanceMonthly : null, '€')],
        [words.contractStart, contract.start || '–'],
    ]);
    el('installed').textContent = words.installed + ' · ' + (data.version || '–');
    renderStats();
}

const instanceSelect = el('instance');
const given = params.get('instance') ?? location.search.slice(1);
const defaultInstance = /^\d+$/.test(given) ? given : '0';
instanceSelect.add(new Option('energy-manager.' + defaultInstance, defaultInstance));
let socket;
let stateId;
let connected = false;
let subscribed = false;
let lastAccessToken;

function accept(state) {
    try {
        const data = typeof state?.val === 'string' ? JSON.parse(state.val) : state?.val;
        if (!Number.isFinite(data?.ts)) throw Error('Missing snapshot');
        if (snapshot && data.ts < snapshot.ts) return;
        snapshot = data;
        displayStatus = 'ready';
    } catch {
        displayStatus = 'waiting';
    }
    render();
}

function read() {
    const requested = stateId;
    socket.emit('getState', requested, (error, state) => {
        if (!connected || stateId !== requested) return;
        if (error) {
            displayStatus = 'connectionError';
            updateStatus();
        } else accept(state);
    });
}

function selectInstance() {
    if (subscribed) socket.emit('unsubscribe', stateId);
    stateId = 'energy-manager.' + instanceSelect.value + '.snapshot';
    subscribed = false;
    snapshot = null;
    displayStatus = 'waiting';
    render();
    if (connected) subscribe();
}

function subscribe() {
    socket.emit('subscribe', stateId);
    subscribed = true;
    read();
}

function onConnect() {
    if (connected) return;
    connected = true;
    subscribe();
    if (adminTab) {
        socket.emit('getObjectView', 'system', 'instance', {
            startkey: 'system.adapter.energy-manager.', endkey: 'system.adapter.energy-manager.\u9999',
        }, (error, view) => {
            if (error || !view?.rows?.length) return;
            const selected = instanceSelect.value;
            for (const row of view.rows) {
                const id = row.id?.split('.').at(-1);
                if (/^\d+$/.test(id) && ![...instanceSelect.options].some(option => option.value === id)) {
                    instanceSelect.add(new Option('energy-manager.' + id, id));
                }
            }
            if (!/^\d+$/.test(given) && !view.rows.some(row => row.id?.endsWith('.' + selected))) {
                instanceSelect.value = view.rows[0].id.split('.').at(-1);
                if (instanceSelect.value) selectInstance();
            }
        });
    }
}

function syncAdminSession(force = false) {
    // The enclosing Admin owns renewal. Forward its current access token only
    // to the same-origin Admin socket so the read-only session can stay active.
    try {
        const value = window.sessionStorage.getItem('iob_tokens') || window.localStorage.getItem('iob_tokens');
        const [, , token, expires] = (value || '').split(';');
        if (!token || !(Date.parse(expires) > Date.now()) || !force && token === lastAccessToken) return;
        socket.emit('updateTokenExpiration', token, (error, accepted) => {
            if (!error && accepted) lastAccessToken = token;
        });
    } catch {
        // Without storage, the socket can still use its same-origin session cookie.
    }
}

function script(url) {
    return new Promise((resolve, reject) => {
        const element = node('script');
        element.src = url;
        element.onload = resolve;
        element.onerror = reject;
        document.head.append(element);
    });
}

async function connect() {
    try {
        if (adminTab) await script('../../_socket/info.js').catch(() => {});
        const locale = params.get('lang') || window.sysLang || navigator.language;
        language = locale.toLowerCase().startsWith('de') ? 'de' : 'en';
        translate();
        await script(adminTab ? '../../lib/js/socket.io.js' : '../socket.io/socket.io.js');
        const base = new URL(adminTab ? '../../' : '../', location.href);
        const options = { path: base.pathname + 'socket.io', query: 'ws=true', name: 'energy-manager' };
        if (!adminTab) options.transports = ['websocket'];
        const client = window.io || window.iob;
        socket = client.connect ? client.connect(base.origin + (window.socketPath || ''), options) : client(base.origin, options);
        socket.on('stateChange', (id, state) => { if (id === stateId && connected) accept(state); });
        socket.on('disconnect', () => {
            connected = false;
            subscribed = false;
            lastAccessToken = undefined;
            displayStatus = 'offline';
            updateStatus();
        });
        socket.on('connect_error', () => { displayStatus = 'connectionError'; updateStatus(); });
        const authenticate = () => {
            if (adminTab) {
                socket.emit('authenticate', ok => {
                    if (ok === true) onConnect();
                    else { displayStatus = 'connectionError'; updateStatus(); }
                });
            } else onConnect();
        };
        if (adminTab) {
            socket.on('reauthenticate', () => syncAdminSession(true));
            window.addEventListener('storage', event => {
                if (event.key === 'iob_tokens' && connected) syncAdminSession();
            });
        }
        socket.on('connect', authenticate);
        socket.on('reconnect', authenticate);
        if (socket.connected) authenticate();
        window.setInterval(() => {
            if (!connected) return;
            if (adminTab) syncAdminSession();
            read();
        }, 30000);
        window.setInterval(updateStatus, 10000);
    } catch {
        displayStatus = 'socketError';
        updateStatus();
    }
}

window.addEventListener('hashchange', selectPage);
instanceSelect.addEventListener('change', selectInstance);
el('period').addEventListener('change', renderStats);
translate();
selectInstance();
void connect();
