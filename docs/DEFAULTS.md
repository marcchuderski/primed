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
Standarddauer Training: 90 min. Auswahl: 30 / 60 / 90 / 120 min. Frühester Trainingsbeginn: 09:00.
Tagesgrenze: 02:00 (Einträge bis 01:59 zählen zum Vortag).

„Ruhetag“ ist fest im System (D-106): nicht löschbar, Name und Art fix, nur die Sollwerte sind änderbar.

## Wochenvorlage

**Neue User (Standard, D-080):** alle sieben Tage „Ruhetag“.

**Betreiber (nur mit `--owner-defaults`):**

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

Shakes werden aus festen Milchwerten (seit D-139 im Code, `ShakeService::LIQUIDS`) und dem **aktuellen Proteinpulver** (Einstellung) berechnet. Startbibliothek für alle User seit Migration 012 (D-159): nur die beiden Milch-Einträge (in der Bibliothek nur sichtbar, solange Shakes an sind) und das Whey.

| Bibliothekseintrag | Typ | Basis | kcal | Protein | KH | davon Zucker | Fett | Kategorie |
|---|---|---|---|---|---|---|---|---|
| Milch 1,5 % | Richtwert | pro 100 ml | 47 | 3,4 | 4,8 | 4,8 | 1,5 | Getränke & Shakes |
| Milch 3,5 % | Richtwert | pro 100 ml | 64 | 3,3 | 4,7 | 4,7 | 3,5 | Getränke & Shakes |
| ESN Designer Whey Milk Chocolate (EAN 4250519647234, Packung 908 g) | Markenprodukt | pro 100 g | 374 | 72,0 | 5,9 | 5,2 | 5,3 | Getränke & Shakes |

Milchwerte vom Nutzer bestätigt (17.10.2026). Standard-Proteinpulver: ESN Designer Whey, Milk Chocolate – Werte aus übereinstimmenden Händlerangaben und Open Food Facts (Stand 10/2026), nicht gegen das Etikett geprüft (D-110). Milch, Whey und Richtwerte bekommt jeder User.

Richtwerte zur Orientierung (mit typischem Whey 30 g = 117 kcal · 24 g P · 2 g KH · 1,8 g F; werden mit dem echten Pulver neu berechnet):

| Shake | Zusammensetzung | kcal | Protein | KH | Fett |
|---|---|---|---|---|---|
| Groß 1,5 % | 400 ml Milch 1,5 % + 30 g Whey | ~305 | ~38 g | ~21 g | ~8 g |
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

## ~~Bibliothek: Startprodukte (aus dem bisherigen Ernährungsplan)~~

Entfernt mit Migration 012 (D-159), für alle User; nur noch als Referenz:

| Produkt | Bezug | kcal | Fett | KH | Zucker | Protein | Kategorie |
|---|---|---|---|---|---|---|---|
| REWE Quarkcreme | 200 g (Becher) | 134 | 1,0 | 6,4 | 5,2 | 24,8 | Milchprodukte & Quark |
| REWE Dinkelbrötchen | pro 100 g | 246 | 1,8 | 46,0 | 2,7 | 10,0 | Brot & Backwaren |
| Lidl körniger Frischkäse | pro 100 g | 97 | 0,5 | 4,0 | 4,0 | 19,0 | Milchprodukte & Quark |
| DM Proteinriegel | 1 Stück | 163 | 4,6 | 12,0 | 1,2 | 23,0 | Snacks & Riegel |
| Lidl Müsli-Riegel | 1 Stück | 87 | 2,3 | 17,0 | 0,4 | 1,9 | Snacks & Riegel |
| Lidl Chicken Nuggets | pro 100 g | 315 | 13,2 | 23,3 | 1,1 | 25,2 | Snacks & Riegel |

## Gemeinsame Richtwerte (Migration 015, D-170, D-171)

110 unverpackte Lebensmittel in `reference_foods`, Werte und Quellen (BLS-Code, Stückgewicht-Quelle) direkt in `api/migrations/015_reference_foods.sql`. Gruppen: Brötchen & Gebäck (17), Brot je Scheibe (8), Süßes vom Bäcker (15, ohne Franzbrötchen), Obst (23), Gemüse (24), Milchprodukte (20), Ei, Milch 1,5 % / 3,5 %. Nährwerte BLS 4.0 inkl. Errata; Milch, Kefir, Buttermilch je 100 ml (Dichte 1,03 g/ml). Stückgewichte: USDA FoodData Central (Obst/Gemüse) bzw. dokumentierte Schätzung typischer Bäckereigrößen.

## ~~Richtwert-Grundliste (für alle User)~~

Entfernt mit Migration 012 (D-159), für alle User; nur noch als Referenz.

Quelle: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 – Deutsche Nährstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0. Lizenz CC BY 4.0 (Namensnennung Pflicht; Werte auf 0,1 gerundet, KH = „verfügbar“ ohne Ballaststoffe). Freigegeben ohne Einzelbestätigung (D-110). Alle pro 100 g:

| Richtwert | BLS-Code | kcal | Protein | KH | Zucker | Fett | Kategorie |
|---|---|---|---|---|---|---|---|
| Bäckerbrötchen (Weizen) | B511000 | 280 | 10,1 | 54,0 | 3,1 | 1,8 | Brot |
| Magerquark | M713100 | 66 | 11,9 | 3,7 | 3,7 | 0,2 | Milchprodukte |
| Skyr natur | M710100 | 64 | 10,4 | 3,2 | 3,1 | 0,8 | Milchprodukte |
| Hähnchenbrust, roh | V416100 | 109 | 23,3 | 0 | 0 | 1,8 | Grundnahrungsmittel |
| Reis, roh | C352000 | 351 | 7,9 | 77,1 | 0,3 | 0,6 | Grundnahrungsmittel |
| Nudeln, roh | E401000 | 346 | 12,4 | 68,8 | 2,0 | 1,6 | Grundnahrungsmittel |
| Haferflocken | C133000 | 348 | 13,2 | 53,3 | 0,7 | 6,7 | Grundnahrungsmittel |
| Banane | F503100 | 79 | 1,3 | 15,9 | 13,9 | 0,4 | Obst & Gemüse |
| Apfel | F110100 | 58 | 0,4 | 11,7 | 10,5 | 0,5 | Obst & Gemüse |
| Zwiebel | G480100 | 34 | 1,2 | 6,0 | 6,0 | 0,2 | Obst & Gemüse |
| Paprika, rot | G543100 | 36 | 1,0 | 6,2 | 6,2 | 0,2 | Obst & Gemüse |
| Olivenöl | Q120000 | 899 | 0 | 0 | 0 | 99,9 | Grundnahrungsmittel |
| Butter | Q630000 | 747 | 0,6 | 0,6 | 0,6 | 82,5 | Grundnahrungsmittel |
| Ei (Hühnerei), roh | E111100 | 135 | 13,2 | 0,3 | 0,3 | 9,0 | Grundnahrungsmittel |

## Haushaltsmaße (fest im Code)

| Maß | Basis 100 g | Basis 100 ml |
|---|---|---|
| 1 EL | 15 g | 15 ml |
| 1 TL | 5 g | 5 ml |

Nicht änderbar, nicht pro Produkt; bei Basis Stück nicht verfügbar.

## Kategorien

Snacks & Riegel · Milchprodukte & Quark · Brot & Backwaren · Obst & Gemüse · Getränke & Shakes · Grundnahrungsmittel (vorläufig, D-111) · Öle & Saucen (D-162) · Supplements · Fertigessen (D-165)
