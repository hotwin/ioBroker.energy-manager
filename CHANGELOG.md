# Changelog / Änderungsprotokoll

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
