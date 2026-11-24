# ioBroker Energy Manager

[Deutsch](README.md) | **English**

Local energy management for ioBroker with Shelly and dynamic electricity tariffs.

**Status: 0.2.1 alpha – installation, Shelly data collection and live dashboard confirmed in practical testing. Version 0.3.0 under development.**

![Dashboard design preview with sample data](docs/dashboard-preview.svg)

## Features

Currently present in the source code:
- Automatic discovery of Shelly power data points and reading energy meters.
- Retrieval of German aWATTar wholesale electricity prices.
- Configurable tariff surcharges and VAT.
- Live dashboard via WebSocket and JSON snapshot.

## Roadmap

- [x] Automatic live dashboard connection.
- [ ] Historical consumption and cost calculations using time-dependent prices.
- [ ] Configurable energy sources, names, rooms and data point selection.
- [ ] Zigbee2MQTT and other manufacturers via arbitrary ioBroker data points.
- [ ] Admin integration and standalone responsive web interface.
- [ ] Electricity contracts, base charges, monthly payments and forecasts.
- [ ] Optional AI analysis and reports.
- [ ] Installation and integration tests.

## Requirements

Planned: ioBroker with the Shelly adapter, Node.js 18 or newer, and the Web and History adapters for their respective integrations.

## Installation

Alpha testing: create a backup, select installation from custom URL in ioBroker and enter https://github.com/hotwin/ioBroker.energy-manager. Open /energy-manager/index.html via the web adapter. The main branch also contains ongoing development; no stable release yet.

## Tariffs and measurement accuracy

Wholesale prices do not represent the full retail electricity price. Contract components must be verified. The sum of monitored devices does not necessarily represent total household consumption. Overlapping meters may cause double counting.

## Privacy

Measurements are processed locally; retrieving prices requires internet access. The adapter is designed to access energy sources in read-only mode.

## Documentation

- [Development status (German)](docs/STATUS.md)
- [Energy sources (German)](docs/ENERGY-SOURCES.md)

- [Changelog / Änderungsprotokoll](CHANGELOG.md)
