# Roadmap

Status: `geplant` · `in Arbeit` · `fertig` · `verworfen` · `blockiert`
Nach jedem Item: Tests, Security Audit (`agent-skills:security-and-hardening`), Doku-Update.

## Phase 0 – Setup

| ID | Item | Status |
|---|---|---|
| 0.1 | Offene Punkte aus `BRIEFING.md` klären | fertig |
| 0.2 | Frontend-Gerüst (Vite, React, TS strict, ESLint, Prettier, Vitest) | fertig |
| 0.3 | API-Gerüst (Composer, PSR-12, Front-Controller, Router, PHPUnit) | fertig (Tests unter PHP 8.3 + MariaDB 10.11 grün; Prüfung von `.htaccess` über Apache folgt mit DDEV) |
| 0.4 | Design-Tokens, selbst gehostete Schriften, Basis-Komponenten | fertig |

## Phase 1 – Fundament & Sicherheit

| ID | Item | Status |
|---|---|---|
| 1.1 | Migrationen: Users, Sessions, Login-Versuche, Settings | fertig |
| 1.2 | Login, Logout, Überall abmelden, Passwort ändern, Rate-Limit | fertig (API + CLI; Oberfläche in 1.4/7.1) |
| 1.3 | Security-Header, CSP, HSTS, CSRF, `.htaccess`, Fehlerbehandlung ohne Datenlecks | fertig (statisch getestet; Live-Prüfung per `scripts/check-headers.sh` in DDEV bzw. 1.5) |
| 1.4 | Loading-Screen, Login-Screen | geplant |
| 1.5 | Erstes Test-Deployment auf Plesk nach `DEPLOYMENT.md` | geplant |

## Phase 2 – Kern: Heute

| ID | Item | Status |
|---|---|---|
| 2.1 | Tagesarten (anlegen/ändern/löschen), Protein-Standard, Wochenvorlage, Tage mit Tagesgrenze 02:00 (mit Seed aus `DEFAULTS.md`) | geplant |
| 2.2 | Fachlogik: Sollwerte, Fett-Richtwert, Checkpoints, Offen-Werte (+ Tests) | geplant |
| 2.3 | Heute-Screen: Tabs, Begrüßung, Tagesart-Chip, Balken mit Marker, Pop-up | geplant |
| 2.4 | Tagesart-Picker (Tagesart, Uhrzeit-Rad, Dauer) | geplant |
| 2.5 | Einträge: anlegen, bearbeiten, löschen, Schnappschuss, nachtragen | geplant |

## Phase 3 – Hinzufügen & Bibliothek

| ID | Item | Status |
|---|---|---|
| 3.1 | Bibliothek mit Startprodukten und Richtwerten | geplant |
| 3.2 | Schnell-Eintrag-Sheet (Suche, Vorrat, Shakes, Häufig um diese Zeit) | geplant |
| 3.3 | Mengen-Sheet (Stepper, Schnellwahl, Uhrzeit, „Danach offen“) | geplant |
| 3.4 | Open-Food-Facts-Proxy mit Cache (Barcode + Namenssuche) | geplant |
| 3.5 | Barcode-Scan im Browser | geplant |
| 3.6 | Produkt anlegen (Stepper-Liste) | geplant |
| 3.7 | Essen-Tab: Bibliothek mit Suche, Kategorie-Pills, Typ-Filter | geplant |

## Phase 4 – Meal Prep

| ID | Item | Status |
|---|---|---|
| 4.1 | Meal-Prep-Editor (Zutaten, Live-Summe, Portionen) | geplant |
| 4.2 | Vorrat mit Portionszähler, Eintragen aus Vorrat, Archiv | geplant |

## Phase 5 – Vorschläge

| ID | Item | Status |
|---|---|---|
| 5.1 | Fachlogik Shake-Regeln + Essens-Vorschläge (+ Tests) | geplant |
| 5.2 | Zauberstab-Sheet | geplant |

## Phase 6 – Verlauf

| ID | Item | Status |
|---|---|---|
| 6.1 | Fachlogik Bewertung (±5 %) und Bilanzen (+ Tests) | geplant |
| 6.2 | Woche: Bilanzkarte, Tabelle mit Σ-Spalte | geplant |
| 6.3 | Monat: Kalender | geplant |
| 6.4 | Jahr: Monatsbalken | geplant |

## Phase 7 – Feinschliff

| ID | Item | Status |
|---|---|---|
| 7.1 | Menü und alle Einstellungen (inkl. Konto löschen mit Passwort, D-082) | geplant |
| 7.2 | Theme-Schalter System/Hell/Dunkel | geplant |
| 7.3 | PWA: Manifest, Icons, Service Worker (nur App-Shell) | geplant |
| 7.4 | Animationen (Sheets, Balken), `prefers-reduced-motion` | geplant |
| 7.5 | Barrierefreiheit-Check, abschließendes Security Audit | geplant |
| 7.6 | Admin-Doku (Betrieb, Deployment, User-CLI) und Nutzer-Doku (inkl. PWA-Installation) | geplant |

## Später / vielleicht

| ID | Item | Status |
|---|---|---|
| L.1 | KI-Empfehlungen in Textform (z. B. Gemini) | geplant |
| L.2 | Passkey / 2FA | geplant |
| L.3 | Schlafenszeit in Vorschlägen | geplant |
| L.4 | Offline-Modus | geplant |

## Verworfen

Foto der Nährwerttabelle · Foto mehrerer Packungen · Export · Mahlzeiten-Slots · gespeicherte Kombis · separate Trainingsarten · Bottom-Navigation · Ampel-Bewertung (siehe `DECISIONS.md`)
