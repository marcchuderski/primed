# Primed – Briefing: Funktionsumfang und Fachlogik

Stand: 17.10.2026 · Status: offene Punkte geklärt, Umsetzung läuft

## 1. Ziel

Primed ersetzt einen bisherigen Ablauf, bei dem Mahlzeiten-Makros in einem KI-Chat berechnet und in einen zweiten Chat übertragen wurden. Die App soll:

- Protein und Kalorien **trainingsadaptiv** tracken (Sollwerte hängen von der Tagesart ab),
- vorgekochte Gerichte (Meal Prep) einmal erfassen und portionsweise eintragen lassen,
- Supermarkt-Produkte schnell per Favorit, Suche oder Barcode eintragen lassen,
- jederzeit zeigen, was heute **bis zum Training** und **insgesamt** noch offen ist,
- regelbasierte Vorschläge geben (inkl. Shake-Entscheidung), **ohne KI**,
- Woche, Monat und Jahr als Bilanz auswerten.

Gewicht ist kein Steuerungsparameter. Ziel ist Leistungs- und Muskelerhalt mit langsamer, optionaler Fettreduktion (Defizit vor allem an Ruhetagen).

Nutzer: der Betreiber und einzelne Freunde. Jeder User hat eigene, getrennte Daten und eine eigene Bibliothek (D-081). Keine öffentliche Registrierung: Accounts legt der Betreiber per CLI an und vergibt ein Startpasswort (D-079). Neue User starten mit einer neutralen Vorlage (D-080). Jeder User kann sein Konto in den Einstellungen selbst löschen (Bestätigungsdialog + Passwort, D-082).

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| Tagesart | Stufe mit eigenen Sollwerten (Ruhetag, Leicht, Normal Fitness, Normal Basketball, Intensiv/Spiel) |
| Trainingszeit | Startzeit + Dauer der Einheit an einem Trainingstag |
| Checkpoint | Zwischenziel „bis X Uhr Y % gegessen“, abgeleitet aus der Trainingszeit |
| Eintrag | Ein gegessenes Lebensmittel bzw. eine Portion mit Menge und Uhrzeit |
| Bibliothek | Wiederverwendbare Lebensmittel (Markenprodukte, Richtwerte, Zutaten) |
| Gerichte | Meal-Prep-Gerichte mit verbleibenden Portionen (früher „Vorrat“, D-118); aufgegessene im Archiv |
| Richtwert | Standard-Nährwert für Unverpacktes (z. B. Bäckerbrötchen), sichtbar markiert |
| Im Rahmen | kcal-Ist innerhalb ±5 % des kcal-Solls |

## 3. Tagesarten und Sollwerte

Werte siehe `docs/DEFAULTS.md`. Alle Werte sind in den Einstellungen änderbar.

- Die fünf Tagesarten aus `DEFAULTS.md` sind nur der Start: Tagesarten können **angelegt, bearbeitet und gelöscht** werden. Ausnahme: **„Ruhetag“ ist fest im System** (nicht löschbar, Name und Art fix, Sollwerte änderbar), damit er eindeutig erkennbar ist (D-106). Vergangene Tage behalten Name und Sollwerte ihrer Tagesart (Schnappschuss), auch wenn die Tagesart später gelöscht wird.
- **Protein:** ein **Protein-Standard** (150 g) in den Einstellungen. Jede Tagesart kann optional einen abweichenden Wert haben; ohne Abweichung gilt immer der Standard.
- Jeder Tag hat genau **eine** Tagesart. Ruhetag hat keine Trainingszeit.
- Trainingstage haben **Startzeit** (Raster 15 min, **frühestens 09:00**) und **Dauer** (Standard 90 min, Auswahl 30/60/90/120).
- **Tagesgrenze:** ein Tag endet um **02:00** des Folgetags. Einträge zwischen 00:00 und 01:59 gehören zum Vortag (z. B. Shake nach einem späten Spiel). Zeitzone Europe/Berlin.
- Zwei Einheiten an einem Tag: der Nutzer wählt einfach „Intensiv“ und gibt die für die Ernährung relevante Uhrzeit an. Keine Sonderlogik.
- Ein Spiel ist eine Einheit der Tagesart „Intensiv / Spiel“. Es gibt **keine** separaten Trainingsarten.
- **Wochenvorlage:** pro Wochentag eine Standard-Tagesart (+ Uhrzeit/Dauer). Sie setzt die Tagesart eines Tages automatisch.
- Die Tagesart eines Tages kann **jederzeit** geändert werden, auch rückwirkend. „Training ausgefallen“ = Ruhetag wählen. Änderung gilt nur für diesen Tag, die Vorlage bleibt.
- Sollwerte werden beim Ändern der Tagesart sofort neu berechnet (auch rückwirkend für diesen Tag).
- Änderungen an den **Einstellungen** (Sollwerte einer Tagesart, Protein-Standard, Wochenvorlage) gelten **ab heute**. Vergangene Tage bleiben immer fest (Soll-Schnappschuss), auch Tage, für die noch nie etwas gespeichert wurde.

