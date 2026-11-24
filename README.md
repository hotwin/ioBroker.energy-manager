# ioBroker Energy Manager

**Deutsch** | [English](README.en.md)

Lokales Energiemanagement für ioBroker mit Shelly und dynamischen Stromtarifen.

**Status: 0.1.0 – in Entwicklung. Noch nicht installationsbereit oder auf ioBroker getestet.**

![Dashboard-Designvorschau mit Beispieldaten](docs/dashboard-preview.svg)

## Funktionen

Bereits im Quellcode vorhanden:
- Automatische Suche nach Shelly-Leistungsdatenpunkten und Auslesen von Energiezählern.
- Abruf der deutschen aWATTar-Börsenstrompreise.
- Konfigurierbare Tarifaufschläge und Mehrwertsteuer.
- JSON-Momentaufnahme und Dashboard-Prototyp mit manuellem JSON-Import.

## Roadmap

- [ ] Automatische Live-Anbindung des Dashboards.
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

Noch keine freigegebene Installationsversion. Bitte nicht auf einem produktiven System installieren. Eine geprüfte Anleitung folgt mit der Testfreigabe.

## Tarif und Messgenauigkeit

Der Börsenpreis ist nicht der vollständige Endkundenpreis. Vertragsbestandteile müssen geprüft werden. Die Summe erfasster Geräte ist nicht automatisch der gesamte Wohnungsverbrauch. Überlappende Messstellen können doppelt zählen.

## Datenschutz

Die Messwerte werden lokal verarbeitet; der Preisabruf benötigt Internetzugang. Der Adapter soll ausschließlich lesend auf Energiequellen zugreifen.

## Dokumentation

- [Entwicklungsstand](docs/STATUS.md)
- [Energiequellen](docs/ENERGY-SOURCES.md)
