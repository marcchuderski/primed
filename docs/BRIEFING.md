# Primed – Briefing: Funktionsumfang und Fachlogik

Stand: 16.10.2026 · Status: Konzept abgeschlossen, bereit für Umsetzung

## 1. Ziel

Primed ersetzt einen bisherigen Ablauf, bei dem Mahlzeiten-Makros in einem KI-Chat berechnet und in einen zweiten Chat übertragen wurden. Die App soll:

- Protein und Kalorien **trainingsadaptiv** tracken (Sollwerte hängen von der Tagesart ab),
- vorgekochte Gerichte (Meal Prep) einmal erfassen und portionsweise eintragen lassen,
- Supermarkt-Produkte schnell per Favorit, Suche oder Barcode eintragen lassen,
- jederzeit zeigen, was heute **bis zum Training** und **insgesamt** noch offen ist,
- regelbasierte Vorschläge geben (inkl. Shake-Entscheidung), **ohne KI**,
- Woche, Monat und Jahr als Bilanz auswerten.

Gewicht ist kein Steuerungsparameter. Ziel ist Leistungs- und Muskelerhalt mit langsamer, optionaler Fettreduktion (Defizit vor allem an Ruhetagen).

Nutzer: zunächst ein einzelner User, Datenmodell aber mehrbenutzerfähig. Keine öffentliche Registrierung.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| Tagesart | Stufe mit eigenen Sollwerten (Ruhetag, Leicht, Normal Fitness, Normal Basketball, Intensiv/Spiel) |
| Trainingszeit | Startzeit + Dauer der Einheit an einem Trainingstag |
| Checkpoint | Zwischenziel „bis X Uhr Y % gegessen“, abgeleitet aus der Trainingszeit |
| Eintrag | Ein gegessenes Lebensmittel bzw. eine Portion mit Menge und Uhrzeit |
| Bibliothek | Wiederverwendbare Lebensmittel (Markenprodukte, Richtwerte, Zutaten) |
| Vorrat | Aktuelle Meal-Prep-Gerichte mit verbleibenden Portionen |
| Richtwert | Standard-Nährwert für Unverpacktes (z. B. Bäckerbrötchen), sichtbar markiert |
| Im Rahmen | kcal-Ist innerhalb ±5 % des kcal-Solls |

## 3. Tagesarten und Sollwerte

Werte siehe `docs/DEFAULTS.md`. Alle Werte sind in den Einstellungen änderbar.

- Jeder Tag hat genau **eine** Tagesart. Ruhetag hat keine Trainingszeit.
- Trainingstage haben **Startzeit** (Raster 15 min) und **Dauer** (Standard 90 min, Auswahl 60/90/120).
- Zwei Einheiten an einem Tag: der Nutzer wählt einfach „Intensiv“ und gibt die für die Ernährung relevante Uhrzeit an. Keine Sonderlogik.
- Ein Spiel ist eine Einheit der Tagesart „Intensiv / Spiel“. Es gibt **keine** separaten Trainingsarten.
- **Wochenvorlage:** pro Wochentag eine Standard-Tagesart (+ Uhrzeit/Dauer). Sie setzt die Tagesart eines Tages automatisch.
- Die Tagesart eines Tages kann **jederzeit** geändert werden, auch rückwirkend. „Training ausgefallen“ = Ruhetag wählen. Änderung gilt nur für diesen Tag, die Vorlage bleibt.
- Sollwerte werden beim Ändern der Tagesart sofort neu berechnet (auch rückwirkend für diesen Tag).

**Fett und Zucker** haben kein echtes Soll, werden aber mit Richtwert als dezenter Balken gezeigt:
- Fett-Richtwert = (kcal-Soll − Protein-Soll × 4 − KH-Soll × 4) / 9
- Zucker-Richtwert = 50 g

## 4. Checkpoints (bis zum Training)

Nur an Trainingstagen. Regel (Vorlage, änderbar):

- **Bis Trainingsbeginn − 3 h:** 70 % von kcal, Protein und KH erreicht.
- **Pre-Workout-Mahlzeit:** Fenster Trainingsbeginn − 3 h bis − 2 h, kohlenhydratreich, wenig Fett/Ballaststoffe.
- **Optionaler KH-Snack:** − 60 bis − 30 min, 20–40 g KH.
- **Nach dem Training:** Shake hat Vorrang vor einer großen Mahlzeit (siehe Shake-Regeln).

Darstellung: Auf den Balken für kcal, Protein und KH sitzt ein Marker an der Position des Checkpoint-Ziels (z. B. 70 %). Tap auf einen Balken zeigt ein Pop-up: „Bis 17:00: 1.092 von 1.820 kcal · noch 728. Gesamt heute: 2.600“.

## 5. Einträge

