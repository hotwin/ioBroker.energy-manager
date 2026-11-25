# Changelog / Änderungsprotokoll

## 0.3.0-beta.12 – 2026-11-25

[Installationspaket / Installation package (.tgz)](https://raw.githubusercontent.com/hotwin/ioBroker.energy-manager/packages/0.3.0-beta.12/iobroker.hotwin-energy-manager-0.3.0-beta.12.tgz)

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

## Unreleased / In Entwicklung
- DE: Herstellerübergreifende Messstellenerkennung aus Strommessungs-Aufzählungen vor Shelly-Fallback; noch ungetestet.
- EN: Vendor-independent discovery from energy measurement enums before Shelly fallback; untested.
- DE: Web-Navigation mit getrennten Ansichten und Vertragsübersicht; native Admin-Einzelwerte bleiben erhalten. Web-Änderungen noch ungetestet.
- EN: Separate web views and contract overview; native Admin summary retained. Web changes not yet tested.
- DE: Native JSON-Anbindung im Praxistest bestätigt; formatierte Einzelwerte statt Rohdaten im Praxistest mit Admin 8.3.5 bestätigt.
- EN: Native JSON connection confirmed in practice; formatted summary values confirmed in practical testing with Admin 8.3.5.
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
