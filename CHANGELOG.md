# Changelog / Änderungsprotokoll

## 0.3.0-beta.14 – 2026-11-25

- DE: Aktueller Börsen- und Brutto-Arbeitspreis zeigen ihr gemeinsames Gültigkeitsintervall. Abgelaufene Werte werden bis zur nächsten passenden Messung ausgeblendet.
- EN: The current spot and gross contract prices display their shared validity window. Expired values are hidden until a matching snapshot arrives.
- DE: Kompaktere Übersicht mit Zählerdiagnose, optionaler nicht zugeordneter Leistung und eigenen Gerätenamen mit separaten technischen Details. Fehlende Verbrauchswerte erscheinen nicht als null Kilowattstunden.
- EN: A more compact overview adds meter diagnostics, optional unassigned power, and custom device names with separate technical details. Missing consumption readings no longer appear as zero kilowatt-hours.
- DE: Der offizielle ioBroker Repository Checker prüft den konkreten Release-Commit und muss vor der npm-Veröffentlichung erfolgreich sein.
- EN: The official ioBroker Repository Checker validates the exact release commit and must pass before npm publication.

## 0.3.0-beta.13 – 2026-11-25

- DE: Die lokale Messwerterfassung und die Verfügbarkeit eines aktuellen aWATTar-Preises haben getrennte Statusdatenpunkte. Nach API-Fehlern verlängert sich der Wiederholungsabstand auf bis zu 15 Minuten.
- EN: Local data collection and current aWATTar price availability have separate status states. Retry delays increase to up to 15 minutes after API failures.

## 0.3.0-beta.12 – 2026-11-25

- DE: Geräte werden nach Räumen in aufklappbaren Gruppen angezeigt. Der Schnellzugriff verlinkt das Web-Dashboard des Energy Managers.
- EN: Devices appear in expandable groups by room. Quick access links to the Energy Manager web dashboard.

## 0.3.0-beta.11 – 2026-11-25

- DE: Die Übersicht gruppiert Hausstromzähler, erfasste Geräte und Strompreise in drei Bereichen. Der Hinweis zu überlappenden Messpunkten steht unter Geräte.
- EN: The overview groups the main electricity meter, monitored devices, and electricity prices into three panels. The note about overlapping measurement points moved to Devices.

## 0.3.0-beta.10 – 2026-11-25

- DE: Datenpunkte für Zählerstand und aktuelle Leistung des Hausstromzählers lassen sich einzeln in der Instanzkonfiguration auswählen und erscheinen in der Übersicht.
- EN: Select the house meter's reading and current power independently in the instance settings to display them in the overview.

## 0.3.0-beta.9 – 2026-11-25

- DE: Lokale Verbrauchsauswertung mit Vergleich zum Durchschnitt erfasster Vortage und günstigstem verfügbaren Tarifintervall der nächsten 24 Stunden.
- EN: Local consumption insights compare yesterday with recorded prior days and highlight the cheapest available tariff interval in the next 24 hours.
- DE: Optionale Übernahme von Einstellungen, Tarif, Gerätealiasen und Verbrauchsverlauf mit Probelauf und Sicherung.
- EN: Opt-in import of settings, tariff, device aliases and consumption history with preview and backup.

## 0.3.0-beta.8 – 2026-11-24

- DE: Adapterkennung auf `hotwin-energy-manager` geändert, um den npm-Namenskonflikt zu lösen.
- EN: Rename the adapter ID to `hotwin-energy-manager` to resolve the npm package name conflict.
- DE: Offizielles ioBroker-Release-Script für Versionsabgleich, Changelog und Git-Tags eingerichtet.
- EN: Configure the official ioBroker release script for version synchronization, changelog entries, and Git tags.

## 0.3.0-beta.7 – 2026-11-24

- DE: Gerätenamen über ein dezentes Stiftsymbol und einen klareren Dialog bearbeiten. „Aktuelle Leistung“ zeigt nur Messwert und Einheit. Details zum Messpunkt stehen beim Gerätenamen.
- EN: Edit device names with a pencil button and a clearer dialog. Current power displays only the reading and unit. Power source details appear under the device name.

## 0.3.0-beta.6 – 2026-11-24

- DE: Die Raumübersicht zeigt aktuelle Leistung und Geräteanzahl in kompakten Karten. Die Geräteliste mit Einzelwerten lässt sich je Raum aufklappen.
- EN: Compact room cards show current power and device count. Expand each card to see individual device readings.

## 0.3.0-beta.5 – 2026-11-24

