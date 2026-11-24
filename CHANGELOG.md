# Changelog / Änderungsprotokoll

## Unreleased / In Entwicklung
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