**Fett und Zucker** haben kein echtes Soll, werden aber mit Richtwert als dezenter Balken gezeigt:
- Fett-Richtwert = (kcal-Soll − Protein-Soll × 4 − KH-Soll × 4) / 9
- Zucker-Richtwert = 50 g

## 4. Checkpoints (bis zum Training)

Nur an Trainingstagen. Regel (Vorlage, änderbar):

- **Bis Trainingsbeginn − 3 h:** 70 % von kcal, Protein und KH erreicht.
- **Frühester Checkpoint 06:00.** Läge der Checkpoint davor, entfällt er für diesen Tag (kein Marker). Mit frühestem Trainingsbeginn 09:00 tritt das nur auf, wenn die Grenzen in den Einstellungen geändert werden.
- **Pre-Workout-Mahlzeit:** Fenster Trainingsbeginn − 3 h bis − 2 h, kohlenhydratreich, wenig Fett/Ballaststoffe.
- **Optionaler KH-Snack:** − 60 bis − 30 min, 20–40 g KH.
- **Nach dem Training:** Shake hat Vorrang vor einer großen Mahlzeit (siehe Shake-Regeln).

Darstellung: Auf den Balken für kcal, Protein und KH sitzt ein Marker an der Position des Checkpoint-Ziels (z. B. 70 %). Tap auf einen Balken zeigt ein Pop-up: „Bis 17:00: 1.092 von 1.820 kcal · noch 728. Gesamt heute: 2.600“.

## 4a. Begrüßung (Heute)

Oben auf „Heute“: „Hey, [Display-Name].“ (fett, Textfarbe), direkt dahinter ein kurzer situativer Satz (normale Stärke, gedämpft). Darunter wie bisher das Datum als H1. Regelbasiert, ohne KI, als reine Funktion in `frontend/src/domain/`. Der Satz aktualisiert sich beim Öffnen und nach jedem neuen Eintrag. Die erste passende Regel gewinnt:

| # | Bedingung | Satz |
|---|---|---|
| 1 | Noch nichts eingetragen, zwischen 02:00 und 11:00 | „Guten Morgen. Heute ist [Tagesart].“ |
| 2 | Trainingstag, vor dem Checkpoint | „Noch [Zeit] bis zu deinem Pre-Workout.“ |
| 3 | Trainingstag, zwischen Checkpoint und Trainingsbeginn | „Noch [Zeit] bis zur nächsten Einheit.“ |
| 4 | Trainingstag, nach Trainingsende | „Starke Einheit. Jetzt zählt die Regeneration.“ |
| 5 | Protein offen > 0 und ≤ 15 g | „Nur noch [x] g Protein. Fast geschafft.“ |
| 6 | kcal im Rahmen (±5 %) und Protein-Soll erreicht | „Alles im Rahmen. Stark gemacht.“ |
| 7 | kcal über Soll (> +5 %) | „Kalorien sind durch. Morgen geht's weiter.“ |
| 8a | Standard, Einträge vorhanden, Protein offen | „Noch [x] g Protein für heute.“ |
| 8b | Standard, Einträge vorhanden, Protein-Soll erreicht | „Protein-Soll erreicht. Stark gemacht.“ |
| 8c | Standard, noch nichts eingetragen | täglich wechselnd (stabil pro Datum): „Schön, dass du da bist.“ / „Ein guter Tag zum Dranbleiben.“ / „Schritt für Schritt.“ / „Bleib dran.“ |