- Ein Eintrag besteht aus: Lebensmittel **oder** Gerichtsportion, Menge + Einheit, Datum, Uhrzeit.
- **Keine Mahlzeiten-Slots** (kein Frühstück/Mittag/Abend). Die Tagesliste ist chronologisch.
- Uhrzeit: Standard „jetzt“, Auswahl per Scroll-Rad im **15-Minuten-Raster**.
- Einheiten: g, Stück, Packung, Haushaltsmaße (EL/TL, Umrechnung pro Produkt hinterlegt).
- **Letzte verwendete Menge** eines Lebensmittels ist vorausgefüllt.
- Jeder Eintrag speichert einen **Nährwert-Schnappschuss**. Spätere Änderungen am Produkt verändern vergangene Einträge nicht.
- Nachtragen für andere Tage ist möglich (Datum wechseln). Checkpoints rechnen mit der eingetragenen Uhrzeit.
- Wischen löscht, Tap bearbeitet.

## 6. Bibliothek

**Typen:** Markenprodukt (meist mit Barcode), Richtwert (unverpackt), Zutat (nur im Meal-Prep-Editor sichtbar, nie im Schnell-Eintrag).

**Kategorien:** Snacks & Riegel · Milchprodukte & Quark · Brot & Backwaren · Obst & Gemüse · Getränke & Shakes

**Regeln**
- Nährwerte pro 100 g **oder** pro Stück, plus optional Packungsgröße und Haushaltsmaße.
- Ein Barcode existiert nur einmal (keine Duplikate).
- Sortierung nach Häufigkeit. „Häufig um diese Zeit“ lernt aus den Uhrzeiten vergangener Einträge.
- Filter: Kategorie als Pill-Reihe, Typ hinter einem Filter-Button.
- Alles, was einmal eingetragen wird, landet automatisch in der Bibliothek (Kategorie wird vorgeschlagen und bestätigt).

## 7. Hinzufügen-Ablauf

1. **„+“** öffnet den Schnell-Eintrag (Bottom-Sheet): Suche mit Scan-Button, Vorrat, Shakes, „Häufig um diese Zeit“.
2. **Suche** zeigt drei Gruppen: eigene Bibliothek · Online-Treffer (Open Food Facts) · Richtwerte. Fest unten: „Barcode scannen“ und „Neu anlegen“.
3. **Menge:** große Zahl mit −/+ und Schnellwahl (z. B. 100 g, 150 g, Packung), Nährwerte dieser Portion, Uhrzeit-Rad, getrennte Karte „Danach offen“ mit Mini-Balken.
4. **Scan:** Produkt gefunden → Menge. Nicht gefunden → Produkt anlegen.
5. **Produkt anlegen:** Name, Kategorie, Werte pro 100 g als **Stepper-Liste** mit eigener Schrittweite pro Wert (kcal ±20, Protein/KH/Zucker ±1, Fett ±0,5, Packung ±50). Zahl antippen öffnet die Tastatur. Gescannter Barcode wird verknüpft. Danach direkt zur Menge.

## 8. Meal Prep und Vorrat

- **Neues Gericht:** Name, Zutaten (Scan, Suche, Richtwert; Standard „ganze Packung“; Soßen/Öl per EL), Live-Summe.
- **Portionen:** gleichmäßige Aufteilung durch N, Werte pro Portion werden sofort angezeigt.
- **Speichern** legt das Gericht im **Vorrat** an, mit Zähler („3 von 4“).
- Tap auf eine Vorrats-Portion im Schnell-Eintrag trägt eine Portion ein, Zähler −1.
- Bei 0 Portionen wandert das Gericht ins **Archiv**: zählt weiter für den Verlauf, taucht in keiner Suche auf.
- Gerichte sind **keine** Bibliotheks-Einträge und werden nicht als Vorlage wiederverwendet (jedes Kochen ist anders).
- Kein Vorab-Planen auf Wochentage.

## 9. Shakes

Drei vordefinierte Shakes als Schnellbuttons (Werte in `docs/DEFAULTS.md`, änderbar): Groß (400 ml Milch 1,5 % + 30 g Whey), Klein 1,5 % (200 ml + 30 g), Klein 3,5 % (200 ml + 30 g).

## 10. Vorschläge (Zauberstab) – regelbasiert, ohne KI

Öffnet per Zauberstab-Button neben „+“ ein Sheet mit 2–3 Vorschlägen: Zeitpunkt, kurze Begründung, Makro-Effekt, Button „Eintragen“.

### Shake-Regeln (Schwellen änderbar)

