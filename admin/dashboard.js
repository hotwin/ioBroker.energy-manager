'use strict';

const translations = {
    en: {
        roomDevices: count => count === 1 ? '1 device' : count + ' devices',
        roomPower: 'Current draw', roomNoReading: 'No power reading',
        roomExcluded: 'Excluded from total',
        energyFlow: 'Energy flow', capturedEnergy: 'Recorded energy', yesterday: 'Yesterday',
        hourlyUsage: 'Hourly consumption', weeklyCosts: 'Daily costs · last 7 days',
        priceHistory: 'Electricity price history',
        priceChartLegend: 'Blue · spot price. Green · gross energy rate. ct/kWh.',
        flowDetail: 'Rooms and devices', chartsNoData: 'No measurements for this period.',
        flowCoverage: 'Device history is available from the start of recording in this version.',
        missingMeasurement: 'No measurement', missingPrice: 'No cost recorded',
        editName: 'Edit device name', saveName: 'Save', resetName: 'Restore original name', cancelName: 'Cancel',
        aliasError: 'Could not save the device name. Check your instance configuration permissions.',
        overview: 'Overview', devices: 'Devices', rooms: 'Rooms', statistics: 'Consumption statistics',
        prices: 'Electricity prices', contract: 'Electricity contract', updates: 'Updates', device: 'Device',
        room: 'Room', power: 'Current power', meter: 'Meter reading', source: 'Source', market: 'Market price',
        tariff: 'Gross contract rate', today: 'Today', seven: 'Last 7 days', month: 'This month', quarter: 'This quarter',
        year: 'This year', period: 'Period', start: 'Start', end: 'End', todayEnergy: 'Consumption today',
        todayCost: 'Recorded variable cost today', unassigned: 'Unassigned', noDevices: 'No meters discovered.',
        noPrices: 'No price data available.', noHistory: 'No consumption recorded for this period.',
        coverage: 'Totals cover the selected measurement points. Exclude overlapping meters in the instance settings.',
        deviceHint: 'Add a meter, channel or device to the Strommessung enum, or configure it manually.',
        priceHint: 'aWATTar day-ahead prices for Germany, before taxes and surcharges. The gross rate uses your configured contract components. Times shown in Europe/Berlin.',
        costHint: 'Variable costs cover consumption with an attributable tariff. Monthly charges are shown under Electricity contract.',
        contractHint: 'Use the amounts from your contract. Enter 0 for charges that do not apply.',
        contractWebHint: 'Open Energy Manager in ioBroker Admin to edit the contract.',
        provider: 'Provider', tariffName: 'Tariff name', tariffFormula: 'Pricing formula',
        additive: 'German spot price plus fixed surcharges', awattarHourly: 'aWATTar Germany HOURLY',
        unsupported: 'Other formula (calculation unavailable)',
        baseMonthly: 'Base charge (€/month net)', meterAnnual: 'Metering (€/year net)',
        markupCt: 'Fixed provider surcharge (ct/kWh net)', networkCt: 'Grid fees (ct/kWh net)',
        electricityTaxCt: 'Electricity tax (ct/kWh net)', concessionCt: 'Concession fee (ct/kWh net)',
        leviesCt: 'Levies (ct/kWh net)', vatPercent: 'VAT (%)', advanceMonthly: 'Advance payment (€/month gross)',
        marketMarkupPercent: 'Surcharge on absolute spot price (%)',
        energyMinGrossCt: 'Minimum energy price (ct/kWh gross, optional)',
        energyMaxGrossCt: 'Maximum energy price (ct/kWh gross, optional)',
        tariffConfigured: 'Enable contract pricing (immediately if no start date is set)',
        saveContract: 'Save contract', contractLoading: 'Loading contract …',
        contractLoadError: 'Could not read this instance configuration.',
        contractSaveError: 'Save could not be confirmed. Check your connection and write permission.',
        contractSaved: 'Contract saved. The adapter will refresh prices automatically.',
        invalidNumber: 'Enter a valid amount with a decimal point or comma.',
        missingAmount: 'Enter the contract amount, or 0 if this charge does not apply.',
        invalidLimit: 'The maximum must be at least the minimum.',
        inactive: 'Contract pricing is disabled.', incomplete: 'Required contract amounts are missing or invalid.',
        future: 'The contract has not started yet.', noMarket: 'No current market price is available.',
        fixed: 'Monthly fixed charge (gross)', extra: 'Surcharges (net)', advance: 'Monthly advance',
        contractStart: 'Contract start', ready: 'Updated', waiting: 'Waiting for the first snapshot',
        stale: 'Last available snapshot', offline: 'Disconnected', connectionError: 'Could not read ioBroker data',
        socketError: 'The ioBroker socket client could not be loaded', installed: 'Installed version',
        releases: 'View releases and changelog', excluded: 'Excluded', enum: 'Energy measurement enum',
        manual: 'Manual', shelly: 'Shelly', priced: 'priced', instance: 'ioBroker instance',
    },
    de: {
        roomDevices: count => count === 1 ? '1 Gerät' : count + ' Geräte',
        roomPower: 'Aktuelle Leistung', roomNoReading: 'Kein Leistungswert',
        roomExcluded: 'Nicht in der Summe',
        energyFlow: 'Energiefluss', capturedEnergy: 'Erfasste Energie', yesterday: 'Gestern',
        hourlyUsage: 'Stundenverbrauch', weeklyCosts: 'Tageskosten · letzte 7 Tage',
        priceHistory: 'Strompreisverlauf',
        priceChartLegend: 'Blau · Börsenpreis. Grün · Brutto-Arbeitspreis. ct/kWh.',
        flowDetail: 'Räume und Geräte', chartsNoData: 'Für diesen Zeitraum liegen keine Messwerte vor.',
        flowCoverage: 'Die Gerätehistorie beginnt mit der Aufzeichnung in dieser Version.',
        missingMeasurement: 'Kein Messwert', missingPrice: 'Keine Kosten erfasst',
        editName: 'Gerätenamen bearbeiten', saveName: 'Speichern', resetName: 'Originalnamen wiederherstellen', cancelName: 'Abbrechen',
        aliasError: 'Der Gerätename konnte nicht gespeichert werden. Prüfe deine Berechtigung für die Instanzkonfiguration.',
        overview: 'Übersicht', devices: 'Geräte', rooms: 'Räume', statistics: 'Verbrauchsstatistik',
        prices: 'Strompreise', contract: 'Stromvertrag', updates: 'Updates', device: 'Gerät', room: 'Raum',
        power: 'Aktuelle Leistung', meter: 'Zählerstand', source: 'Quelle', market: 'Börsenpreis',
        tariff: 'Brutto-Arbeitspreis', today: 'Heute', seven: 'Letzte 7 Tage', month: 'Dieser Monat', quarter: 'Dieses Quartal',
        year: 'Dieses Jahr', period: 'Zeitraum', start: 'Beginn', end: 'Ende', todayEnergy: 'Verbrauch heute',
        todayCost: 'Erfasste variable Kosten heute', unassigned: 'Ohne Raum', noDevices: 'Keine Messgeräte gefunden.',
        noPrices: 'Keine Strompreise verfügbar.', noHistory: 'In diesem Zeitraum wurde kein Verbrauch erfasst.',
        coverage: 'Die Summe umfasst die ausgewählten Messpunkte. Überlappende Zähler lassen sich in der Instanzkonfiguration ausschließen.',
        deviceHint: 'Füge einen Zähler, Kanal oder ein Gerät zur Aufzählung Strommessung hinzu oder hinterlege es manuell.',
        priceHint: 'aWATTar-Spotmarktpreise für Deutschland vor Steuern und Aufschlägen. Der Bruttopreis basiert auf deinen hinterlegten Vertragsbestandteilen. Uhrzeit in Europe/Berlin.',
        costHint: 'Die variablen Kosten umfassen Verbrauch mit zuordenbarem Tarif. Monatliche Fixkosten stehen unter Stromvertrag.',
        contractHint: 'Übernimm die Beträge aus deinem Vertrag. Gib 0 ein, wenn ein Posten entfällt.',
        contractWebHint: 'Öffne den Energy Manager im ioBroker Admin, um den Vertrag zu bearbeiten.',
        provider: 'Anbieter', tariffName: 'Tarifname', tariffFormula: 'Preisformel',
        additive: 'Deutscher Börsenpreis plus feste Aufschläge', awattarHourly: 'aWATTar Deutschland HOURLY',
        unsupported: 'Andere Formel (Berechnung nicht verfügbar)',
        baseMonthly: 'Grundpreis (€/Monat netto)', meterAnnual: 'Messstellenbetrieb (€/Jahr netto)',
        markupCt: 'Fester Anbieteraufschlag (ct/kWh netto)', networkCt: 'Netzentgelte (ct/kWh netto)',
        electricityTaxCt: 'Stromsteuer (ct/kWh netto)', concessionCt: 'Konzessionsabgabe (ct/kWh netto)',
        leviesCt: 'Umlagen (ct/kWh netto)', vatPercent: 'MwSt. (%)', advanceMonthly: 'Abschlag (€/Monat brutto)',
        marketMarkupPercent: 'Aufschlag auf den Betrag des Börsenpreises (%)',
        energyMinGrossCt: 'Mindestpreis Energie (ct/kWh brutto, optional)',
        energyMaxGrossCt: 'Höchstpreis Energie (ct/kWh brutto, optional)',
        tariffConfigured: 'Tarifberechnung aktivieren (ohne Startdatum sofort)',
        saveContract: 'Vertrag speichern', contractLoading: 'Vertrag wird geladen …',
        contractLoadError: 'Die Konfiguration dieser Instanz konnte nicht gelesen werden.',
        contractSaveError: 'Speichern konnte nicht bestätigt werden. Prüfe Verbindung und Schreibrechte.',
        contractSaved: 'Vertrag gespeichert. Der Adapter aktualisiert die Preise automatisch.',
        invalidNumber: 'Gib einen gültigen Betrag mit Dezimalkomma oder Dezimalpunkt ein.',
        missingAmount: 'Gib den Vertragsbetrag ein oder 0, falls dieser Posten entfällt.',
        invalidLimit: 'Der Höchstpreis muss mindestens so hoch wie der Mindestpreis sein.',
        inactive: 'Die Tarifberechnung ist deaktiviert.', incomplete: 'Benötigte Vertragsbeträge fehlen oder sind ungültig.',
        future: 'Der Vertrag hat noch nicht begonnen.', noMarket: 'Es liegt kein aktueller Börsenpreis vor.',
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
const flowPeriods = ['today', 'yesterday', 'seven', 'month', 'year'];
const hourMs = 3600000;
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
    const flowPeriod = el('flowPeriod').value || 'today';
    el('flowPeriod').replaceChildren(...flowPeriods.map(key => new Option(words[key], key)));
    el('flowPeriod').value = flowPeriod;
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
        row.append(...record.map(value => {
            const cell = node('td');
            if (value instanceof Node) cell.append(value);
            else cell.textContent = value ?? '';
            return cell;
        }));
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

function periodBounds(period, now) {
    const end = new Date(dayKey(now) + 'T12:00:00Z');
    if (period === 'yesterday') end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    switch (period) {
        case 'seven': start.setUTCDate(start.getUTCDate() - 6); break;
        case 'month': start.setUTCDate(1); break;
        case 'quarter': start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3, 1); break;
        case 'year': start.setUTCMonth(0, 1); break;
    }
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

function renderStats() {
    const [from, through] = periodBounds(el('period').value, Date.now());
    const days = Object.entries(snapshot?.daily || {}).filter(([key]) => key >= from && key <= through).sort();
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


function renderFlow(from, through) {
    const target = el('flowChart');
    const names = new Map((snapshot?.devices || []).map(device => [device.aliasKey || device.id, device.name]));
    const rooms = new Map();
    for (const [day, records] of Object.entries(snapshot?.deviceDays || {})) {
        if (day < from || day > through) continue;
        for (const [id, record] of Object.entries(records)) {
            if (!Number.isFinite(record.kWh) || record.kWh <= 0) continue;
            const devices = rooms.get(record.room) || new Map();
            const device = devices.get(id) || { name: names.get(id) || record.name, kWh: 0 };
            device.kWh += record.kWh;
            devices.set(id, device);
            rooms.set(record.room, devices);
        }
    }
    const groups = [...rooms].map(([name, devices]) => {
        const entries = [...devices.values()].sort((a, b) => b.kWh - a.kWh);
        return { name: name || words.unassigned, devices: entries, kWh: entries.reduce((sum, item) => sum + item.kWh, 0) };
    }).sort((a, b) => b.kWh - a.kWh);
    const total = groups.reduce((sum, room) => sum + room.kWh, 0);
    if (!total) {
        target.replaceChildren(node('p', words.chartsNoData), node('p', words.flowCoverage, 'note'));
        return;
    }

    const describe = item => item.name + ' · ' + format(item.kWh, 'kWh', 3) + ' · ' + format(item.kWh / total * 100, '%', 1);
    const canvas = node('canvas');
    canvas.width = 900;
    canvas.height = Math.max(180, 44 + groups.reduce((sum, room) => sum + room.devices.length * 30, 0));
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    const deviceCount = groups.reduce((sum, room) => sum + room.devices.length, 0);
    const scale = (canvas.height - 54 - deviceCount * 16) / total;
    ctx.font = '13px system-ui';
    ctx.textBaseline = 'middle';
    const ribbon = (x1, y1, x2, y2, height, color) => {
        const mid = (x1 + x2) / 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(mid, y1, mid, y2, x2, y2);
        ctx.lineTo(x2, y2 + height);
        ctx.bezierCurveTo(mid, y2 + height, mid, y1 + height, x1, y1 + height);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };
    const palette = ['#08796e', '#4169a7', '#925e25', '#83538d'];
    ctx.fillStyle = '#183135';
    ctx.fillText(words.capturedEnergy + ' · ' + format(total, 'kWh', 3), 12, 15, 245);
    ctx.fillRect(15, 40, 10, total * scale);
    const detail = node('details', null, 'flow-detail');
    const list = node('ul');
    detail.append(node('summary', words.flowDetail), list);
    let sourceY = 40;
    let roomY = 40;
    let deviceY = 40;
    groups.forEach((room, index) => {
        const height = room.kWh * scale;
        const color = palette[index % palette.length];
        const roomLabelY = roomY + height / 2 + 6;
        ribbon(25, sourceY, 300, roomY, height, color + '40');
        ctx.fillStyle = color;
        ctx.fillRect(300, roomY, 10, height);
        const item = node('li', describe(room));
        const children = node('ul');
        item.append(children);
        list.append(item);
        let nextRoomY = roomY;
        for (const device of room.devices) {
            const width = device.kWh * scale;
            ribbon(310, nextRoomY, 575, deviceY, width, color + '55');
            ctx.fillStyle = color;
            ctx.fillRect(575, deviceY, 10, width);
            ctx.fillStyle = '#183135';
            ctx.fillText(describe(device), 594, deviceY + 8, 296);
            children.append(node('li', describe(device)));
            nextRoomY += width;
            deviceY += 16 + width;
        }
        ctx.fillStyle = '#183135';
        ctx.fillText(describe(room), 320, Math.min(canvas.height - 10, roomLabelY), 245);
        sourceY += height;
        roomY = deviceY;
    });
    const wrapper = node('div', null, 'flow-surface');
    wrapper.append(canvas);
    target.replaceChildren(wrapper, detail, node('p', words.flowCoverage, 'note'));
}

function renderHistoryBars(id, points, unit, missing) {
    const peak = Math.max(0.001, ...points.map(([, value]) => Math.abs(value ?? 0)));
    el(id).replaceChildren(...points.map(([label, value]) => {
        const row = node('div', null, 'history-row');
        const middle = Number.isFinite(value) ? node('progress') : node('small', missing);
        if (Number.isFinite(value)) {
            middle.max = peak;
            middle.value = Math.abs(value);
            middle.setAttribute('aria-label', label + ' · ' + format(value, unit, 3));
        }
        row.append(node('small', label), middle, node('small', format(value, unit, 3)));
        return row;
    }));
}

function renderPriceHistory(now) {
    const canvas = el('priceChart');
    const status = el('priceHistoryStatus');
    const start = now - 24 * hourMs;
    const points = (snapshot?.priceHistory || []).filter(item => item.end_timestamp > start && item.start_timestamp < now);
    canvas.hidden = !points.length;
    status.textContent = points.length ? dateTime(start) + ' – ' + dateTime(now) : words.chartsNoData;
    if (!points.length) return;
    canvas.setAttribute('aria-label', words.priceHistory + '. ' + words.priceChartLegend + ' ' + status.textContent);
    const ctx = canvas.getContext('2d');
    const values = points.flatMap(item => [item.marketprice / 10, item.tariffCt]).filter(Number.isFinite);
    const low = Math.min(0, ...values);
    const high = Math.max(low + 1, ...values);
    const x = time => 60 + (time - start) / (now - start) * (canvas.width - 75);
    const y = rate => canvas.height - 20 - (rate - low) / (high - low) * (canvas.height - 40);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px system-ui';
    for (let step = 0; step <= 4; step++) {
        const rate = low + (high - low) * step / 4;
        ctx.strokeStyle = '#d6e5e3';
        ctx.beginPath();
        ctx.moveTo(60, y(rate));
        ctx.lineTo(canvas.width - 15, y(rate));
        ctx.stroke();
        ctx.fillStyle = '#183135';
        ctx.fillText(rate.toFixed(1), 4, y(rate) + 4);
    }
    for (const [color, value] of [['#4169a7', item => item.marketprice / 10], ['#08796e', item => item.tariffCt]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let previous;
        for (const item of [...points].sort((a, b) => a.start_timestamp - b.start_timestamp)) {
            const rate = value(item);
            if (!Number.isFinite(rate)) continue;
            const left = x(Math.max(start, item.start_timestamp));
            if (previous === item.start_timestamp) ctx.lineTo(left, y(rate));
            else ctx.moveTo(left, y(rate));
            ctx.lineTo(x(Math.min(now, item.end_timestamp)), y(rate));
            previous = item.end_timestamp;
        }
        ctx.stroke();
    }
}

function renderOverviewCharts() {
    const now = Date.now();
    const period = el('flowPeriod').value;
    renderFlow(...periodBounds(period, now));
    const hourDay = periodBounds(period === 'yesterday' ? 'yesterday' : 'today', now)[1];
    const utcMidday = Date.parse(hourDay + 'T12:00:00Z');
    const formatHour = new Intl.DateTimeFormat(language, {
        timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
    const hours = Array.from({ length: 28 }, (_, index) => utcMidday + (index - 14) * hourMs)
        .filter(time => time <= now && dayKey(time) === hourDay)
        .map(time => [formatHour.format(time), snapshot?.hourly?.[time]]);
    const [weekStart] = periodBounds('seven', now);
    const formatDay = new Intl.DateTimeFormat(language, { weekday: 'short', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
    const costs = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(Date.parse(weekStart + 'T12:00:00Z') + index * 86400000);
        const day = snapshot?.daily?.[date.toISOString().slice(0, 10)];
        return [formatDay.format(date), day?.pricedKWh > 0 ? day.costEUR : null];
    });
    renderHistoryBars('hourChart', hours, 'kWh', words.missingMeasurement);
    renderHistoryBars('costChart', costs, '€', words.missingPrice);
    renderPriceHistory(now);
}

function renderRooms(rooms, devices) {
    const target = el('roomCards');
    const details = [...target.querySelectorAll('details')];
    const openRooms = new Set(details.filter(item => item.open).map(item => item.dataset.room));
    const focusedRoom = details.find(item => item.firstElementChild === document.activeElement)?.dataset.room;
    const devicesByRoom = new Map();
    for (const device of devices) {
        const key = device.room || '';
        if (!devicesByRoom.has(key)) devicesByRoom.set(key, []);
        devicesByRoom.get(key).push(device);
    }
    if (!rooms.length) {
        target.replaceChildren(node('p', words.noDevices, 'surface'));
        return;
    }
    let focus;
    const cards = rooms.map(room => {
        const key = room.name || '';
        const name = !key || key === 'Ohne Raum' ? words.unassigned : key;
        const card = node('article', null, 'room-card');
        const header = node('div', null, 'room-heading');
        const icon = node('span', '⌂', 'room-icon');
        icon.setAttribute('aria-hidden', 'true');
        header.append(icon, node('h3', name));
        const power = node('div', null, 'room-power');
        power.append(node('strong', format(room.powerW, 'W'), 'value'),
            node('span', Number.isFinite(room.powerW) ? words.roomPower : words.roomNoReading));
        card.append(header, power);
        const localDevices = devicesByRoom.get(key) || [];
        if (!localDevices.length) {
            card.append(node('p', words.roomDevices(room.devices || 0), 'room-device-count'));
            return card;
        }
        const disclosure = node('details');
        disclosure.dataset.room = key;
        disclosure.open = openRooms.has(key);
        const summary = node('summary', words.roomDevices(localDevices.length));
        summary.setAttribute('aria-label', name + ' · ' + summary.textContent);
        if (key === focusedRoom) focus = summary;
        const list = node('ul', null, 'room-device-list');
        for (const device of localDevices) {
            const item = node('li');
            const label = node('span', device.name || device.id);
            if (device.exclude) label.append(node('small', words.roomExcluded));
            item.append(label, node('span', format(device.powerW, 'W'), 'room-device-power'));
            list.append(item);
        }
        disclosure.append(summary, list);
        card.append(disclosure);
        return card;
    });
    target.replaceChildren(...cards);
    focus?.focus({ preventScroll: true });
}

function render() {
    const data = snapshot || {};
    const today = data.daily?.[dayKey(Date.now())];
    updateStatus();
    const tiles = [
        ['ϟ', 'power', format(data.totalPower, 'W'), 'devices'],
        ['↗', 'todayEnergy', format(today?.kWh, 'kWh', 3), 'statistics'],
        ['€', 'todayCost', format(today?.pricedKWh > 0 ? today.costEUR : null, '€'), 'statistics'],
        ['⇅', 'market', format(data.marketCt, 'ct/kWh'), 'prices'],
        ['≋', 'tariff', format(data.tariffCt, 'ct/kWh'), 'prices'],
    ];
    el('summary').replaceChildren(...tiles.map(([symbol, label, value, page]) => {
        const tile = node('a', null, 'overview-tile');
        tile.href = '#' + page;
        const icon = node('span', symbol, 'tile-icon');
        icon.setAttribute('aria-hidden', 'true');
        const content = node('span', null, 'tile-content');
        content.append(node('span', words[label], 'tile-label'), node('strong', value, 'tile-value'));
        tile.append(icon, content);
        return tile;
    }));
    rows('deviceRows', (data.devices || []).map(device => [
        deviceLabel(device), device.room || words.unassigned, powerLabel(device),
        format(device.energyKWh, 'kWh', 3), [words[device.source], device.exclude && words.excluded].filter(Boolean).join(' · '),
    ]), words.noDevices, 5);
    renderRooms(data.rooms || [], data.devices || []);
    rows('priceRows', (data.prices || []).filter(price => price.end_timestamp > Date.now()).map(price => [
        dateTime(price.start_timestamp), dateTime(price.end_timestamp), format(price.marketprice / 10, 'ct/kWh'),
        format(price.tariffCt, 'ct/kWh'),
    ]), words.noPrices, 4);
    const contract = data.contract || {};
    const reason = words[contract.status] || '';
    el('tariffStatus').textContent = reason;
    if (reason) el('summary').lastElementChild.append(node('small', reason));
    cards('contractCards', [
        [words.fixed, format(contract.fixedMonthlyGross, '€')],
        [words.extra, format(contract.extraCt, 'ct/kWh')],
        [words.advance, format(contract.advanceMonthly, '€')],
        [words.contractStart, contract.start || '–'],
    ]);
    el('installed').textContent = words.installed + ' · ' + (data.version || '–');
    renderStats();
    renderOverviewCharts();
}

el('flowPeriod').addEventListener('change', renderOverviewCharts);

const instanceSelect = el('instance');
const given = params.get('instance') ?? location.search.slice(1);
const defaultInstance = /^\d+$/.test(given) ? given : '0';
instanceSelect.add(new Option('energy-manager.' + defaultInstance, defaultInstance));
let socket;
let stateId;
let connected = false;
let subscribed = false;
let lastAccessToken;

const aliasDialog = el('aliasDialog');
const aliasForm = el('aliasForm');
const aliasInput = el('aliasInput');
const aliasStatus = el('aliasStatus');
let editingAlias;

function deviceLabel(device) {
    const label = node('span', device.name || device.id);
    if (adminTab && connected && device.aliasKey) {
        const edit = node('button', '✎');
        edit.type = 'button';
        edit.title = words.editName;
        edit.setAttribute('aria-label', words.editName + ' · ' + label.textContent);
        edit.addEventListener('click', () => {
            editingAlias = { device, instance: instanceSelect.value };
            aliasInput.value = device.name || '';
            el('originalDeviceName').textContent = device.originalName || device.id;
            aliasStatus.textContent = '';
            aliasDialog.showModal();
            aliasInput.select();
        });
        label.append(' ', edit);
    }
    return label;
}

function powerLabel(device) {
    const label = node('span', format(device.powerW, 'W'));
    if (device.powerId) label.append(node('small', [device.powerId, device.powerUnit].filter(Boolean).join(' · ')));
    return label;
}

async function saveAlias(value) {
    if (!editingAlias || !adminTab || !connected || editingAlias.instance !== instanceSelect.value) return;
    const { device, instance } = editingAlias;
    const buttons = [...aliasForm.querySelectorAll('button')];
    for (const button of buttons) button.disabled = true;
    aliasStatus.textContent = '';
    try {
        await contractRpc('extendObject', 'system.adapter.energy-manager.' + instance, {
            native: { deviceAliases: { [device.aliasKey]: value } },
        });
        aliasDialog.close();
        read();
    } catch {
        aliasStatus.textContent = words.aliasError;
    } finally {
        for (const button of buttons) button.disabled = false;
    }
}

aliasForm.addEventListener('submit', event => {
    event.preventDefault();
    if (aliasInput.value.trim()) void saveAlias(aliasInput.value.trim());
});
el('resetAlias').addEventListener('click', () => void saveAlias(''));
el('cancelAlias').addEventListener('click', () => aliasDialog.close());

const contractForm = el('contractForm');
const contractFields = contractForm.querySelector('fieldset');
const contractInputs = [...contractForm.querySelectorAll('[name]')];
const contractFeedback = el('contractSaveStatus');
let contractRequest = 0;
let savedContract;

function applyContractFormula() {
    const hourly = contractForm.elements.tariffFormula.value === 'awattarHourly';
    for (const label of contractForm.querySelectorAll('[data-hourly]')) {
        label.hidden = !hourly;
        label.querySelector('input').disabled = !hourly;
    }
}

function contractRpc(command, ...args) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(Error('Timeout')), 10000);
        socket.emit(command, ...args, (error, result) => {
            clearTimeout(timeout);
            if (error) reject(error);
            else resolve(result);
        });
    });
}

async function loadContract() {
    if (!adminTab) return;
    const request = ++contractRequest;
    contractFields.disabled = true;
    contractFeedback.textContent = words.contractLoading;
    try {
        const object = await contractRpc('getObject', 'system.adapter.energy-manager.' + instanceSelect.value);
        if (request !== contractRequest) return;
        if (object?.type !== 'instance' || !object.native) throw Error('Missing configuration');
        savedContract = object.native;
        for (const input of contractInputs) {
            const value = savedContract[input.name];
            if (input.type === 'checkbox') input.checked = value === true;
            else if (input.name === 'tariffFormula') {
                input.value = value || 'additive';
                if (!input.value) input.value = 'unsupported';
            } else input.value = value ?? '';
        }
        applyContractFormula();
        contractFields.disabled = false;
        contractFeedback.textContent = '';
    } catch {
        if (request === contractRequest) contractFeedback.textContent = words.contractLoadError;
    }
}

contractForm.addEventListener('input', event => {
    event.target.setCustomValidity('');
    contractForm.elements.energyMaxGrossCt.setCustomValidity('');
});
contractForm.elements.tariffFormula.addEventListener('change', () => {
    for (const input of contractInputs) input.setCustomValidity('');
    applyContractFormula();
});
contractForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!adminTab || !connected || !savedContract || contractFields.disabled) return;
    const form = contractForm.elements;
    const formula = form.tariffFormula.value;
    const active = form.tariffConfigured.checked && formula !== 'unsupported';
    const native = {};
    for (const input of contractInputs) {
        if (input.disabled) continue;
        const raw = input.value.trim();
        let value = input.type === 'checkbox' ? input.checked : raw;
        if (input.inputMode === 'decimal') {
            value = raw ? Number(raw.replace(',', '.')) : null;
            let message = '';
            if (value === null && active && input.hasAttribute('data-variable')) message = words.missingAmount;
            else if (raw && (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(raw) || !Number.isFinite(value) ||
                (value < 0 && !input.hasAttribute('data-limit')) ||
                (value > 100 && input.hasAttribute('data-percent')))) message = words.invalidNumber;
            if (message) {
                input.setCustomValidity(message);
                input.reportValidity();
                return;
            }
        }
        native[input.name] = value;
    }
    if (native.energyMinGrossCt != null && native.energyMaxGrossCt != null &&
        native.energyMinGrossCt > native.energyMaxGrossCt) {
        form.energyMaxGrossCt.setCustomValidity(words.invalidLimit);
        form.energyMaxGrossCt.reportValidity();
        return;
    }
    const changed = Object.fromEntries(Object.entries(native).filter(([key, value]) => savedContract[key] !== value));
    if (!Object.keys(changed).length) {
        contractFeedback.textContent = words.contractSaved;
        return;
    }

    const request = contractRequest;
    contractFields.disabled = true;
    contractFeedback.textContent = '';
    try {
        await contractRpc('extendObject', 'system.adapter.energy-manager.' + instanceSelect.value, { native: changed });
        if (request !== contractRequest) return;
        savedContract = { ...savedContract, ...changed };
        contractFeedback.textContent = words.contractSaved;
        read();
    } catch {
        if (request === contractRequest) contractFeedback.textContent = words.contractSaveError;
    } finally {
        if (request === contractRequest) contractFields.disabled = !connected;
    }
});

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
    el('roomCards').replaceChildren();
    if (aliasDialog.open) aliasDialog.close();
    if (subscribed) socket.emit('unsubscribe', stateId);
    stateId = 'energy-manager.' + instanceSelect.value + '.snapshot';
    subscribed = false;
    snapshot = null;
    displayStatus = 'waiting';
    render();
    savedContract = null;
    contractRequest++;
    contractFields.disabled = true;
    contractForm.reset();
    applyContractFormula();
    if (connected) {
        subscribe();
        void loadContract();
    }
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
        if (savedContract) contractFields.disabled = false;
        else void loadContract();
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
    // to the same-origin Admin socket so the session can stay active.
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
            contractFields.disabled = true;
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
contractForm.hidden = !adminTab;
el('contractWebHint').hidden = adminTab;
translate();
selectInstance();
void connect();