- Einen eigenen Spieltag-Satz gibt es nicht (Nutzerentscheidung); Spieltage nutzen Regel 2/3.
- Während des Trainings (Beginn bis Ende) greifen die Regeln ab 5.
- [Zeit] auf halbe Stunden gerundet: „30 Minuten“, „1 Stunde“, „1½ Stunden“, „2 Stunden“ … Unter 30 Minuten eigene Sätze: Regel 2 „Gleich ist Zeit für dein Pre-Workout.“, Regel 3 „Gleich geht's los mit der nächsten Einheit.“
- [Tagesart] als Kurzform für die Start-Tagesarten: „Ruhetag“, „leichtes Training“, „Fitness“, „Basketball“, „Spieltag“; eigene oder umbenannte Tagesarten mit ihrem Namen.
- Zahlen deutsch formatiert, Protein ganzzahlig. Ton neutral-motivierend, nie tadelnd, keine Emojis; höchstens zwei Zeilen auf 390 px.

## 5. Einträge

- Ein Eintrag besteht aus: Lebensmittel **oder** Gerichtsportion, Menge + Einheit, Datum, Uhrzeit.
- **Keine Mahlzeiten-Slots** (kein Frühstück/Mittag/Abend). Die Tagesliste ist chronologisch.
- Uhrzeit: Standard „jetzt“, **aufgerundet auf die nächste Viertelstunde** (14:08 → 14:15), Auswahl per Scroll-Rad im **15-Minuten-Raster**.
- **Einheiten-Umschalter** bei jeder Mengeneingabe (Menge-Sheet und Meal-Prep-Zutat): g · ml · EL · TL · Packung. Aktiv sind nur die Einheiten, die zur Basis des Produkts passen:

  | Basis | aktive Einheiten |
  |---|---|
  | 100 g | g · EL · TL · Packung |
  | 100 ml | ml · EL · TL · Packung |
  | Stück | Stück · Packung (kein EL/TL) |

- **Haushaltsmaße sind global und fest:** 1 EL = 15 g bzw. 15 ml, 1 TL = 5 g bzw. 5 ml. Fest im Code, weder in den Einstellungen noch pro Produkt änderbar (bewusste Vereinfachung, z. B. Öl real ca. 13–14 g/EL).
- Unter der Zahl steht die Umrechnung, z. B. „2 EL“ → „= 30 g · 1 EL = 15 g“. Schnellwahl-Chips passen sich der Einheit an (z. B. 1 / 2 / 3 EL).
- Zwischen g und ml wird nicht umgerechnet.
- Der Nährwert-Schnappschuss wird immer aus der **umgerechneten Menge in g bzw. ml** (bei Basis Stück: Stückzahl) berechnet; Menge und Einheit wie eingegeben werden mitgespeichert.
- **Letzte verwendete Menge** eines Lebensmittels ist vorausgefüllt.
- Jeder Eintrag speichert einen **Nährwert-Schnappschuss**. Spätere Änderungen am Produkt verändern vergangene Einträge nicht.
- Nachtragen für **vergangene** Tage ist möglich (Datum wechseln), Einträge für zukünftige Tage nicht. Checkpoints rechnen mit der eingetragenen Uhrzeit.
- Wischen löscht **nach Bestätigungsdialog**, Tap bearbeitet.

## 6. Bibliothek

**Typen:** Markenprodukt (meist mit Barcode), Richtwert (unverpackt, Standard-Nährwerte ohne Etikett), Zutat (nur im Meal-Prep-Editor sichtbar, nie im Schnell-Eintrag). Ein im Meal-Prep-Editor neu gescanntes Produkt wird als Zutat angelegt; der Typ ist später in der Bibliothek änderbar.

**Kategorien:** Snacks & Riegel · Milchprodukte & Quark · Brot & Backwaren · Obst & Gemüse · Getränke & Shakes · Grundnahrungsmittel (vorläufig, D-111)

**Regeln**
- Nährwerte **pro 100 g, pro 100 ml oder pro Stück** (genau eine Basis je Produkt), plus optional Packungsgröße in der Einheit der Basis (g, ml oder Stück). Haushaltsmaße werden **nicht** pro Produkt gepflegt (siehe Einträge).
- Ein Barcode existiert nur einmal (keine Duplikate).
- Sortierung nach Häufigkeit. „Häufig um diese Zeit“: Einträge der letzten 60 Tage im Fenster **±1,5 h** um die aktuelle Uhrzeit, die 5 häufigsten absteigend nach Häufigkeit, ohne Shakes.
- Gelöschte Produkte verschwinden aus Bibliothek und Suche; vergangene Einträge bleiben dank Schnappschuss unverändert.
- Online-Suche (Open Food Facts): gefiltert auf Deutschland/Deutsch, höchstens 10 Treffer, Hinweis „Daten: Open Food Facts“ (Lizenz ODbL).
- Richtwerte stammen aus dem Bundeslebensmittelschlüssel (BLS 4.0, CC BY 4.0); die Quellenangabe wird in der App angezeigt (Bibliothek/Suche).
- Filter: Kategorie als Pill-Reihe, Typ hinter einem Filter-Button.
- Alles, was einmal eingetragen wird, landet automatisch in der Bibliothek (Kategorie wird vorgeschlagen und bestätigt).

