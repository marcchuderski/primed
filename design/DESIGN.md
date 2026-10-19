# Primed – Design-Richtlinien

Verbindliche Gestaltungsregeln für die Umsetzung. Werte als CSS-Variablen in [`tokens.css`](tokens.css), Live-Übersicht in [`kitchen-sink.html`](kitchen-sink.html), alle Screens unter [`screens/`](screens/index.html).

Bei Abweichungen oder Lücken gilt die Arbeitsregel aus `CLAUDE.md`: Trade-offs zwischen Design, Benutzerfreundlichkeit und Sicherheit werden nicht selbst entschieden, sondern mit Optionen vorgelegt.

---

## 1. Haltung

- **Ruhig und minimalistisch.** Ein Screen, eine Aufgabe. Kein Dashboard-Dschungel.
- **Der aktuelle Tag steht im Mittelpunkt.** Startscreen ist immer „Heute“.
- **Klare visuelle Hierarchie:** Tag → Tagesart → Balken → Einträge.
- **Weiche Übergänge.** Flächen heben sich nur minimal voneinander ab, Kontrast entsteht durch Schrift und Akzentfarbe, nicht durch harte Flächenwechsel.
- **Orange ist positiv.** Die Akzentfarbe markiert Protein, Hauptaktionen und Trainingsbezug, niemals Fehler oder Überschreitungen.
- **Zahlen zuerst.** Große, gut lesbare Zahlen mit gleich breiten Ziffern.
- **Möglichst wenig tippen.** Vorausgefüllte Werte, Stepper, Schnellwahl-Chips, Scroll-Räder.

## 2. Marke

- **Name:** Primed (das P steht auch für Protein)
- **Zeichen:** P, dessen Bauch ein zu ca. ¾ gefüllter Fortschrittsring ist. Stiel liegt **über** dem Ring.
- **Wortmarke:** „primed“ kleingeschrieben in Bricolage Grotesque 800, das „p“ in Akzentfarbe.
- **Logo-Lockup in der App (verbindlich, wie Screen 18):** Zeichen als „p“ + „rimed“ auf gemeinsamer Grundlinie; Zeichen ≈ 0,81 × Schriftgröße hoch (viewBox `26 13 75 90`), Abstand ≈ 0,06 em, „rimed“ mit Laufweite −0,05 em. Gilt für Loading, Login, Footer und alle weiteren Screens; „primed“ mit Text-„p“ nur in Fließtext.
- **App-Icon:** Zeichen auf Sand (`#ECE3D6`). Dateien in [`brand/`](brand/):
  - `apple-touch-icon.png` (180 px, iOS rundet selbst)
  - `icon-192.png`, `icon-512.png` (PWA-Manifest)
  - `icon-maskable-512.png` (mit Sicherheitszone, `purpose: maskable`)
  - `favicon.svg`, `favicon-32.png`
  - `primed-icon.svg` (Master, abgerundet)

## 3. Farben

Zwei Themes: **Light „Sand & Glut“** und **Dark „Night Court“**.

| Token | Light | Dark | Einsatz |
|---|---|---|---|
| `--bg` | `#ECE3D6` | `#17191D` | Seitenhintergrund |
| `--surface` | `#F5EEE4` | `#1F2227` | Karten, Listen, Sheets |
| `--tonal` | `#DED1BF` | `#2B2F36` | Chips, sekundäre Buttons, Segment-Track |
| `--text` | `#2E2721` | `#E8E3DB` | Schrift |
| `--text-muted` | `#6A5E52` | `#9F9A92` | Sekundärtext, Labels |
| `--accent` | `#F2622E` | `#F27A4B` | Protein-Balken, Primär-Buttons, Plus, Marker |
| `--accent-text` | `#A8410F` | `#F59A73` | Protein-Zahlen als Schrift |
| `--on-accent` | `#2E2721` | `#17191D` | Schrift auf Akzentfläche (nie Weiß) |
| `--scrim` | `#B9AE9F` | `#07080A` | Hintergrund hinter Bottom-Sheets |
| `--input-border` | Text 14 % | Text 14 % | Rahmen von Eingabefeldern (aus Login-Mockup) |
| `--ring-track` | Text 12 % | Text 12 % | unbefüllter Teil des Logo-Rings (aus Mockups) |

