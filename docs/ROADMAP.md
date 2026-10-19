# Roadmap

Status: `geplant` · `in Arbeit` · `fertig` · `verworfen` · `blockiert`
Nach jedem Item: Tests, Security Audit (`agent-skills:security-and-hardening`), Doku-Update.

## Phase 0 – Setup

| ID | Item | Status |
|---|---|---|
| 0.1 | Offene Punkte aus `BRIEFING.md` klären | fertig |
| 0.2 | Frontend-Gerüst (Vite, React, TS strict, ESLint, Prettier, Vitest) | fertig |
| 0.3 | API-Gerüst (Composer, PSR-12, Front-Controller, Router, PHPUnit) | fertig |
| 0.4 | Design-Tokens, selbst gehostete Schriften, Basis-Komponenten | fertig |

## Phase 1 – Fundament & Sicherheit

| ID | Item | Status |
|---|---|---|
| 1.1 | Migrationen: Users, Sessions, Login-Versuche, Settings | fertig |
| 1.2 | Login, Logout, Überall abmelden, Passwort ändern, Rate-Limit | fertig (API + CLI; Oberfläche in 1.4/7.1) |
| 1.3 | Security-Header, CSP, HSTS, CSRF, `.htaccess`, Fehlerbehandlung ohne Datenlecks | fertig (live in DDEV mit `scripts/check-headers.sh` geprüft) |
| 1.4 | Loading-Screen, Login-Screen | fertig (Loading-Screen per D-096 durch Animation im Login ersetzt) |
| 1.5 | Erstes Test-Deployment auf Plesk nach `DEPLOYMENT.md` | verworfen (Nutzer: lokal mit DDEV testen, D-092) |

## Phase 2 – Kern: Heute

| ID | Item | Status |
|---|---|---|
| 2.1 | Tagesarten (anlegen/ändern/löschen), Protein-Standard, Wochenvorlage, Tage mit Tagesgrenze 02:00 (mit Seed aus `DEFAULTS.md`) | fertig (API; Oberflächen in 2.3/2.4/7.1) |
| 2.2 | Fachlogik: Sollwerte, Fett-Richtwert, Checkpoints, Offen-Werte (+ Tests) | fertig (zusätzlich kcal-Bewertung, Formatierung, Begrüßung) |
| 2.3 | Heute-Screen: Tabs, situative Begrüßung (BRIEFING §4a, Fachlogik + Tests), Tagesart-Chip, Balken mit Marker, Pop-up | fertig (Zauberstab/„+“ noch deaktiviert bis Phase 3/5; Einträge folgen mit 2.5) |
| 2.4 | Tagesart-Picker (Tagesart, Uhrzeit-Rad, Dauer) | fertig |
| 2.5 | Einträge: anlegen, bearbeiten, löschen, Schnappschuss, nachtragen | fertig (API inkl. Anlegen; Oberfläche: Liste, Bearbeiten im Mengen-Sheet, Löschen mit Bestätigung; Anlegen-Oberfläche mit 3.2/3.3, Nachtragen-Oberfläche mit Datumswechsel in 3.2) |

## Phase 3 – Hinzufügen & Bibliothek

| ID | Item | Status |
|---|---|---|
| 3.1 | Bibliothek mit Startprodukten und Richtwerten | fertig (API, Seed: BLS-Richtwerte, Milch, Whey, Startprodukte) |
| 3.2 | Schnell-Eintrag-Sheet (Suche, Gerichte, Shakes, Häufig um diese Zeit) | fertig (Gerichte mit Phase 4) |
| 3.3 | Mengen-Sheet (Stepper, Schnellwahl, Uhrzeit, „Danach offen“) | fertig (inkl. Tagesauswahl zum Nachtragen) |
| 3.4 | Open-Food-Facts-Proxy mit Cache (Barcode + Namenssuche) | fertig |
| 3.5 | Barcode-Scan im Browser | fertig (ZXing, manuelle Eingabe als Alternative; auf dem iPhone noch real zu testen) |
| 3.6 | Produkt anlegen (Stepper-Liste) | fertig |
| 3.7 | Essen-Tab: Bibliothek mit Suche, Kategorie-Pills, Typ-Filter | fertig (Gerichte-Segment mit Phase 4) |

## Phase 4 – Meal Prep

| ID | Item | Status |
|---|---|---|
| 4.1 | Meal-Prep-Editor (Zutaten, Live-Summe, Portionen) | fertig |
| 4.2 | Gerichte mit Portionszähler, Eintragen, Archiv, „Nochmal kochen“ | fertig |

## Phase 5 – Vorschläge

| ID | Item | Status |
|---|---|---|
| 5.1 | Fachlogik Shake-Regeln + Essens-Vorschläge (+ Tests) | fertig (Regel-Reihenfolge D-121 bestätigt) |
| 5.2 | Zauberstab-Sheet | fertig |

## Phase 6 – Verlauf

| ID | Item | Status |
|---|---|---|
| 6.1 | Fachlogik Bewertung (±5 %) und Bilanzen (+ Tests) | fertig |
| 6.2 | Woche: Bilanzkarte, Tabelle mit Σ-Spalte | fertig |
| 6.3 | Monat: Kalender | fertig |
| 6.4 | Jahr: Monatsbalken | fertig |

## Phase 7 – Feinschliff

Reihenfolge (Nutzer, 2026-10-17): 7.1 und 7.3 vor Phase 6. Geändert (Nutzer, 2026-10-19): alle restlichen Punkte außer „Später / vielleicht“ **vor** den ersten Deploy-Check ziehen, Reihenfolge 7.4, 7.2, 7.5, 7.6 (umgesetzt: 7.6 vor dem Abschluss von 7.5); danach Deploy-Vorbereitung und erster Deploy-Check.

| ID | Item | Status |
|---|---|---|
| 7.1 | Menü und alle Einstellungen (inkl. Konto löschen mit Passwort, D-082; Tagesarten & Sollwerte mit Modal „Richtwerte ermitteln“, Screens 19/20, D-108) | fertig |
| 7.2 | Theme-Schalter System/Hell/Dunkel (flackerfrei) | fertig |
| 7.3 | PWA: Manifest, Icons, Service Worker (nur App-Shell) | fertig |
| 7.4 | Animationen (Sheets, Balken), `prefers-reduced-motion` | fertig (Bestand: Sheets, Crossfade, Balken, Login; ergänzt: kein weiches Scrollen bei Reduced Motion) |
| 7.5 | ~~Barrierefreiheit-Check~~ (gestrichen, D-149), abschließendes Security Audit | geplant |
| 7.6 | Admin-Doku (Betrieb, Deployment, User-CLI) und Nutzer-Doku (inkl. PWA-Installation und Gesundheits-Hinweis aus dem Richtwerte-Modal) | fertig (`docs/BETRIEB.md`, `docs/ANLEITUNG.md`) |

## Später / vielleicht

| ID | Item | Status |
|---|---|---|
| L.1 | KI-Empfehlungen in Textform (z. B. Gemini) | geplant |
| L.2 | Passkey / 2FA | geplant |
| L.3 | Schlafenszeit in Vorschlägen | geplant |
| L.4 | Offline-Modus | geplant |

## Verworfen

Foto der Nährwerttabelle · Foto mehrerer Packungen · Export · Mahlzeiten-Slots · gespeicherte Kombis · separate Trainingsarten · Bottom-Navigation · Ampel-Bewertung (siehe `DECISIONS.md`)
