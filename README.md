# ioBroker Energy Manager

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/hotwin/ioBroker.hotwin-energy-manager)
[![npm beta](https://img.shields.io/npm/v/iobroker.hotwin-energy-manager/beta?label=npm%20beta)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)
[![Downloads](https://img.shields.io/npm/dm/iobroker.hotwin-energy-manager?label=downloads)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)
[![Test and Release (main)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/workflows/test-and-release.yml/badge.svg?branch=main)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/workflows/test-and-release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/hotwin/ioBroker.hotwin-energy-manager)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues)

**Responsible: [Böttcher Services](https://hotgame.duckdns.org/)** · [hotwin@gmx.net](mailto:hotwin@gmx.net)

**Current published beta: 0.3.0-beta.8 (25 November 2026)**

Local energy monitoring and electricity cost analysis for ioBroker, with a responsive dashboard, room and device statistics, and German day-ahead market prices from [aWATTar](https://www.awattar.de/).

[Deutsch](README.de.md) · [English setup guide](doc/en/README.md) · [Development](DEVELOPMENT.md) · [Changelog](CHANGELOG_OLD.md)

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

- [Main branch integration / Developer Portal](https://github.com/hotwin/ioBroker.hotwin-energy-manager/pull/12)
- [Official Latest admission preparation](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/10)
- [Safe migration of legacy data](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/11)

This is an actively developed beta. Report bugs and suggestions via [GitHub Issues](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues) or the [ioBroker forum](https://forum.iobroker.net/topic/85923/test-adapter-energy-manager/4). Ongoing maintenance is intended; beta features may change.

## Changelog

### 0.4.0-beta.1 (development)

- Add the Costs page with recorded variable costs, monthly and annual run-rate estimates, advance comparisons, budget, alternative energy rate, device energy ranking and daily CSV. Forecasts require sufficient recorded history and disclose price coverage. Budget and comparison inputs are browser-local.

### 0.3.0-beta.14 (development)

- Refresh dashboard design with automatic light/dark selection, theme-aware charts and a streamlined header with automatic instance selection. Organize native instance configuration into four tabs.

- Prepare official ioBroker test actions, cross-platform test matrix and Dependabot.
- Add GitHub button, project links and responsibility footer to Admin and Web dashboards, plus GitHub badges in both README files.
- Migration CLI sets its exit status instead of forcibly terminating the process (Repository Checker E5050).
- Prepare npm publication via Trusted Publishing (OIDC) and update repository links to the new name.
- The contract form explicitly distinguishes empty optional energy price limits from a real zero-price limit. Regression test for field report #23.
- The current spot and gross contract prices display their shared validity window. Expired values are hidden until a matching snapshot arrives.
- A more compact overview adds meter diagnostics, optional unassigned power, and custom device names with separate technical details. Missing consumption readings no longer appear as zero kilowatt-hours.
- The official ioBroker Repository Checker validates the exact release commit and must pass before npm publication.
- The release gate confirms the checked package name and records narrowly scoped exceptions for initial admission.
- Adapter metadata keeps seven version summaries. Meter settings specify widths for all Admin screen sizes.
- Instance settings, adapter metadata and release summaries are available in nine additional languages.
- The adapter test matrix now includes Node.js 26.

### 0.3.0-beta.13 – 2026-11-25

- Local data collection and current aWATTar price availability have separate status states. Retry delays increase to up to 15 minutes after API failures.

### 0.3.0-beta.12 – 2026-11-25

- Devices appear in expandable groups by room. Quick access links to the Energy Manager web dashboard.

### 0.3.0-beta.11 – 2026-11-25

- The overview groups the main electricity meter, monitored devices, and electricity prices into three panels. The note about overlapping measurement points moved to Devices.

### 0.3.0-beta.10 – 2026-11-25

- Select the house meter's reading and current power independently in the instance settings to display them in the overview.

### 0.3.0-beta.9 – 2026-11-25

- Local consumption insights compare yesterday with recorded prior days and highlight the cheapest available tariff interval in the next 24 hours.
- Opt-in import of settings, tariff, device aliases and consumption history with preview and backup.

### 0.3.0-beta.8 – 2026-11-24

- Rename the adapter ID to `hotwin-energy-manager` to resolve the npm package name conflict.
- Configure the official ioBroker release script for version synchronization, changelog entries, and Git tags.

[Full bilingual release history](CHANGELOG_OLD.md)

## License

Copyright (c) 2026 hotwin <hotwin@gmx.net>. MIT. See [LICENSE](LICENSE).
