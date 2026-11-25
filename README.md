# ioBroker Energy Manager

[![npm](https://img.shields.io/npm/v/iobroker.hotwin-energy-manager/beta)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)

**Current published beta: 0.3.0-beta.8 (25 November 2026)**

Local energy monitoring and electricity cost analysis for ioBroker, with a responsive dashboard, room and device statistics, and German day-ahead market prices from [aWATTar](https://www.awattar.de/).

[Deutsch](README.de.md) · [English setup guide](doc/en/README.md) · [Development](DEVELOPMENT.md) · [Changelog](CHANGELOG.md)

## Features

- Vendor-independent discovery via the Strommessung / Energy measurement function enum, manual mappings and optional Shelly discovery.
- Live power in W/kW and cumulative energy in Wh/kWh; room assignments from ioBroker enums.
- Responsive Admin dashboard with overview, devices, expandable room cards, statistics, prices and contract settings.
- Editable device aliases, energy flow from recorded total to rooms and devices, hourly consumption, daily costs and price history.
- Seven-day, monthly, quarterly and annual statistics; up to 400 daily records.
- Editable tariff components, VAT, aWATTar HOURLY percentage surcharge and optional gross energy price limits. Fixed charges and advance payments are shown separately.
- German and English interface; optional Web adapter dashboard.

## Installation

Requires Node.js 22+, ioBroker Admin 7.6.20+ and js-controller 6.0.11+. Measurement states must be supplied by installed device adapters.

```bash
iobroker add hotwin-energy-manager@0.3.0-beta.8
```

The package is published under the npm beta tag, not yet in the official ioBroker Latest or Stable repository.

**Migration warning:** the previous adapter ID was energy-manager. The new ID is hotwin-energy-manager. Existing settings and history remain in the old namespace; the beta.9 development version adds an [opt-in import](doc/en/README.md#import-from-a-legacy-instance). Keep the old instance and back up its data.

## Setup and data accuracy

Add measurement states, channels or devices to the Strommessung or Energy measurement function enum. Assign rooms, configure manual sources and exclusions as needed, and enter verified contract components. Open Energy Manager in the Admin sidebar. The optional Web dashboard is available at /hotwin-energy-manager/index.html with integrated socket and WebSockets.

Consumption is calculated from cumulative meter differences after recording begins. Resets, long gaps and midnight boundaries reset the baseline. Intervals spanning a price or tariff change are recorded without cost valuation. Exclude overlapping meters to avoid double counting. Market prices may differ from your supplier's index.

## Development and roadmap

GitHub Actions checks lint, package metadata, dashboard synchronization, unit tests, integration and Compact Mode on Node.js 22/24. The beta.8 npm publish job succeeded. The official release script is configured in the development branch.

- [Main branch integration / Developer Portal](https://github.com/hotwin/ioBroker.energy-manager/pull/12)
- [Official Latest admission preparation](https://github.com/hotwin/ioBroker.energy-manager/issues/10)
- [Safe migration of legacy data](https://github.com/hotwin/ioBroker.energy-manager/issues/11)

This is an actively developed beta. Report bugs and suggestions via [GitHub Issues](https://github.com/hotwin/ioBroker.energy-manager/issues) or the [ioBroker forum](https://forum.iobroker.net/topic/85923/test-adapter-energy-manager/4). Ongoing maintenance is intended; beta features may change.

## Changelog

### 0.3.0-beta.14 (development)

- Show the validity window of current spot and gross contract prices.
- Add main-meter diagnostics and comparison with device measurements.
- Verify the release commit and package identity with the official Repository Checker.
- Add translations of instance settings and adapter metadata for nine more languages.

### 0.3.0-beta.9 – 2026-11-25

- Local consumption insights compare yesterday with recorded prior days and highlight the cheapest available tariff interval in the next 24 hours.
- Opt-in import of settings, tariff, device aliases and consumption history with preview and backup.

### 0.3.0-beta.8 – 2026-11-24

- Rename the adapter ID to `hotwin-energy-manager` to resolve the npm package name conflict.
- Configure the official ioBroker release script for version synchronization, changelog entries, and Git tags.

### 0.3.0-beta.7 – 2026-11-24

- Edit device names with a pencil button and a clearer dialog. Current power displays only the reading and unit. Power source details appear under the device name.

### 0.3.0-beta.6 – 2026-11-24

- Compact room cards show current power and device count. Expand each card to see individual device readings.

### 0.3.0-beta.5 – 2026-11-24

- Energy flow from recorded total to rooms and devices, with hourly usage, daily costs and electricity price history on the overview. New measurement series start recording after the update.

### 0.3.0-beta.4 – 2026-11-24

- Store device aliases in Admin. The device list shows power state IDs and units and prefers live measurements.

### 0.3.0-beta.3 – 2026-11-24

- Edit contract details in ioBroker Admin and persist them in the instance configuration.
- Calculate gross rates with the selected formula. aWATTar HOURLY supports a percentage surcharge on the absolute spot price and optional gross energy price limits.
- Explain missing contract inputs, future start dates and unavailable market prices in the dashboard.

### 0.3.0-beta.2 – 2026-11-24

- Clickable tiles for power, consumption, costs, market price and gross contract rate.
- The price view displays the market price and calculated gross contract rate for each available interval.

### 0.3.0-beta.1 – 2026-11-24

- Responsive ioBroker Admin dashboard covering overview, devices, rooms, statistics, prices, contract and updates.
- Energy measurement enum discovery across vendors, with manual mappings and optional Shelly discovery.
- New PNG icon and English and German dashboard and configuration text.
- Seven-day, monthly, quarterly and annual statistics. Tariff boundaries and fixed charges are handled separately.
- ESLint, ioBroker package validation, and integration and Compact Mode tests in the pinned GitHub workflow matrix.

### 0.2.1 – 2026-11-24
- Explicit WebSocket transport avoids HTTP polling when WebSockets are forced. Live display confirmed in practical test.

### 0.2.0 – 2026-11-24
- Experimental Socket.IO live connection replaces REST polling. Dashboard loads; connection reports `xhr poll error` with forced WebSockets.

### 0.1.0 – 2026-11-24
- Initial alpha with Shelly discovery, manual energy sources, room assignment, aWATTar prices and web dashboard. Installation and power calculation confirmed in a practical test. REST endpoint returns 404.


## License

Copyright (c) 2026 hotwin. MIT. See [LICENSE](LICENSE).
