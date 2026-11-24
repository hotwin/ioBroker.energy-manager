# ioBroker Energy Manager

**English** | [Deutsch](README.de.md)

Local energy monitoring for ioBroker with Shelly measurement states, manually configured sources and German day-ahead energy prices from aWATTar.

**Status:** Experimental alpha 0.2.1; a separate beta is under development and has not been published.

## Features

- Read power and energy meter values from ioBroker states assigned manually or through energy measurement enums.
- Optionally discover Shelly measurement states.
- Display German market prices provided by aWATTar.
- Configure tariff components, VAT, recurring charges and advances.
- View a local daily consumption ledger and an experimental dashboard through the ioBroker Web adapter.

## Installation

This is experimental software. Back up ioBroker before using a development build. The optional web dashboard is served at `/energy-manager/index.html` when the ioBroker Web adapter is configured.

Readings only cover selected measurement points. Overlapping meters can be counted twice. Exchange prices do not include contract charges, and cost estimates can be incomplete.

## Development and releases

- [German documentation](README.de.md)
- [Changelog / version history](CHANGELOG.md)
- [GitHub Releases](https://github.com/hotwin/ioBroker.energy-manager/releases)
- [Energy source documentation](docs/ENERGY-SOURCES.md)

This independent adapter is not affiliated with [Shelly](https://www.shelly.com/) or [aWATTar](https://www.awattar.de/).

## License

MIT. See [LICENSE](LICENSE).
