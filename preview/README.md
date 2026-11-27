# Inoffizielle Energy-Manager-Vorschau

Die Vorschau hat die eigene Adapter-ID `hotwin-energy-manager-preview`. Sie liest die angegebene Altinstanz und speichert eine Kopie ihrer Konfiguration und Verbrauchshistorie im eigenen Instanzdatenverzeichnis in `preview-ledger.json`. Der Adapter schreibt ausschließlich in sein eigenes Verzeichnis und seinen eigenen Datenpunkt-Namensraum.

## Einrichtung in einer Testumgebung

1. In diesem Verzeichnis `npm pack` ausführen. Das erzeugte Paket auf den ioBroker-Testhost kopieren.
2. Im ioBroker-Installationsverzeichnis das Paket mit `iobroker url /absoluter/pfad/iobroker.hotwin-energy-manager-preview-0.0.1.tgz` installieren.
3. Eine Vorschauinstanz anlegen und unter „Bestehende Energy-Manager-Instanz“ den Quellnamensraum eintragen, beispielsweise `hotwin-energy-manager.0`. Den kumulativen Energie-Datenpunkt aus der alten Historie auswählen. Er muss genau einem aktiven gespeicherten Zähler entsprechen.
4. Vorschau starten und `lastDelta` sowie `measuredEnergy` prüfen. Die Vorschau übernimmt den letzten gespeicherten Zählerstand als Startwert und verwendet Messzeitstempel zur Deduplizierung. Beim Neustart wird der eigene gespeicherte Zählerstand geladen. Die Altinstanz kann parallel laufen.

Der aktuelle Testumfang ist auf einen explizit gewählten Zähler begrenzt. Tagesübergreifende Deltas erscheinen in `unallocatedEnergy`. Die Verbrauchsausgaben beziehen sich auf Messungen seit dem Import. Die historische Kopie liegt in der lokalen Datei. Tarifkosten bleiben in dieser Vorschau unbewertet. Die Datei kann vertrauliche Konfiguration enthalten und ist für den lokalen Gebrauch vorgesehen.