## 7. Hinzufügen-Ablauf

1. **„+“** öffnet den Schnell-Eintrag (Bottom-Sheet): Suche mit Scan-Button, Gerichte (mit übrigen Portionen), Shakes, „Häufig um diese Zeit“. Fest unten: „Gericht zubereiten“ und „Produkt anlegen“.
2. **Suche** zeigt drei Gruppen: eigene Bibliothek · Online-Treffer (Open Food Facts) · Richtwerte. Fest unten: „Barcode scannen“ und „Neu anlegen“.
3. **Menge:** Einheiten-Umschalter (g · ml · EL · TL · Packung, siehe Einträge), große Zahl mit −/+, Umrechnungszeile, Schnellwahl passend zur Einheit (z. B. 100 g / 150 g / Packung oder 1 / 2 / 3 EL), Nährwerte dieser Portion, Uhrzeit-Rad, getrennte Karte „Danach offen“ mit Mini-Balken.
4. **Scan:** Produkt gefunden → Menge. Nicht gefunden → Produkt anlegen.
5. **Produkt anlegen:** Name, Kategorie, Segment „Nährwerte angeben pro 100 g · 100 ml · Stück“ („So, wie es auf der Packung steht“), Werte als **Stepper-Liste** mit eigener Schrittweite pro Wert (kcal ±20, Protein/KH/Zucker ±1, Fett ±0,5, Packung ±50; Packungseinheit folgt der Basis). Zahl antippen öffnet die Tastatur. Gescannter Barcode wird verknüpft. Danach direkt zur Menge.

## 8. Meal Prep und Gerichte

- **Neues Gericht:** Name, Zutaten (Scan, Suche, Richtwert; Standard „ganze Packung“), Live-Summe.
- **Zutat-Menge** (Screen 17): gleicher Einheiten-Umschalter wie beim Essen (g · ml · EL · TL · Packung), z. B. Öl „2 EL = 30 g“; Button „Zur Zutatenliste hinzufügen“. Zutaten speichern Menge + Einheit wie eingegeben und die umgerechnete Menge.
- **Portionen:** gleichmäßige Aufteilung durch N, Werte pro Portion werden sofort angezeigt.
- **Speichern** legt das Gericht unter **Gerichte** an, mit Zähler („3 von 4“). Der Zähler ergibt sich immer aus den eingetragenen Portionen.
- Tap auf ein Gericht im Schnell-Eintrag öffnet die Menge (Standard 1 Portion, Schritte 0,5) mit Uhrzeit; Zähler sinkt entsprechend. **Halbe Portionen** sind möglich (Schritte von 0,5, z. B. „2,5 von 4“). Der Zähler fällt nie unter 0.
- Wird ein Gericht-Eintrag gelöscht oder geändert, wird der Zähler korrigiert; ein archiviertes Gericht kehrt dabei bei Bedarf zu den Gerichten zurück.
- Bei 0 Portionen wandert das Gericht ins **Archiv**: zählt weiter für den Verlauf, taucht in keiner Suche auf.
- **„Rest entsorgen“** schiebt ein Gericht ohne Einträge ins Archiv.
- Gerichte bleiben **immer editierbar** (Name, Zutaten, Portionsanzahl), auch nach dem ersten Eintrag, z. B. wenn Portionen abgegeben werden. Bereits erfasste Einträge behalten ihren Schnappschuss.
- Gerichte sind **keine** Bibliotheks-Einträge und tauchen in keiner Lebensmittel-Suche auf.
- **„Nochmal kochen“** (D-118): Im Archiv öffnet jedes Gericht auf Wunsch den Editor mit Name, Zutaten und Mengen vorausgefüllt; anpassen (Zutat weg, weniger Gramm, Portionen) und als **neues** Gericht speichern. Das alte bleibt unverändert.
- Kein Vorab-Planen auf Wochentage.

