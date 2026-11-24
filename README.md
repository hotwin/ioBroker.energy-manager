# ioBroker Energy Manager

Local energy monitoring for ioBroker. Read meter states from devices such as Shelly and Zigbee smart plugs, group them by room, and compare consumption with German day-ahead prices from [aWATTar](https://www.awattar.de/).

- [Setup and usage](doc/en/README.md)
- [German documentation](doc/de/README.md)
- [Development and testing](DEVELOPMENT.md)
- [GitHub Releases](https://github.com/hotwin/ioBroker.energy-manager/releases)

## Requirements

Node.js 22 or newer, ioBroker Admin 7.6.20 or newer, and js-controller 6.0.11 or newer. An ioBroker adapter that publishes measurement states must already be installed. The Energy Manager tab uses the Admin connection. The optional separate dashboard uses the ioBroker Web adapter.

## Usage

Add the selected cumulative energy and power states, their channel, or their device to an ioBroker function enum named `Strommessung` or `Energy measurement`. Configure optional manual sources, meter exclusions and tariff components in the instance settings, then open Energy Manager in the Admin sidebar. Room assignments are read from the ioBroker room enums.

The adapter stores its local history in the `consumption` state and publishes the current dashboard data in `snapshot` and aggregate power in `totalPower`. Statistics use cumulative meter differences since recording began.

## Changelog

### 0.3.0-beta.2 (2026-11-24)

- Added clickable dashboard tiles and gross contract rates per price interval.

### 0.3.0-beta.1 (2026-11-24)

- Responsive Admin dashboard with device, room, consumption, price and tariff views.
- Vendor-independent meter discovery, German and English interfaces, and a new adapter icon.
- Added official package validation and controller integration tests.

See the [bilingual changelog](CHANGELOG.md) for details.

## License

Copyright (c) 2026 hotwin

MIT. See [LICENSE](LICENSE).