| Situation | Vorschlag |
|---|---|
| Protein offen < 25 g | kein Shake, stattdessen passendes Lebensmittel aus Bibliothek/Vorrat |
| Trainingstag, **vor** dem Training | kein Shake, Fokus auf Kohlenhydrate (Checkpoint) |
| Trainingstag, **nach** dem Training | Shake hat Vorrang: **Groß** bei ≥ 35 g Protein **und** ≥ 500 kcal offen, sonst **Klein** |
| Nach dem Training, ≥ 700 kcal **und** viele KH offen | „leichte Mahlzeit + kleiner Shake“ |
| Ruhetag ab 19:00, ≥ 25 g Protein offen | **Klein**: 3,5 % bei ≥ 400 kcal offen, sonst 1,5 % |
| kcal bereits überschritten | nur bei ≥ 30 g Protein offen: **Klein 1,5 %**, sonst nichts |

Grundsätze aus dem Ernährungsplan:
- Die Tages-Proteinbilanz ist wichtiger als exaktes Post-Workout-Timing.
- Nach späten Abend-Workouts keine großen oder schwer verdaulichen Mahlzeiten.
- Keine Vorschläge, die unrealistisch große Einzelmahlzeiten erfordern.
- Vorschläge beziehen sich auf den Rest des Tages, nicht auf die Vergangenheit.

### Essens-Vorschläge
Aus Vorrat und Bibliothek die Optionen wählen, die die offenen Werte (bis Checkpoint bzw. Tagesende) am besten treffen, ohne das Soll deutlich zu überschreiten.

## 11. Verlauf

**Bewertung:** ausschließlich kcal-Ist gegen kcal-Soll, Toleranz **±5 %**. Drei Zustände: ✓ im Rahmen · ↓ unter Soll · ↑ über Soll. Unter Soll ist kein Fehler (Defizit ist gewollt). Protein wird angezeigt, fließt aber nicht in die Bewertung ein.

**Woche** (Start Montag)
- Bilanzkarte: kcal-Bilanz vs. Soll groß links mit Einordnung (z. B. „leichtes Defizit“), Ø Protein groß rechts, darunter drei getrennte Kacheln: Anzahl im Rahmen / unter / über.
- Tabelle: Tage als Spalten, Zeilen Tagesart · kcal-Rahmen · kcal (Ist + Abweichung %) · Protein (Ist/Soll) · KH (Ist/Soll) · Fett · Zucker. **Letzte Spalte Σ Woche.** Horizontal scrollbar.

**Monat:** Bilanzkarte wie Woche, Kalender mit Statusfarbe pro Tag, Markierung für Trainingstage und heute.

**Jahr:** Bilanzkarte, Monatsbilanzen als Balken über/unter der Nulllinie, Liste der Monate mit Ø Protein und Tagen im Rahmen.

## 12. Menü und Einstellungen

- Profil (Display-Name, Username, Passwort ändern)
- Darstellung: System · Hell · Dunkel (überschreibt Geräteeinstellung)
- Tagesarten & Sollwerte · Wochenvorlage · Shakes · Checkpoints · Vorschläge (Schwellen) · Bewertung (Toleranz)
- Überall abmelden · Abmelden

## 13. Login

- Username + Passwort, danach 30 Tage eingeloggt. Session serverseitig, widerrufbar.
- Nach Passwortänderung werden alle anderen Sessions beendet.
- Schöner Loading-Screen (Logo-Animation), sanfte Übergänge.

## 14. Bewusst nicht enthalten

Mahlzeiten-Slots · gespeicherte Kombis · Foto der Nährwerttabelle · Foto mehrerer Packungen · Export · KI im MVP · Offline-Modus · Bottom-Navigation · separate Trainingsarten · Ampel-Farben. Details und Gründe in `docs/DECISIONS.md`.

## 15. Offene Punkte (vor Umsetzung klären)

1. **Whey-Produkt:** exakte Nährwerte des verwendeten Whey (aktuell typische Werte als Default).
2. **Milch-Nährwerte:** Defaults für 1,5 % und 3,5 % prüfen oder durch eigene Produkte ersetzen.
3. **Richtwert-Grundliste:** Quelle (z. B. Bundeslebensmittelschlüssel, Lizenz prüfen) und Umfang der Startliste.
4. **Bilanz-Einordnung:** Schwellen für Texte wie „ausgeglichen“, „leichtes Defizit“, „Defizit“, „leichter Überschuss“, „Überschuss“.
5. **Session-Laufzeit:** 30 Tage fest ab Login oder bei jeder Nutzung verlängert?
6. **Login-Schutz:** konkrete Werte für Versuche/Zeitfenster und Sperrdauer.
7. **Open Food Facts:** Kontakt-E-Mail für den User-Agent.
8. **Server:** PHP-Version, MySQL- oder MariaDB-Version, SSH/Composer im Plesk verfügbar? Domain bzw. Subdomain.
9. **Protein an Trainingstagen:** überall 150 g oder an Trainingstagen leicht erhöht?
10. **Halbe Portion** beim Eintragen aus dem Vorrat gewünscht?
11. **Uhrzeit „jetzt“:** auf welche Viertelstunde runden (nächste oder letzte)?