## 9. Shakes

**Varianten (D-139):** feste Größen Groß 400 ml und Klein 200 ml; Flüssigkeit nach Auswahl Milch 1,5 % · Milch 3,5 % · Wasser (Mehrfachauswahl, mindestens eine, Standard alle); Werte der Flüssigkeit fest aus den Richtwerten (Wasser 0 kcal), Proteinpulver aus der Bibliothek mit einstellbarer Menge (Standard 30 g). Shakes erscheinen nur im „+“ und in den Vorschlägen, nicht in der Bibliothek. Der Zauberstab nimmt bei knappen Kalorien die leichteste, bei viel Offenem die reichhaltigste gewählte Flüssigkeit, beim großen Shake bevorzugt Milch 1,5 %.

**Optional (D-137):** In Einstellungen › Shakes per Schalter ein- und ausschaltbar (Standard: an). Aus = keine Shakes im „+“ und keine Shake-Regeln in den Vorschlägen; Proteinpulver und Milch werden dann wie normales Essen behandelt.

Drei vordefinierte Shakes als Schnellbuttons (Zusammensetzung in `docs/DEFAULTS.md`, änderbar): Groß 1,5 % (400 ml Milch 1,5 % + 30 g Proteinpulver), Klein 1,5 % (200 ml + 30 g), Klein 3,5 % (200 ml + 30 g).

- Milch 1,5 % und 3,5 % sind normale Bibliothekseinträge (Basis pro 100 ml).
- Das Proteinpulver ist das in den Einstellungen gewählte **„Aktuelle Proteinpulver“** (ein Bibliotheksprodukt, Standard: ESN Designer Whey, Milk Chocolate).
- Die Makros der Shakes werden **automatisch** aus Milch + aktuellem Proteinpulver berechnet. Ein Wechsel des Pulvers wirkt ab dann; vergangene Einträge bleiben (Schnappschuss).

## 10. Vorschläge (Zauberstab) – regelbasiert, ohne KI

**Ohne Shakes (D-137):** keine Shake-Regeln; nach dem Training (bzw. vor dem Training als Vorschau „Nach dem Training · in …“) wird eine proteinreiche Mahlzeit aus den bekannten Kandidaten vorgeschlagen.

Öffnet per Zauberstab-Button neben „+“ ein Sheet mit 2–3 Vorschlägen: Zeitpunkt, kurze Begründung, Makro-Effekt, Button „Eintragen“.

### Shake-Regeln (Schwellen änderbar)

| Situation | Vorschlag |
|---|---|
| Protein offen < 25 g | kein Shake, stattdessen passendes Lebensmittel aus Bibliothek/Gerichten |
| Trainingstag, **vor** dem Training | kein Shake, Fokus auf Kohlenhydrate (Checkpoint) |
| Trainingstag, **nach** dem Training | Shake hat Vorrang: **Groß** bei ≥ 35 g Protein **und** ≥ 500 kcal offen, sonst **Klein** |
| Nach dem Training, ≥ 700 kcal **und** viele KH offen (≥ 400 kcal aus KH, also ≥ 100 g KH) | „leichte Mahlzeit + kleiner Shake“ |
| Ruhetag ab 19:00, ≥ 25 g Protein offen | **Klein**: 3,5 % bei ≥ 400 kcal offen, sonst 1,5 % |
| kcal bereits überschritten | nur bei ≥ 30 g Protein offen: **Klein 1,5 %**, sonst nichts |

- „Nach dem Training“ beginnt bei Trainingsbeginn + Dauer.
- Passen mehrere Regeln, hat **Protein Vorrang**. Reihenfolge (D-121): 1) Protein offen < 25 g → kein Shake · 2) kcal überschritten → Klein 1,5 % nur ab 30 g Protein offen · 3) Trainingstag vor Trainingsbeginn → kein Shake (KH-Fokus) · 4) während des Trainings → nichts · 5) nach dem Training → ≥ 700 kcal und ≥ 100 g KH offen: leichte Mahlzeit + kleiner Shake; sonst Groß bei ≥ 35 g P und ≥ 500 kcal, sonst Klein (3,5 % ab 400 kcal offen, sonst 1,5 %) · 6) Ruhetag ab 19:00 → Klein 3,5 % ab 400 kcal offen, sonst 1,5 %.
- **Realistische Vorschläge (D-122):** nur Gerichte mit mindestens einer Portion und Lebensmittel, die schon einmal eingetragen wurden, in der zuletzt verwendeten Menge; nie Zutaten, nie Proteinpulver oder Shake-Milch einzeln; höchstens 900 kcal pro Vorschlag und höchstens 10 % über dem offenen kcal-Rest.
- Vorschläge mit Zeitfenster (KH-Snack, Shake nach dem Training) werden zu dieser Uhrzeit eingetragen, sonst „jetzt“.
- Keine Merkliste („Für später merken“ aus dem Mockup entfällt).