**Regeln**
- Nur **Protein** bekommt einen farbigen Balken. Kalorien, KH, Fett, Zucker sind neutral.
- Primäre Aktion pro Screen: Akzentfläche mit dunkler Schrift. Sekundär: tonal.
- Keine Verläufe, keine Glas-Effekte, keine harten Schatten.

### Statusfarben (Bewertung)

Bewertet wird nur die **kcal-Bilanz gegen das Tagessoll, Toleranz ±5 %**. Drei Zustände, aus der Terrakotta-Familie, **nie in voller Deckkraft** als Fläche:

| Zustand | Symbol | Farbe | Fläche Light | Schrift Light |
|---|---|---|---|---|
| Im Rahmen | ✓ | Oliv | `rgba(125,132,80,.24)` | `#59603A` |
| Unter Soll | ↓ | Ocker | `rgba(212,154,58,.26)` | `#875C12` |
| Über Soll | ↑ | Altrosa | `rgba(183,134,127,.34)` | `#87483F` |

- Alle drei gleich gewichtet, Unterscheidung über Farbe **und** Symbol (barrierearm).
- Unter Soll ist kein Fehler (Defizit ist gewollt), über Soll soll erkennbar sein.
- Kein Grün-Gelb-Rot-Ampelsystem. Orange nie für Status.

## 4. Typografie

| Rolle | Schrift | Größe / Gewicht |
|---|---|---|
| Screen-Titel (Tag, „Essen“, „Verlauf“) | Bricolage Grotesque | 34–38 px / 800, Laufweite −0,035 em |
| Abschnitt („Heute“, Sheet-Titel) | Bricolage Grotesque | 24–26 px / 800 |
| Große Zahlen (Menge, Bilanz) | Bricolage Grotesque | 36–104 px / 800, `tabular-nums` |
| Fließtext, Listentitel | Inter | 15–16 px / 600 für Titel, 400–500 für Text |
| Sekundärtext, Makrozeile | Inter | 13 px / 400–600 |
| Gruppenlabel | Inter | 12 px / 600, Versalien, +0,06 em |

- Alle Zahlen mit `font-variant-numeric: tabular-nums`.
- Deutsche Zahlenformate: `1.092`, `0,5 g`, `−210 kcal` (echtes Minus).
- Ansprache in Du-Form, kurze aktive Formulierungen.

## 5. Form & Abstand

- Radien: Sheet 30 px (oben), Karte 22–26 px, Listeneintrag 18 px, Button 16–18 px, Input 16 px, Chips/Pills rund.
- Abstände im 4er-Raster (4/8/12/16/20/24). Seitenrand 20–22 px.
- Touch-Ziele mindestens 44 × 44 px.
- Telefon-Layout zuerst (390 px Breite), Inhalte zentriert mit max. Breite auf Desktop.

## 6. Komponenten

**Makro-Balken** (Kern des Heute-Screens)
- Hauptbalken 12 px (kcal, Protein, KH), Nebenbalken 6 px (Fett, Zucker; Fett-Richtwert = Restkalorien, Zucker-Richtwert 50 g).
- Drei Stufen: leer (Track ~10–20 %), gegessen (Füllung ~72–88 %), überschritten (volle Breite, ~85 %, plus Label „+180“).
- **Trainings-Marker:** 3 px breiter Strich an der Position des Bis-Training-Ziels (z. B. 70 %). Auf neutralen Balken in Akzent, auf dem Protein-Balken in Textfarbe. Nur an Trainingstagen.
- Tap auf einen Balken öffnet ein Mini-Pop-up: „Bis 17:00: 1.092 von 1.820 kcal · noch 728. Gesamt heute: 2.600“.

