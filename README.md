# ioBroker Energy Manager

**Deutsch** | [English](README.en.md)

Lokales Energiemanagement für ioBroker mit Shelly und dynamischen Stromtarifen.

**Status: 0.2.1 Alpha – Installation, Shelly-Datenerfassung und Live-Dashboard praktisch bestätigt. Version 0.3.0 in Entwicklung.**

![Dashboard-Designvorschau mit Beispieldaten](docs/dashboard-preview.svg)

## Funktionen

Bereits im Quellcode vorhanden:
- Automatische Suche nach Shelly-Leistungsdatenpunkten und Auslesen von Energiezählern.
- Abruf der deutschen aWATTar-Börsenstrompreise.
- Konfigurierbare Tarifaufschläge und Mehrwertsteuer.
- Live-Dashboard über WebSocket und JSON-Momentaufnahme.

## Roadmap

- [x] Automatische Live-Anbindung des Dashboards.
- [ ] Historische Verbrauchs- und Kostenberechnung mit zeitabhängigen Preisen.
- [ ] Frei konfigurierbare Energiequellen, Namen, Räume und Datenpunkt-Auswahl.
- [ ] Zigbee2MQTT und weitere Hersteller über beliebige ioBroker-Datenpunkte.
- [ ] Admin-Integration und eigenständige responsive Webansicht.
- [ ] Stromvertrag, Grundpreis, Abschläge und Prognosen.
- [ ] Optionale KI-Analysen und Berichte.
- [ ] Installations- und Integrationstests.

## Voraussetzungen

Geplant: ioBroker mit Shelly-Adapter, Node.js ab 18 sowie Web- und History-Adapter für die entsprechenden Integrationen.

## Installation

Alpha-Test: Backup erstellen, in ioBroker unter Adapter die Installation aus eigener URL wählen und https://github.com/hotwin/ioBroker.energy-manager eingeben. Dashboard über den Web-Adapter unter /energy-manager/index.html öffnen. Der main-Branch enthält auch laufende Entwicklung; keine stabile Freigabe.

## Tarif und Messgenauigkeit

Der Börsenpreis ist nicht der vollständige Endkundenpreis. Vertragsbestandteile müssen geprüft werden. Die Summe erfasster Geräte ist nicht automatisch der gesamte Wohnungsverbrauch. Überlappende Messstellen können doppelt zählen.

## Datenschutz

Die Messwerte werden lokal verarbeitet; der Preisabruf benötigt Internetzugang. Der Adapter soll ausschließlich lesend auf Energiequellen zugreifen.

## Dokumentation

- [Entwicklungsstand](docs/STATUS.md)
- [Energiequellen](docs/ENERGY-SOURCES.md)

- [Changelog / Änderungsprotokoll](CHANGELOG.md)
