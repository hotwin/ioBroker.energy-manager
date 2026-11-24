# Changelog / Änderungsprotokoll

## Unreleased / In Entwicklung
- DE: Native JSON-Anbindung im Praxistest bestätigt; formatierte Einzelwerte statt Rohdaten ergänzt, noch zu testen.
- EN: Native JSON connection confirmed in practice; formatted summary values replace raw data, pending test.
- DE: Nativer JSON-Admin-Tab zur Diagnose mit drei schreibgeschützten Datenpunkten; Admin 8.3.5 beim Nutzer bestätigt, Integration noch ungetestet.
- EN: Native JSON Admin diagnostic tab with three read-only states; user runs Admin 8.3.5, integration not yet tested.
- DE: Admin-Verbindungsdiagnose, sofortige Abfrage bei bestehender Verbindung und Timeout ergänzt. Tagesverbrauch im Praxistest aufgezeichnet.
- EN: Added Admin connection diagnostics, immediate read for existing connections and timeout. Daily consumption recorded in practical testing.
- DE: Helles responsives Dashboard mit überarbeiteten Kacheln, Navigation, Tabellen und Preisübersicht; visuelle Prüfung offen.
- EN: Refreshed responsive light dashboard, cards, navigation, tables and price overview; visual review pending.
- DE: Automatische Leistungsanzeige in kW ab 1.000 W in Web und Admin.
- EN: Automatically display power in kW from 1,000 W in web and Admin.
- DE: Admin unterstützt auch Socket-Client-Objekte mit io.connect statt ausschließlich Funktionsaufruf.
- EN: Admin supports socket client objects exposing io.connect, not only callable clients.
- DE: Admin-spezifische Socket.IO-Skriptpfade ergänzt; Weboberfläche unverändert. Praxistest offen.
- EN: Added Admin-specific Socket.IO script path fallbacks; web dashboard unchanged. Practical test pending.
- DE: Automatische Raum- und Funktionszuordnung über ioBroker-Aufzählungen, Raumkacheln mit aktueller Leistung. Ungetestet.
- EN: Automatic room and function assignment via ioBroker enums, room cards with current power. Untested.
- DE: Eigener Admin-Menüeintrag mit Dashboard und Statistik; Admin-Verbindung noch zu testen.
- EN: Native Admin menu entry with dashboard and statistics; Admin connection not yet tested.
- DE: Separate Netto-Tarifbestandteile, Grundgebühr, Messstellenbetrieb, Abschlag und Vertragsbeginn konfigurierbar. Variable Aufschläge in Tarifberechnung integriert; zeitanteilige Fixkostenstatistik noch offen.
- EN: Configurable net tariff components, base charge, metering, advance payment and contract start. Variable surcharges included in tariff calculation; historical fixed charge allocation pending.
- DE: Statistik mit Zeitraumwahl bis 365 Tage und Tagesbalken; ungetestet.
- EN: Statistics with period selection up to 365 days and daily bars; untested.
- DE: Persistente Tagesverbrauchserfassung aus Zählerdifferenzen; Messlücken, Rücksetzungen und Tageswechsel werden konservativ ausgelassen. Teilkosten nur bei bekanntem unverändertem Tarif. Noch ungetestet.
- EN: Persistent daily meter delta aggregation; gaps, resets and day boundaries are conservatively skipped. Partial costs only for known unchanged tariffs. Not yet tested.
- DE: Responsive Navigation und ioBroker-Gerätenamen ergänzt; noch ungetestet.
- EN: Added responsive navigation and ioBroker device names; not yet tested.

## 0.2.1 – 2026-11-24
- DE: WebSocket-Transport ausdrücklich gewählt, um HTTP-Polling bei erzwungenen WebSockets zu vermeiden. Live-Anzeige im Praxistest bestätigt.
- EN: Explicit WebSocket transport avoids HTTP polling when WebSockets are forced. Live display confirmed in practical test.

## 0.2.0 – 2026-11-24
- DE: Experimentelle Socket.IO-Live-Anbindung ersetzt REST-Abfrage. Weboberfläche erreichbar; Verbindung meldet `xhr poll error` bei erzwungenen WebSockets.
- EN: Experimental Socket.IO live connection replaces REST polling. Dashboard loads; connection reports `xhr poll error` with forced WebSockets.

## 0.1.0 – 2026-11-24
- DE: Erste Alpha-Version mit Shelly-Erkennung, manuellen Energiequellen, Raumzuordnung, aWATTar-Preisen und Web-Dashboard. Installation und Leistungsberechnung praktisch bestätigt. REST-Endpunkt liefert 404.
- EN: Initial alpha with Shelly discovery, manual energy sources, room assignment, aWATTar prices and web dashboard. Installation and power calculation confirmed in a practical test. REST endpoint returns 404.