- DE: Energiefluss von der erfassten Gesamtenergie über Räume zu Geräten sowie Verlauf für Stundenverbrauch, Tageskosten und Strompreise auf der Startseite. Die neuen Messreihen beginnen mit der Aufzeichnung nach dem Update.
- EN: Energy flow from recorded total to rooms and devices, with hourly usage, daily costs and electricity price history on the overview. New measurement series start recording after the update.

## 0.3.0-beta.4 – 2026-11-24

- DE: Gerätenamen im Admin speichern. Die Geräteliste zeigt Leistungsdatenpunkte und Einheiten an und bevorzugt aktuelle Messwerte.
- EN: Store device aliases in Admin. The device list shows power state IDs and units and prefers live measurements.

## 0.3.0-beta.3 – 2026-11-24

### Deutsch

- Vertragsdaten im ioBroker Admin bearbeiten und dauerhaft in der Instanz speichern.
- Brutto-Arbeitspreis anhand der gewählten Formel berechnen. aWATTar HOURLY unterstützt den prozentualen Aufschlag auf den Betrag des Börsenpreises und optionale Bruttopreisgrenzen für die Energie.
- Fehlende Vertragsbeträge, einen späteren Vertragsstart und fehlende aktuelle Börsenpreise im Dashboard anzeigen.

### English

- Edit contract details in ioBroker Admin and persist them in the instance configuration.
- Calculate gross rates with the selected formula. aWATTar HOURLY supports a percentage surcharge on the absolute spot price and optional gross energy price limits.
- Explain missing contract inputs, future start dates and unavailable market prices in the dashboard.

## 0.3.0-beta.2 – 2026-11-24

### Deutsch

- Anklickbare Kacheln für Leistung, Verbrauch, Kosten, Börsenpreis und Brutto-Arbeitspreis.
- Die Preisübersicht zeigt Börsenpreis und den berechneten Brutto-Arbeitspreis je verfügbarem Preisintervall.

### English

- Clickable tiles for power, consumption, costs, market price and gross contract rate.
- The price view displays the market price and calculated gross contract rate for each available interval.

## 0.3.0-beta.1 – 2026-11-24

### Deutsch

- Responsives Dashboard im ioBroker Admin mit Übersicht, Geräten, Räumen, Verbrauchsstatistik, Preisen, Vertrag und Updates.
- Geräteerkennung über die Aufzählung Strommessung, mit manueller Zuordnung und optionaler Shelly-Erkennung.
- Neues PNG-Icon sowie deutsche und englische Texte im Dashboard und in der Konfiguration.
- Auswertungen für sieben Tage, Monat, Quartal und Jahr. Tarifgrenzen und Fixkosten werden separat behandelt.
- ESLint, ioBroker-Paketprüfung sowie Integrations- und Compact-Mode-Tests in der abgesicherten GitHub-Workflow-Matrix.

### English

- Responsive ioBroker Admin dashboard covering overview, devices, rooms, statistics, prices, contract and updates.
- Energy measurement enum discovery across vendors, with manual mappings and optional Shelly discovery.
- New PNG icon and English and German dashboard and configuration text.
- Seven-day, monthly, quarterly and annual statistics. Tariff boundaries and fixed charges are handled separately.
- ESLint, ioBroker package validation, and integration and Compact Mode tests in the pinned GitHub workflow matrix.

## 0.2.1 – 2026-11-24
- DE: WebSocket-Transport ausdrücklich gewählt, um HTTP-Polling bei erzwungenen WebSockets zu vermeiden. Live-Anzeige im Praxistest bestätigt.
- EN: Explicit WebSocket transport avoids HTTP polling when WebSockets are forced. Live display confirmed in practical test.

## 0.2.0 – 2026-11-24
- DE: Experimentelle Socket.IO-Live-Anbindung ersetzt REST-Abfrage. Weboberfläche erreichbar; Verbindung meldet `xhr poll error` bei erzwungenen WebSockets.
- EN: Experimental Socket.IO live connection replaces REST polling. Dashboard loads; connection reports `xhr poll error` with forced WebSockets.

## 0.1.0 – 2026-11-24
- DE: Erste Alpha-Version mit Shelly-Erkennung, manuellen Energiequellen, Raumzuordnung, aWATTar-Preisen und Web-Dashboard. Installation und Leistungsberechnung praktisch bestätigt. REST-Endpunkt liefert 404.
- EN: Initial alpha with Shelly discovery, manual energy sources, room assignment, aWATTar prices and web dashboard. Installation and power calculation confirmed in a practical test. REST endpoint returns 404.