Grundsätze aus dem Ernährungsplan:
- Die Tages-Proteinbilanz ist wichtiger als exaktes Post-Workout-Timing.
- Nach späten Abend-Workouts keine großen oder schwer verdaulichen Mahlzeiten.
- Keine Vorschläge, die unrealistisch große Einzelmahlzeiten erfordern.
- Vorschläge beziehen sich auf den Rest des Tages, nicht auf die Vergangenheit.

### Essens-Vorschläge
Aus Gerichten und Bibliothek die Optionen wählen, die die offenen Werte (bis Checkpoint bzw. Tagesende) am besten treffen, ohne das Soll deutlich zu überschreiten.

## 11. Verlauf

**Bewertung:** ausschließlich kcal-Ist gegen kcal-Soll, Toleranz **±5 %**. Drei Zustände: ✓ im Rahmen · ↓ unter Soll · ↑ über Soll. Unter Soll ist kein Fehler (Defizit ist gewollt). Protein wird angezeigt, fließt aber nicht in die Bewertung ein.

**Bilanz-Einordnung** (Abweichung der kcal-Summe vom Soll-Summe des Zeitraums, in %):

| Abweichung | Text |
|---|---|
| innerhalb ±5 % | ausgeglichen |
| −5 bis −15 % | leichtes Defizit |
| unter −15 % | Defizit |
| +5 bis +10 % | leichter Überschuss |
| über +10 % | Überschuss |

**Tage ohne Einträge** zeigen „/“, sind ausgegraut und fließen weder in Bewertung noch in Durchschnitte oder Summen ein. **Der laufende Tag** erscheint als „läuft“ und wird erst ab dem Folgetag bewertet und eingerechnet.

**Woche** (Start Montag, Kalenderwoche nach ISO 8601)
- Bilanzkarte: kcal-Bilanz vs. Soll groß links mit Einordnung (z. B. „leichtes Defizit“), Ø Protein groß rechts, darunter drei getrennte Kacheln: Anzahl im Rahmen / unter / über.
- Tabelle: Tage als Spalten, Zeilen Tagesart · kcal-Rahmen · kcal (Ist + Abweichung %) · Protein (Ist/Soll) · KH (Ist/Soll) · Fett · Zucker. **Letzte Spalte Σ Woche.** Horizontal scrollbar.

**Monat:** Bilanzkarte wie Woche, Kalender mit Statusfarbe pro Tag, Markierung für Trainingstage und heute.

**Jahr:** Bilanzkarte, Monatsbilanzen als Balken über/unter der Nulllinie, Liste der Monate mit Ø Protein und Tagen im Rahmen.

## 12. Menü und Einstellungen

