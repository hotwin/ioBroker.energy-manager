# ioBroker Energy Manager

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/hotwin/ioBroker.hotwin-energy-manager)
[![npm beta](https://img.shields.io/npm/v/iobroker.hotwin-energy-manager/beta?label=npm%20beta)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)
[![Downloads](https://img.shields.io/npm/dm/iobroker.hotwin-energy-manager?label=downloads)](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)
[![Test and Release (main)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/workflows/test-and-release.yml/badge.svg?branch=main)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/workflows/test-and-release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/hotwin/ioBroker.hotwin-energy-manager)](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues)

**Verantwortlich: [Böttcher Services](https://hotgame.duckdns.org/)** · [hotwin@gmx.net](mailto:hotwin@gmx.net)

**Aktuell veröffentlichte Beta: 0.3.0-beta.8 (25.11.2026)**

Der Energy Manager erfasst Stromverbrauch, Leistung und variable Stromkosten lokal in ioBroker. Er verbindet Messdaten verschiedener Hersteller mit Raumübersichten und dynamischen Börsenpreisen von [aWATTar](https://www.awattar.de/).

[English](../../README.md) · [Ausführliche Einrichtung](SETUP.md) · [Zweisprachiger Versionsverlauf](../RELEASE-HISTORY.md) · [npm](https://www.npmjs.com/package/iobroker.hotwin-energy-manager)

## Funktionen

- Neue Kostenseite mit erfassten variablen Kosten, Monats-/Jahreshochrechnung, Abschlagsvergleich, Budget, alternativem Arbeitspreis, Geräteverbrauchsvergleich und Tagesdaten-CSV. Prognosen benötigen ausreichende Historie und zeigen die Preisabdeckung. Budget und Vergleichspreis werden lokal im Browser gespeichert.

- Herstellerübergreifende Geräteerkennung über Strommessung, manuelle Zuordnung und optionale Shelly-Erkennung.
- Live-Leistung, Verbrauch, Raumkarten mit aufklappbaren Geräten und bearbeitbare Gerätenamen.
- Energieflussdiagramm, Stundenverbrauch, Tageskosten und Strompreisverlauf.
- Statistiken für sieben Tage, Monat, Quartal und Jahr.
- Bearbeitbare Vertragsdaten, Brutto-Arbeitspreis, Mehrwertsteuer, aWATTar HOURLY-Aufschlag und optionale Preisgrenzen.
- Responsives deutsch- und englischsprachiges Dashboard im Admin und optional über den Web-Adapter.

## Installation

Voraussetzungen: Node.js ab 22, Admin ab 7.6.20, js-controller ab 6.0.11 sowie vorhandene Messdatenpunkte.

Sobald der Adapter im konfigurierten ioBroker-Repository verfügbar ist, installiere ihn im Admin unter **Adapter**. Die veröffentlichte Beta wartet auf die Aufnahme in das offizielle Latest- oder Stable-Repository.

## Einrichtung

Die Adapterkennung lautet jetzt `hotwin-energy-manager`. ioBroker legt dafür eine neue Instanz an. Bisherige Einstellungen und Verbrauchsdaten bleiben bei der alten Instanz. Die Entwicklungsversion Beta 9 ermöglicht eine [optionale Übernahme](SETUP.md#daten-aus-einer-alten-instanz-übernehmen).

1. Lege im ioBroker Admin eine Funktionsaufzählung namens **Strommessung** oder **Energy measurement** an.
2. Füge die numerischen Messdatenpunkte, deren Kanal oder das Gerät hinzu. **W** oder **kW** liefern die Live-Leistung, ein fortlaufender Zähler in **Wh** oder **kWh** liefert den Verbrauch. Lege Leistung und Energie nach Möglichkeit in denselben Kanal.
3. Weise Geräte über die ioBroker-Raumaufzählungen zu. Manuell hinterlegte Raumnamen haben Vorrang. Die automatische Shelly-Erkennung lässt sich in der Instanzkonfiguration abschalten.
4. Aktiviere die Instanz und öffne Energy Manager im Admin-Menü. Optional erreichst du das Dashboard über den Web-Adapter unter `/hotwin-energy-manager/index.html` mit integriertem Socket und aktivierten WebSockets.
5. Hinterlege die Nettobestandteile deines Vertrags und die Mehrwertsteuer in der Instanzkonfiguration. Aktiviere den berechneten Bruttotarif, sobald du die Bestandteile geprüft hast.

Der Adapter speichert Verbrauch anhand fortlaufender Zählerstände. Rücksetzungen, längere Messlücken und Intervalle über Mitternacht setzen den Ausgangswert neu. Die Aufzeichnung beginnt mit der Installation. Geräte mit reiner Leistungsmessung tragen zur Live-Leistung bei. Bei einem Preisintervall- oder Tarifwechsel zwischen Messungen wird der Verbrauch erfasst und bleibt ohne Kostenbewertung. Die Statistik zeigt erfasste variable Kosten und bewertete Kilowattstunden. Monatliche Fixkosten und Abschläge stehen unter Stromvertrag. Vergleiche den verwendeten aWATTar-Spotmarktpreis für Deutschland mit dem Preisindex deines Anbieters.

Schließe überlappende Haupt- oder Unterzähler in den manuellen Energiequellen aus, damit die Summen sie nur einmal enthalten. Geräte mit uneindeutiger Datenpunktstruktur lassen sich ebenfalls manuell zuordnen. Der Adapter behält bis zu 400 Tageswerte in ioBroker.


## Weiterentwicklung

Die automatischen Tests und der npm-Upload der Beta 8 waren erfolgreich. Der Adapter soll langfristig gepflegt und anhand von Rückmeldungen weiterentwickelt werden.

- [Datenmigration](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/11): geplant, alte Instanz bitte behalten und Daten sichern.
- [Aufnahme in ioBroker Latest](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/10): in Vorbereitung.
- [Main und Developer Portal](https://github.com/hotwin/ioBroker.hotwin-energy-manager/pull/12): Zusammenführung noch nicht abgeschlossen.

Fehler und Vorschläge: [GitHub Issues](https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues) oder [ioBroker-Forum](https://forum.iobroker.net/topic/85923/test-adapter-energy-manager/4).

## VIS Classic und VIS 2

Fertige Kacheln: [VIS Classic](../vis/energy-manager-vis-classic.json) · [VIS 2](../vis/energy-manager-vis-2.json). Im passenden Editor den Widget-Import öffnen und den Inhalt der JSON-Datei einfügen. Die Kacheln nutzen die eingebauten Basiswidgets und sind auf `hotwin-energy-manager.0` eingestellt. Bei abweichender Instanznummer die IDs vor dem Import anpassen.

Wähle im jeweiligen VIS-Editor ein Basis-Wertwidget und setze dessen Objekt-ID beispielsweise auf `hotwin-energy-manager.0.todayEnergy`. Ersetze `.0` bei Bedarf durch deine Instanznummer. Die folgenden numerischen Datenpunkte sind schreibgeschützt und ohne Messwert leer. Die Einheit kannst du im Widget ergänzen.

| Datenpunkt | Wert |
| --- | --- |
| `totalPower` | Leistung der erfassten Geräte (W) |
| `todayEnergy` | Verbrauch der erfassten Geräte heute (kWh) |
| `todayCost` | Bewertete variable Kosten heute (EUR) |
| `currentMarketPrice` | Aktueller Börsenpreis (ct/kWh) |
| `currentGrossPrice` | Aktueller Brutto-Arbeitspreis (ct/kWh) |
| `houseMeterEnergy` | Gesamtstand des Hauptzählers (kWh) |

Für reine Textanzeigen mit bereits enthaltener Einheit stehen `displayPower`, `displayToday`, `displayMarket`, `displayTariff` und `displayCost` bereit.

## Changelog / Versionsverlauf

### 0.6.0-beta.9 (Entwicklung)

- Numerische Anzeigedatenpunkte für VIS Classic und VIS 2 ergänzen.

### 0.6.0-beta.8 (Entwicklung)

- Einfache Amortisationsdauer aus Investition und eingegebener jährlicher Nettoersparnis schätzen.

### 0.6.0-beta.7 (Entwicklung)

- aWATTar Österreich und öffentliche Energy-Charts-Gebotszonen ergänzen. Energy-Charts-Marktdaten von Bundesnetzagentur / SMARD über Fraunhofer ISE, CC BY 4.0. [Energy-Charts](https://api.energy-charts.info/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

### 0.6.0-beta.6 (Entwicklung)

- Zustand der Börsenpreisquelle und Bestandteile des aktuellen Brutto-Arbeitspreises anzeigen.

### 0.6.0-beta.5 (Entwicklung)

- Im Reiter Stromtarif zwischen aWATTar Deutschland und einem ioBroker-Datenpunkt für eigene Börsenpreise wählen. Der JSON-String enthält ein Array oder ein Objekt mit data-Array. Pro Intervall werden start_timestamp und end_timestamp in Unix-Millisekunden und marketprice in EUR/MWh erwartet. Die Intervalle dürfen sich nicht überschneiden. Die Preisquelle muss zur Gebotszone und zum Vertrag passen.

### 0.6.0-beta.4 (Entwicklung)

- Einheitliche Abschnittsüberschriften und responsive Feldbreiten in allen vier Reitern der Instanzeinstellungen.

### 0.6.0-beta.3 (Entwicklung)

- Die nativen Stromtarif-Einstellungen in Vertrag, Netto-Preisbestandteile und Mehrwertsteuer gliedern.

### 0.6.0-beta.2 (Entwicklung)

- Erfasste variable Kosten und Preisabdeckung je Gerät anzeigen. Verbrauchsvergleich und günstige Zeitfenster im lesbaren JSON-Datenpunkt energyInsights für Skripte bereitstellen.

### 0.6.0-beta.1 (Entwicklung)

- Günstigstes zusammenhängendes Zwei-Stunden-Fenster und optional Live-Messwerte für PV-Erzeugung, Netzeinspeisung und Batterieladestand anzeigen.

### 0.4.0-beta.4 (Entwicklung)

- Gerätegruppen als responsive Raumkarten mit Geräteanzahl und gemessener Raumleistung anzeigen.

### 0.4.0-beta.3 (Entwicklung)

- Bei prognostizierter Überschreitung des Monatsbudgets eine Warnung anzeigen. Fehlen Daten für die Prognose, erscheint ein eigener Hinweis.

### 0.4.0-beta.2 (Entwicklung)

- Verbrauch als Säulendiagramm pro Stunde oder Tag anzeigen. Fehlende Stundenwerte bleiben als Lücken sichtbar. Die Kostensummen bleiben erhalten.
- Börsenpreis und Brutto-Arbeitspreis im Strompreisverlauf mit farbiger Legende und Berliner Uhrzeiten kennzeichnen.

### 0.4.0-beta.1 (Entwicklung)

- Neue Kostenseite mit erfassten variablen Kosten, Monats-/Jahreshochrechnung, Abschlagsvergleich, Budget, alternativem Arbeitspreis, Geräteverbrauchsvergleich und Tagesdaten-CSV. Prognosen benötigen ausreichende Historie und zeigen die Preisabdeckung. Budget und Vergleichspreis werden lokal im Browser gespeichert.

### 0.3.0-beta.9 – 2026-11-25

- DE: Lokale Verbrauchsauswertung mit Vergleich zum Durchschnitt erfasster Vortage und günstigstem verfügbaren Tarifintervall der nächsten 24 Stunden.
- Optionale Übernahme von Einstellungen, Tarif, Gerätealiasen und Verbrauchsverlauf mit Probelauf und Sicherung.

### 0.3.0-beta.8 – 2026-11-24

- DE: Adapterkennung auf `hotwin-energy-manager` geändert, um den npm-Namenskonflikt zu lösen.
- EN: Rename the adapter ID to `hotwin-energy-manager` to resolve the npm package name conflict.
- DE: Offizielles ioBroker-Release-Script für Versionsabgleich, Changelog und Git-Tags eingerichtet.
- EN: Configure the official ioBroker release script for version synchronization, changelog entries, and Git tags.

### 0.3.0-beta.7 – 2026-11-24

- DE: Gerätenamen über ein dezentes Stiftsymbol und einen klareren Dialog bearbeiten. „Aktuelle Leistung“ zeigt nur Messwert und Einheit. Details zum Messpunkt stehen beim Gerätenamen.
- EN: Edit device names with a pencil button and a clearer dialog. Current power displays only the reading and unit. Power source details appear under the device name.

### 0.3.0-beta.6 – 2026-11-24

- DE: Die Raumübersicht zeigt aktuelle Leistung und Geräteanzahl in kompakten Karten. Die Geräteliste mit Einzelwerten lässt sich je Raum aufklappen.
- EN: Compact room cards show current power and device count. Expand each card to see individual device readings.

### 0.3.0-beta.5 – 2026-11-24

- DE: Energiefluss von der erfassten Gesamtenergie über Räume zu Geräten sowie Verlauf für Stundenverbrauch, Tageskosten und Strompreise auf der Startseite. Die neuen Messreihen beginnen mit der Aufzeichnung nach dem Update.
- EN: Energy flow from recorded total to rooms and devices, with hourly usage, daily costs and electricity price history on the overview. New measurement series start recording after the update.

### 0.3.0-beta.4 – 2026-11-24

- DE: Gerätenamen im Admin speichern. Die Geräteliste zeigt Leistungsdatenpunkte und Einheiten an und bevorzugt aktuelle Messwerte.
- EN: Store device aliases in Admin. The device list shows power state IDs and units and prefers live measurements.

### 0.3.0-beta.3 – 2026-11-24

#### Deutsch

- Vertragsdaten im ioBroker Admin bearbeiten und dauerhaft in der Instanz speichern.
- Brutto-Arbeitspreis anhand der gewählten Formel berechnen. aWATTar HOURLY unterstützt den prozentualen Aufschlag auf den Betrag des Börsenpreises und optionale Bruttopreisgrenzen für die Energie.
- Fehlende Vertragsbeträge, einen späteren Vertragsstart und fehlende aktuelle Börsenpreise im Dashboard anzeigen.

#### English

- Edit contract details in ioBroker Admin and persist them in the instance configuration.
- Calculate gross rates with the selected formula. aWATTar HOURLY supports a percentage surcharge on the absolute spot price and optional gross energy price limits.
- Explain missing contract inputs, future start dates and unavailable market prices in the dashboard.

### 0.3.0-beta.2 – 2026-11-24

#### Deutsch

- Anklickbare Kacheln für Leistung, Verbrauch, Kosten, Börsenpreis und Brutto-Arbeitspreis.
- Die Preisübersicht zeigt Börsenpreis und den berechneten Brutto-Arbeitspreis je verfügbarem Preisintervall.

#### English

- Clickable tiles for power, consumption, costs, market price and gross contract rate.
- The price view displays the market price and calculated gross contract rate for each available interval.

### 0.3.0-beta.1 – 2026-11-24

#### Deutsch

- Responsives Dashboard im ioBroker Admin mit Übersicht, Geräten, Räumen, Verbrauchsstatistik, Preisen, Vertrag und Updates.
- Geräteerkennung über die Aufzählung Strommessung, mit manueller Zuordnung und optionaler Shelly-Erkennung.
- Neues PNG-Icon sowie deutsche und englische Texte im Dashboard und in der Konfiguration.
- Auswertungen für sieben Tage, Monat, Quartal und Jahr. Tarifgrenzen und Fixkosten werden separat behandelt.
- ESLint, ioBroker-Paketprüfung sowie Integrations- und Compact-Mode-Tests in der abgesicherten GitHub-Workflow-Matrix.

#### English

- Responsive ioBroker Admin dashboard covering overview, devices, rooms, statistics, prices, contract and updates.
- Energy measurement enum discovery across vendors, with manual mappings and optional Shelly discovery.
- New PNG icon and English and German dashboard and configuration text.
- Seven-day, monthly, quarterly and annual statistics. Tariff boundaries and fixed charges are handled separately.
- ESLint, ioBroker package validation, and integration and Compact Mode tests in the pinned GitHub workflow matrix.

### 0.2.1 – 2026-11-24
- DE: WebSocket-Transport ausdrücklich gewählt, um HTTP-Polling bei erzwungenen WebSockets zu vermeiden. Live-Anzeige im Praxistest bestätigt.
- EN: Explicit WebSocket transport avoids HTTP polling when WebSockets are forced. Live display confirmed in practical test.

### 0.2.0 – 2026-11-24
- DE: Experimentelle Socket.IO-Live-Anbindung ersetzt REST-Abfrage. Weboberfläche erreichbar; Verbindung meldet `xhr poll error` bei erzwungenen WebSockets.
- EN: Experimental Socket.IO live connection replaces REST polling. Dashboard loads; connection reports `xhr poll error` with forced WebSockets.

### 0.1.0 – 2026-11-24
- DE: Erste Alpha-Version mit Shelly-Erkennung, manuellen Energiequellen, Raumzuordnung, aWATTar-Preisen und Web-Dashboard. Installation und Leistungsberechnung praktisch bestätigt. REST-Endpunkt liefert 404.
- EN: Initial alpha with Shelly discovery, manual energy sources, room assignment, aWATTar prices and web dashboard. Installation and power calculation confirmed in a practical test. REST endpoint returns 404.


## Lizenz

MIT – Copyright (c) 2026 hotwin <hotwin@gmx.net>. Siehe [LICENSE](../../LICENSE).
