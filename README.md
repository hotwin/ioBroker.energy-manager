# ioBroker Energy Manager

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/hotwin/ioBroker.hotwin-energy-manager)
[![npm next](https://img.shields.io/npm/v/iobroker.hotwin-energy-manager/next?label=npm%20next)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)
[![Downloads](https://img.shields.io/npm/dm/iobroker.hotwin-energy-manager?label=downloads)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)
[![Test and Release (main)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/workflows/test-and-release.yml/badge.svg?branch=main)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/workflows/test-and-release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/hotwin/ioBroker.hotwin-energy-manager)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues)

**Responsible: [Böttcher Services](https://hotgame.duckdns.org/)** · [hotwin@gmx.net](mailto:hotwin@gmx.net)

Local electricity monitoring, tariff and cost analysis, and solar and battery readings for ioBroker.

**Development status:** 0.6.0 release candidate, not yet published to npm or admitted to the official ioBroker repositories. The currently published beta is 0.3.0-beta.8.

[Deutsch](doc/de/README.md) · [English setup guide](doc/en/README.md) · [Development](DEVELOPMENT.md) · [Changelog](#changelog)

## Features

### Energy monitoring
- Vendor-independent measurement discovery through ioBroker function enums, manual mappings and optional Shelly discovery.
- Live power, cumulative energy, independent main-meter readings, room assignments and editable device aliases.
- Expandable room/device cards, energy flow from monitored total to rooms and devices, hourly and daily consumption charts, and up to 400 daily records.
- Separate collection and market feed status, meter diagnostics and optional unassigned power when readings are valid and non-overlapping.

### Costs and consumption analysis
- Recorded variable costs and priced-energy coverage, including per-device costs; unpriced energy stays unvalued.
- Monthly and annual run-rate forecasts, fixed charges, advance-payment comparisons, budget warnings, seven-day history and device rankings.
- Alternative energy-rate comparison, daily CSV export and simple investment payback from user-entered cost and annual net savings.

### Electricity prices and contracts
- [aWATTar Germany](https://www.awattar.de/), [aWATTar Austria](https://www.awattar.at/), [Energy-Charts](https://api.energy-charts.info/) bidding zones (DE-LU, AT, CH, FR, NL, BE, PL, CZ, DK1, DK2) and custom ioBroker JSON price feeds.
- Current spot and gross rates with validity intervals, feed diagnostics, tariff breakdown, cheapest available interval and contiguous two-hour window.
- Configurable net tariff components, VAT, percentage surcharge, optional energy price limits and separate fixed charges.

### Solar, battery and visualization
- Optional live PV generation, grid feed-in and battery state of charge from mapped states; monitoring only.
- Responsive German/English Admin and optional Web dashboard, automatic light/dark theme and four native configuration tabs.
- Read-only states for scripts and Blockly, plus importable VIS Classic and VIS 2 widgets.
- Optional legacy-instance migration with preview and backup.

## Screenshots

[Dashboard screenshot gallery](doc/screenshots/0.6.0-beta.8/README.md) — genuine captures from a running development build, dated 26 November 2026. The gallery is being prepared for the 0.6.0 candidate; the screenshots show 0.6.0-beta.8, not the final release.

## Installation

Requires Node.js 22+, ioBroker Admin 7.6.20+ and js-controller 6.0.11+. Measurement states must be supplied by installed device adapters.

Install Energy Manager from **Adapters** in ioBroker Admin once it is available in your configured repository. The published beta is awaiting admission to the official Latest or Stable repository.

**Migration warning:** the previous adapter ID was energy-manager. The new ID is hotwin-energy-manager. Existing settings and history remain in the old namespace; this version supports an [opt-in import](doc/en/README.md#import-from-a-legacy-instance). Keep the old instance and back up its data.

## Setup and data accuracy

Add measurement states, channels or devices to the Strommessung or Energy measurement function enum. Assign rooms, configure manual sources and exclusions as needed, and enter verified contract components. Open Energy Manager in the Admin sidebar. The optional Web dashboard is available at /hotwin-energy-manager/index.html with integrated socket and WebSockets.

Consumption is calculated from cumulative meter differences after recording begins. Resets, long gaps and midnight boundaries reset the baseline. Intervals spanning a price or tariff change are recorded without cost valuation. Exclude overlapping meters to avoid double counting. Market prices may differ from your supplier's index.

## Limitations and data coverage

Forecasts need at least seven recorded days and 95% priced-energy coverage. They assume similar usage, prices and current fixed charges, and are not bills or guarantees. The alternative tariff comparison covers priced energy only; alternative fixed charges are excluded. Budget and comparison inputs are browser-local. PV and battery values require configured states; no automated hardware control is provided. See the [cost guide](doc/en/cost-manager.md).

## Development and roadmap

See [DEVELOPMENT.md](DEVELOPMENT.md) for development and release procedures.

- [Main branch integration / Developer Portal](https://github.com/hotwin/ioBroker.hotwin-energy-manager/pull/12)
- [Official Latest admission preparation](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/10)
- [Safe migration of legacy data](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/11)

Report bugs and suggestions via [GitHub Issues](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues) or the [ioBroker forum](https://forum.iobroker.net/topic/85923/test-adapter-energy-manager/4).

## VIS Classic and VIS 2

Import the [VIS Classic](doc/vis/energy-manager-vis-classic.json) or [VIS 2](doc/vis/energy-manager-vis-2.json) widget templates. In either editor, bind a basic value widget to an object ID such as `hotwin-energy-manager.0.todayEnergy`. The numeric states `totalPower`, `todayEnergy`, `todayCost`, `currentMarketPrice`, `currentGrossPrice` and `houseMeterEnergy` are read-only. Missing readings are empty. Add the desired unit in the widget settings.

## Changelog

### 0.6.0 (unreleased)

- Add a cost dashboard with device-level costs and price coverage, budget warnings, tariff comparisons, CSV export and an investment payback calculator.
- Select aWATTar DE/AT, supported Energy-Charts bidding zones or a custom ioBroker price feed. Inspect interval coverage, the gross tariff breakdown and the cheapest two-hour window.
- Show configured solar power, grid feed-in and battery charge in the dashboard.
- Add consumption columns, responsive device cards, consistent instance settings and importable VIS Classic and VIS 2 widgets.

### 0.6.0-beta.9 (development)

- Add numeric display states for VIS Classic and VIS 2.

### 0.6.0-beta.8 (development)

- Estimate simple payback from an investment and user-entered annual net savings.

### 0.6.0-beta.7 (development)

- Add aWATTar Austria and selectable public Energy-Charts bidding zones. Energy-Charts market data from Bundesnetzagentur / SMARD via Fraunhofer ISE, licensed CC BY 4.0. [Energy-Charts](https://api.energy-charts.info/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

### 0.6.0-beta.6 (development)

- Show market feed diagnostics and explain the active gross tariff with an itemized breakdown.

### 0.6.0-beta.5 (development)

- Select aWATTar Germany or a custom day-ahead market feed from an ioBroker JSON state. The state accepts an array or an object with a data array. Each interval uses start_timestamp and end_timestamp in Unix milliseconds and marketprice in EUR/MWh. Supply non-overlapping intervals and select a feed that matches your contract and bidding zone.

### 0.6.0-beta.4 (development)

- Apply consistent section headings and responsive field widths across all four instance settings tabs.

### 0.6.0-beta.3 (development)

- Group the native electricity tariff settings into contract, net price components and VAT.

### 0.6.0-beta.2 (development)

- Show recorded variable costs and price coverage by device. Expose consumption comparison and cheap tariff windows as read-only JSON in the energyInsights state.

### 0.6.0-beta.1 (development)

- Show the cheapest contiguous two-hour gross-price window and optionally display live solar generation, grid feed-in and battery charge from configured states.

### 0.4.0-beta.4 (development)

- Show device groups as responsive room cards with device counts and measured room power.

### 0.4.0-beta.3 (development)

- Show an explicit budget warning if forecast monthly costs exceed the target, and explain when there is insufficient data for a forecast.

### 0.4.0-beta.2 (development)

- Show recorded hourly or daily consumption as vertical columns, with gaps for unmeasured hours and the original cost totals.
- Label the spot price and gross energy rate with colored legend markers and show Berlin time on the price chart.

### 0.4.0-beta.1 (development)

- Add the Costs page with recorded variable costs, monthly and annual run-rate estimates, advance comparisons, budget, alternative energy rate, device energy ranking and daily CSV. Forecasts require sufficient recorded history and disclose price coverage. Budget and comparison inputs are browser-local.

### 0.3.0-beta.14 (development)

- Move the German guide and supporting documentation to the ioBroker documentation layout.

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
- Use the official ioBroker test-and-release workflow and Trusted Publishing; published GitHub releases remain unchanged.
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

[Full bilingual release history](doc/RELEASE-HISTORY.md)

## License

Copyright (c) 2026 hotwin <hotwin@gmx.net>. MIT. See [LICENSE](LICENSE).