**Navigation**
- Oben drei Text-Tabs: Heute · Essen · Verlauf. Aktiver Tab fett mit Akzent-Unterstrich. Rechts Menü-Icon.
- Keine Bottom-Navigation.

**Begrüßung (Heute):** über dem Datum eine Zeile „Hey, [Name].“ (Inter 15 px, 700, `--text`) gefolgt vom situativen Satz (Inter 15 px, 400, `--text-muted`) im selben Absatz; bricht sauber auf höchstens zwei Zeilen um. Regeln in `docs/BRIEFING.md` §4a.

**Tagesart-Picker (Screen 08):** Ist eine Trainings-Tagesart gewählt, zeigt die Liste nur die Auswahl plus „Auswahl ändern“ (Trainingszeit rückt ins Blickfeld). Dauer-Pills 30 · 60 · 90 · 120 min als 2×2-Raster, gleich hoch wie das Uhrzeit-Rad (96 px).

**Tagesart-Chip** unter dem Titel, tonal, öffnet den Tagesart-Picker (Bottom-Sheet).

**Listeneintrag:** Titel + Menge, darunter Makrozeile (Protein in `--accent-text`), Uhrzeit rechts. Wischen löscht, Tap bearbeitet. Keine Mahlzeiten-Slots.

**Bottom-Sheets** für Hinzufügen, Suche, Menge, Tagesart, Vorschläge: Griff oben, Titel links, Schließen rechts, Primärbutton unten. Nur der Inhalt scrollt, Griff und Titel bleiben stehen. In Such-Sheets (Hinzufügen, Zutat suchen, Proteinpulver) bleiben auch Suchzeile und Schnellzugriffe (Scannen, Produkt anlegen) fest; in allen anderen Sheets steht der Hauptbutton am Ende des Inhalts (D-142).

**Eingaben**
- Mengen: Einheiten-Segment **g · ml · EL · TL · Packung** über der Zahl; nur zur Produkt-Basis passende Einheiten sind aktiv (100 g: g/EL/TL/Packung · 100 ml: ml/EL/TL/Packung · Stück: Stück/Packung). Große Zahl mit −/+, darunter die Umrechnung („2 EL = 30 g · 1 EL = 15 g“), Schnellwahl-Chips passend zur Einheit (z. B. 1 / 2 / 3 EL), letzte Menge vorausgefüllt. Gleiches Muster für Meal-Prep-Zutaten (Screen 17).
- Haushaltsmaße fest: 1 EL = 15 g/ml, 1 TL = 5 g/ml.
- Uhrzeit: Scroll-Rad wie iOS-Wecker, **15-Minuten-Schritte**, „Jetzt“-Button.
- Produkt anlegen: Segment „Nährwerte angeben pro 100 g · 100 ml · Stück“ mit Hinweis „So, wie es auf der Packung steht.“, darunter Stepper-Liste, Schrittweite pro Wert (kcal ±20, Protein/KH/Zucker ±1, Fett ±0,5, Packung ±50), Packungsgröße in der Einheit der Basis, Zahl antippen = Tastatur. Keine Haushaltsmaße pro Produkt.

**Segment-Schalter** auf tonalem Track, aktives Segment auf `--surface`.

**Filter in Listen:** eine Taxonomie als Pill-Reihe (Kategorie), die zweite hinter einem Filter-Button (Typ: Markenprodukt / Richtwert / Zutat).

**Verlauf:** Bilanzkarte mit kcal-Bilanz groß links, Ø Protein groß rechts (Akzent), darunter drei getrennte Status-Kacheln. Wochentabelle: Tage als Spalten, Merkmale als Zeilen, letzte Spalte **Σ Woche**, horizontal scrollbar.

**Profil:** Username als feste Zeile oben (Label „Username“, Hinweis „Damit meldest du dich an. Lässt sich nicht ändern.“, rechts `@username` gedämpft mit Schloss-Icon), kein Eingabefeld (D-152). Darunter Display-Name, Passwort ändern, Konto löschen.

