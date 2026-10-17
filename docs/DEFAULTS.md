# Voreinstellungen und Startdaten

Die App startet **komplett vorbefüllt**. Alle Werte sind in den Einstellungen änderbar. Werte mit ⚠ sind Defaults, die vor dem Seed bestätigt werden müssen (siehe Offene Punkte im Briefing).

## Erster User

Display-Name „Marc“, Username `marcch`. Anlage per `bin/user-create` auf dem Server; das Passwort vergibt der Nutzer selbst.

## Persönliche Eckdaten (Kontext, kein Steuerungsparameter)

männlich, 30 Jahre, 1,70 m, ca. 77 kg, Kraft- und Ausdauersport (Basketball).

## Tagesarten

**Protein-Standard:** 150 g (Einstellung). Tagesarten können optional abweichen; ohne Abweichung gilt der Standard. Start: keine Abweichungen.
Tagesarten sind frei anleg-, änder- und löschbar; die folgenden fünf sind der Startbestand.

| Tagesart | kcal | Protein | KH | Fett-Richtwert* | Zucker-Richtwert |
|---|---|---|---|---|---|
| Ruhetag | 2.000 | 150 g | 200 g | 67 g | 50 g |
| Leichtes Training | 2.300 | 150 g | 250 g | 78 g | 50 g |
| Normal · Fitness | 2.600 | 150 g | 300 g | 89 g | 50 g |
| Normal · Basketball | 2.600 | 150 g | 350 g | 67 g | 50 g |
| Intensiv / Spiel | 2.800 | 150 g | 400 g | 67 g | 50 g |

\* berechnet: (kcal − Protein × 4 − KH × 4) / 9, gerundet.
Standarddauer Training: 90 min. Auswahl: 60 / 90 / 120 min. Frühester Trainingsbeginn: 09:00.
Tagesgrenze: 02:00 (Einträge bis 01:59 zählen zum Vortag).

## Wochenvorlage

| Mo | Di | Mi | Do | Fr | Sa | So |
|---|---|---|---|---|---|---|
| Ruhetag | Normal · Basketball, 20:00, 90 min | Ruhetag | Normal · Basketball, 20:00, 90 min | Ruhetag | Ruhetag | Ruhetag |

## Checkpoint-Vorlage

| Regel | Wert |
|---|---|
| Checkpoint-Zeit | Trainingsbeginn − 3 h |
| Checkpoint-Ziel | 70 % von kcal, Protein, KH |
| Pre-Workout-Fenster | − 3 h bis − 2 h |
| KH-Snack-Fenster | − 60 bis − 30 min, 20–40 g KH |
| Frühester Checkpoint | 06:00 (davor entfällt der Checkpoint) |

## Shakes

Shakes werden aus Bibliothekseinträgen berechnet: Milch + **Aktuelles Proteinpulver** (Einstellung).

| Bibliothekseintrag | Typ | Basis | kcal | Protein | KH | davon Zucker | Fett | Kategorie |
|---|---|---|---|---|---|---|---|---|
| Milch 1,5 % | Richtwert | pro 100 ml | 47 | 3,4 | 4,8 | 4,8 | 1,5 | Getränke & Shakes |
| Milch 3,5 % | Richtwert | pro 100 ml | 64 | 3,3 | 4,7 | 4,7 | 3,5 | Getränke & Shakes |
| ESN Designer Whey, Milk Chocolate ⚠ | Markenprodukt | pro 100 g | Werte werden recherchiert und bestätigt | | | | | Getränke & Shakes |

Milchwerte vom Nutzer bestätigt (17.10.2026). Standard-Proteinpulver: ESN Designer Whey, Milk Chocolate.

Richtwerte zur Orientierung (mit typischem Whey 30 g = 117 kcal · 24 g P · 2 g KH · 1,8 g F; werden mit dem echten Pulver neu berechnet):

| Shake | Zusammensetzung | kcal | Protein | KH | Fett |
|---|---|---|---|---|---|
| Groß | 400 ml Milch 1,5 % + 30 g Whey | ~305 | ~38 g | ~21 g | ~8 g |
| Klein 1,5 % | 200 ml Milch 1,5 % + 30 g Whey | ~211 | ~31 g | ~12 g | ~5 g |
| Klein 3,5 % | 200 ml Milch 3,5 % + 30 g Whey | ~245 | ~31 g | ~11 g | ~9 g |

## Shake- und Vorschlags-Schwellen

| Schwelle | Wert |
|---|---|
| Mindest-Proteinlücke für Shake | 25 g |
| Großer Shake ab | 35 g Protein **und** 500 kcal offen |
| „Leichte Mahlzeit + kleiner Shake“ ab | 700 kcal offen nach dem Training |
| Ruhetag: Shake-Vorschläge ab | 19:00 |
| Ruhetag: 3,5 %-Milch ab | 400 kcal offen |
| „Viele KH offen“ | ≥ 400 kcal aus KH (≥ 100 g KH) |
| kcal überschritten: Shake nur ab | 30 g Protein offen |

## Bewertung

Toleranz „im Rahmen“: **±5 %** vom kcal-Soll.

| Bilanz-Einordnung (Abweichung vom Soll des Zeitraums) | Text |
|---|---|
| innerhalb ±5 % | ausgeglichen |
| −5 bis −15 % | leichtes Defizit |
| unter −15 % | Defizit |
| +5 bis +10 % | leichter Überschuss |
| über +10 % | Überschuss |

## Bibliothek: Startprodukte (aus dem bisherigen Ernährungsplan)

| Produkt | Bezug | kcal | Fett | KH | Zucker | Protein | Kategorie |
|---|---|---|---|---|---|---|---|
| REWE Quarkcreme | 200 g (Becher) | 134 | 1,0 | 6,4 | 5,2 | 24,8 | Milchprodukte & Quark |
| REWE Dinkelbrötchen | pro 100 g | 246 | 1,8 | 46,0 | 2,7 | 10,0 | Brot & Backwaren |
| Lidl körniger Frischkäse | pro 100 g | 97 | 0,5 | 4,0 | 4,0 | 19,0 | Milchprodukte & Quark |
| DM Proteinriegel | 1 Stück | 163 | 4,6 | 12,0 | 1,2 | 23,0 | Snacks & Riegel |
| Lidl Müsli-Riegel | 1 Stück | 87 | 2,3 | 17,0 | 0,4 | 1,9 | Snacks & Riegel |
| Lidl Chicken Nuggets | pro 100 g | 315 | 13,2 | 23,3 | 1,1 | 25,2 | Snacks & Riegel |

## Richtwert-Grundliste ⚠

Quelle: Bundeslebensmittelschlüssel (BLS), Lizenz wird vor Nutzung geprüft. Umfang: diese 14 Lebensmittel, Werte vor dem Seed bestätigen: Bäckerbrötchen (Weizen), Magerquark, Skyr natur, Hähnchenbrust, Reis (roh), Nudeln (roh), Haferflocken, Banane, Apfel, Zwiebel, Paprika, Olivenöl, Butter, Eier.

## Haushaltsmaße (fest im Code)

| Maß | Basis 100 g | Basis 100 ml |
|---|---|---|
| 1 EL | 15 g | 15 ml |
| 1 TL | 5 g | 5 ml |

Nicht änderbar, nicht pro Produkt; bei Basis Stück nicht verfügbar.

## Kategorien

Snacks & Riegel · Milchprodukte & Quark · Brot & Backwaren · Obst & Gemüse · Getränke & Shakes