- Profil (Display-Name ändern, Username nur anzeigen – fest ab Anlage, D-152; Passwort ändern)
- Aktuelles Proteinpulver, Protein-Standard
- Darstellung: System · Hell · Dunkel (überschreibt Geräteeinstellung)
- Reihenfolge: Tagesarten & Sollwerte · Wochenvorlage · Checkpoints · Bewertung (Toleranz) · Shakes (Erklärung, An/Aus; bei an: Proteinpulver + Menge, Flüssigkeiten als Pills, Vorschlags-Schwellen)
- **Tagesarten & Sollwerte** (Screen 19): Protein-Standard als Stepper, Liste der Tagesarten (Icon Training/Ruhe, Name, kcal · Protein · KH; Tap = bearbeiten), Button „Neue Tagesart“, darunter immer sichtbar die Zeile „Hilfe beim Ermitteln deiner Richtwerte“ (Icon CircleHelp).
- **Modal „Richtwerte ermitteln“** (Screen 20, Bottom-Sheet in voller Höhe, D-108): Titel, ein Satz Erklärung, Schließen. Vier Schritte: Fragebogen kopieren · KI deiner Wahl öffnen und einfügen · Fragen beantworten · Ergebnis hier eintragen. Vorschau des Fragebogens (nach unten ausgeblendet) mit Link „Ganzen Fragebogen anzeigen“; Primärbutton „Fragebogen kopieren“ (Zwischenablage nur auf Klick, danach kurz „Kopiert“; Fallback: markierbarer Text). „Dann einfügen in“: ChatGPT, Claude, Copilot, Gemini (nur Startseiten, Text vorher kopieren; Anzeige: Name + Lucide ExternalLink, keine Logos; neuer Tab, `rel="noopener noreferrer"`, D-109). Ganz unten, durch eine Linie abgesetzt, wörtlich:
  - „Hinweis: Kein Ersatz für ärztliche oder ernährungsfachliche Beratung. Die Werte sind unverbindliche Richtwerte, die eine KI aus deinen Angaben berechnet; Primed übernimmt dafür keine Gewähr. Bei Erkrankungen, Schwangerschaft, Stillzeit oder Essstörungen sprich bitte mit einer Ärztin, einem Arzt oder einer Ernährungsfachkraft.“
  - „Deine Antworten gehen an den Anbieter, den du wählst. Primed sendet dabei nichts.“
- Der Fragebogen-Text stammt ausschließlich aus `docs/RICHTWERTE-PROMPT.md` und liegt als Konstante im Frontend (keine API, keine Nutzerdaten).
- Abmelden (Button), darunter „Überall abmelden“ als Textlink
- Konto löschen (Bestätigungsdialog + Passwort, löscht alle eigenen Daten)

## 13. Login

- Username + Passwort. Session serverseitig, widerrufbar: **gleitend 30 Tage** (jede Nutzung verlängert), **höchstens 90 Tage ab Login**.
- Nach Passwortänderung werden alle anderen Sessions beendet.
- Passwort: mindestens 12 Zeichen, keine Zeichenregeln, Abgleich mit einer lokal mitgelieferten Liste häufiger Passwörter.
- Login-Schutz: pro IP + Username 5 Fehlversuche in 15 min → 15 min Sperre; pro Username ab 10 Fehlversuchen (alle IPs) steigende Verzögerung statt harter Sperre; pro IP höchstens 30 Versuche pro Stunde.
- Kein „Passwort vergessen?“ (Link aus dem Mockup entfällt). Reset und Anlage von Usern nur per CLI-Skript auf dem Server (`bin/user-create`).
- Kein eigener Loading-Screen (D-096): Die Logo-Animation (Ring füllt sich, ca. 1,4 s) läuft auf dem Login-Screen, danach blenden Text und Felder ein. Eingeloggte User landen ohne Wartezeit direkt in der App. Sanfte Übergänge.

## 14. Bewusst nicht enthalten

Mahlzeiten-Slots · gespeicherte Kombis · Foto der Nährwerttabelle · Foto mehrerer Packungen · Export · KI im MVP · Offline-Modus · Bottom-Navigation · separate Trainingsarten · Ampel-Farben. Details und Gründe in `docs/DECISIONS.md`.

## 15. Geklärte Punkte

Alle ursprünglich offenen Punkte wurden am 17.10.2026 mit dem Nutzer geklärt und oben eingearbeitet; Begründungen in `docs/DECISIONS.md` (D-040 ff.).

## 16. Offene Punkte

1. ~~„Häufig um diese Zeit“~~ – ±1,5 h (D-083).
2. ~~ESN Designer Whey~~ – Werte recherchiert, ohne Einzelbestätigung freigegeben (D-110).
3. ~~BLS-Lizenz und Richtwerte~~ – ohne Einzelbestätigung freigegeben (D-110).
4. ~~Neue Mockups für „Produkt anlegen“~~ – geliefert (06, 07, 17, 18), siehe D-073.
5. ~~Screenshot zur PWA-Installation~~ – Screen 18 (nur Nutzer-Doku).
6. **Shake-Regeln:** konkrete Reihenfolge bei „Protein hat Vorrang“ in Phase 5 bestätigen.
7. ~~Richtwerte-Modal: Link-Ziele und Logos~~ – nur Startseiten, Name + ExternalLink-Icon (D-109).
8. ~~Fragebogen-Dauer~~ – 30 min ergänzt.