**Footer** am Ende aller Seiten (Heute, Essen, Verlauf, Menü und Einstellungsseiten), nie in Sheets: kleines Logo, Version, gedämpft (D-145).

## 7. Icons

- Icon-Set: **Lucide** (`lucide-react`), Strichstärke 2–2,4, Größe 18–22 px.
- Keine Emojis in der UI.
- Icon-only-Buttons immer mit `aria-label`.

## 8. Bewegung

- **Login:** Ring im Logo-Lockup füllt sich auf ¾ (ca. 1,4 s), danach blenden Überschrift und Formular ein (ab ~0,9 s, 0,5 s). Kein separater Loading-Screen (D-096); während der Session-Prüfung nur Hintergrund.
- **Sheets:** von unten einfahren, 250–300 ms, ease-out. Scrim blendet mit.
- **Tabs/Screens:** kurzer Crossfade (~150 ms).
- **Balken:** füllen sich animiert, wenn ein Eintrag hinzukommt.
- `prefers-reduced-motion` respektieren: dann keine Animationen außer sofortigen Zustandswechseln.

## 9. Theme-Umschaltung

- Standard: folgt dem Gerät (`prefers-color-scheme`).
- Im Menü unter „Darstellung“: **System · Hell · Dunkel**. Hell/Dunkel überschreiben das Gerät und werden pro Nutzer gespeichert.
- Umsetzung über `data-theme` auf `<html>` (siehe `tokens.css`).

## 10. Barrierefreiheit

- Text-Kontrast mindestens 4,5 : 1 (große Zahlen 3 : 1).
- Status nie nur über Farbe: immer Symbol (✓ ↓ ↑) dazu.
- Echte `<button>`, `<a>`, `<label>`/`<input>`; sichtbarer Fokus.

## 11. Screens

Statische Referenz-Mockups mit Beispieldaten (keine echten Werte), je Light und Dark:

| Nr. | Screen | Zweck |
|---|---|---|
| 01 | Loading | ~~Animiertes Logo~~ entfällt (D-096), Animation jetzt im Login |
| 02 | Login | Lockup + Claim „Primed for performance.“ (wie Screen 18, `--accent-text`, 24 px), Username, Passwort |
| 03 | Heute | Tag, Tagesart, Balken, Einträge |
| 04 | Hinzufügen | Suche, Scan, Gerichte, Shakes, Häufig; unten „Gericht zubereiten“ · „Produkt anlegen“ |
| 05 | Suche | Bibliothek, Online-Treffer, Richtwerte, Neu anlegen |
| 06 | Menge | Einheit, Menge, Uhrzeit, „Danach offen“ |
| 07 | Produkt anlegen | Basis-Wahl, Stepper-Liste |
| 08 | Tagesart | Tagesart, Trainingszeit, Dauer |
| 09 | Vorschläge | Zauberstab, regelbasiert |
| 10 | Essen · Gerichte | Meal-Prep-Portionen (Segment „Gerichte“ statt „Vorrat“, D-118), Archiv mit „Nochmal kochen“ |
| 11 | Essen · Bibliothek | Produkte, Filter |
| 12 | Meal Prep | Gericht anlegen, Portionen |
| 13–15 | Verlauf | Woche, Monat, Jahr |
| 16 | Menü | Profil, Darstellung, Einstellungen |
| 17 | Meal Prep · Zutat | Zutat-Menge mit Einheiten-Umschalter |
| 19 | Tagesarten & Sollwerte | Einstellungen: Protein-Standard, Tagesarten-Liste, „Neue Tagesart“, Hilfe-Zeile |
| 20 | Richtwerte ermitteln | Modal (Sheet, volle Höhe): Schritte, Fragebogen kopieren, KI-Anbieter, Hinweise |
| 18 | PWA-Installation | Anleitung Homescreen, nur für die Nutzer-Doku (wird nicht als App-Screen gebaut) |
