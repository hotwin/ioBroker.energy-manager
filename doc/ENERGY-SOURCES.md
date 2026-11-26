# Energiequellen

Geplante Geräteverwaltung nach dem Vorbild von Home Assistant. Automatische Shelly-Erkennung plus manuelle Auswahl beliebiger ioBroker-State-IDs über einen Objektbaum. Keine Schreibzugriffe auf Quellgeräte.

Pro Messstelle: stabile ID, Anzeigename, Raum, optionaler Leistungsdatenpunkt (W), optionaler kumulativer Energiezähler (Wh/kWh), Einheit, Aktivierung, Einbeziehung in Gesamtsumme, Kostenberechnung und Historie. Mindestens ein Messdatenpunkt erforderlich. Ohne Energiezähler nur geschätzte Integration der Leistung; Messlücken kennzeichnen. Doppelte Datenpunkte ablehnen, überlappende Haupt- und Unterzähler aus der Summe ausschließen können. Datenpunkt-Typ und Einheit validieren. Änderungen persistent in Adapterkonfiguration speichern. Shelly zuerst; Zigbee2MQTT und andere Quellen über manuelle Zuordnung, spätere automatische Erkennung modular ergänzen.

Status: Spezifikation, noch nicht implementiert.
