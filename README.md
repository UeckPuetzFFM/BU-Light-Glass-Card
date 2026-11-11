# Light Glass Card

Eine eigenständige Lovelace-Custom-Card für Home Assistant im dunklen Glass-Design der Heating Glass Card.

## Funktionen
- Licht ein- und ausschalten
- Helligkeit dimmbarer Lampen von 1 bis 100 % einstellen
- Status und aktuelle Helligkeit anzeigen
- Visueller Home-Assistant-Konfigurationseditor
- Kartenbreite und Mindesthöhe einstellen
- Automatische Erkennung der Dimmfähigkeit anhand von `supported_color_modes`

## YAML-Beispiel

```yaml
type: custom:light-glass-card
entity: light.lampe_balkon_links
name: Balkon links
card_width: auto
min_height: 210
```

## Installation
1. `light-glass-card.js` nach `/config/www/` kopieren.
2. Unter Einstellungen → Dashboards → Ressourcen `/local/light-glass-card.js` als JavaScript-Modul hinzufügen.
3. Dashboard bearbeiten und die Light Glass Card hinzufügen.

## Hinweise
Die Karte verwendet die Home-Assistant-Dienste `light.turn_on` und `light.turn_off`. Der Helligkeitsregler übergibt `brightness_pct`.
