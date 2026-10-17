# Changelog

## 2026-10-17 – 7.3 PWA
- Web-App-Manifest, App-Icons (aus `design/brand`), Theme-Farbe für Hell/Dunkel, Favicon.
- Service Worker nur für die App-Shell: offline erscheint „Keine Verbindung“ statt einer Browser-Fehlerseite; API-Daten werden nie gecacht.
- Header-Check um PWA-Dateien erweitert.

## 2026-10-17 – 7.1 Menü und Einstellungen
- Menü (Screen 16): Profilkarte, Darstellung System/Hell/Dunkel, Einstellungsliste mit Zusammenfassungen, Abmelden, „Überall abmelden“.
- Seiten: Profil (Name, Username, Passwort ändern, Konto löschen), Tagesarten & Sollwerte (Screen 19, Protein-Standard, Tagesart anlegen/bearbeiten/löschen, Ruhetag fest), Modal „Richtwerte ermitteln“ (Screen 20), Wochenvorlage, Shakes, Checkpoints, Vorschläge, Bewertung.
- Vorschläge nutzen die Schwellen aus den Einstellungen; die Begrüßung („Alles im Rahmen“, „Kalorien sind durch“) nutzt die Toleranz aus „Bewertung“.

## 2026-10-17 – 7.1 Einstellungen (API)
- Migration `009_settings` (Toleranz, Vorschlags-Schwellen).
- `PATCH /v1/settings` für Checkpoint, frühestes Training, Toleranz, Schwellen und Shakes (Teil-Updates, Allowlist).
- `PATCH /v1/profile` (Display-Name, Username) und `POST /v1/account/delete` (Passwort, Rate-Limit, löscht alle Daten).
- Fix: Löschen eines Users scheiterte an der Wochenvorlage (FK RESTRICT) – betraf auch das User-CLI.
- „vergangene Gerichte“ statt „aufgegessene Gerichte“.

## 2026-10-17 – Phase 5 Vorschläge
- Zauberstab aktiv: regelbasierte Vorschläge (Shake-Regeln, Pre-Workout, KH-Snack-Fenster, Essen nach Protein) mit Begründung, Effekt und „Eintragen“.
- Nur realistische Vorschläge: bereits gegessene Lebensmittel in ihrer Menge, Gerichte; nie Proteinpulver/Milch einzeln.

## 2026-10-17 – Phase 4 Gerichte
- Migration `008_dishes`; API für Gerichte (Zutaten-Schnappschüsse, Portionen in ½-Schritten, abgeleiteter Zähler, Archiv, Rest entsorgen, „Nochmal kochen“) und Portionen-Einträge.
- Essen-Tab „Gerichte“ (statt „Vorrat“) mit Karten, Editor, Archiv; „+“-Sheet mit Gerichten und „Gericht zubereiten“ · „Produkt anlegen“.
- Shake „Groß 1,5 %“ benannt.

## 2026-10-17 – 3.7 Essen-Tab
- Bibliothek mit Suche, Kategorie-Pills, Typ-Filter, Bearbeiten und Löschen; Lizenzhinweise.

## 2026-10-17 – 3.2/3.3/3.5/3.6 Hinzufügen
- „+“ aktiv: Schnell-Eintrag mit Shakes und „Häufig um diese Zeit“, Suche über Bibliothek, Open Food Facts und BLS-Richtwerte (mit Quellenangaben).
- Mengen-Sheet im Hinzufügen-Modus mit Nachtragen (Tagesauswahl).
- Barcode-Scanner (ZXing, lazy geladen) mit manueller Eingabe; „Neues Produkt“ (Stepper-Liste, Basis 100 g/100 ml/Stück).

## 2026-10-17 – 3.1/3.4 Bibliothek & Open Food Facts (API)
- Migrationen `005_off_cache`, `006_basics_category`.
- Bibliotheks-API (Suche, häufig um diese Zeit ±1,5 h, anlegen/ändern/löschen, Barcode-Lookup).
- Seed: 14 BLS-Richtwerte (CC BY 4.0), ESN Designer Whey, Milch – für alle User; idempotent.
- OFF-Proxy mit Cache, Rate-Limit, SSRF-Schutz; Suche über search.openfoodfacts.org.

## 2026-10-17 – Picker, fester Ruhetag, Richtwerte-Konzept
- Migration `004_rest_day`: Ruhetag fest im System (D-106); Trainingsdauer 30 min.
- Tagesart-Picker: eingeklappte Liste mit „Auswahl ändern“, Dauer-Pills 2×2 (D-107).
- Konzept KI-Fragebogen „Richtwerte ermitteln“ (Screens 19/20, `docs/RICHTWERTE-PROMPT.md`, D-108) in BRIEFING, DESIGN, Roadmap 7.1/7.6.
- Doku: DEFAULTS (Wochenvorlage nur für Betreiber), ARCHITECTURE (`user_settings` bereinigt).

## 2026-10-17 – 2.5 Einträge
- Migration `003_foods_entries`; Startbibliothek (Milch für alle, Startprodukte für den Betreiber).
- API für Einträge mit serverseitigem Nährwert-Schnappschuss und Einheiten-Umrechnung (geteilte Testfälle Frontend/API).
- Heute: Einträge-Liste, Bearbeiten im Mengen-Sheet (Einheiten-Umschalter, Stepper, Schnellwahl, Uhrzeit-Rad, „Danach offen“), Löschen per Wischen/Sheet mit Bestätigungsdialog.

## 2026-10-17 – 2.4 Tagesart-Picker
- Bottom-Sheet-Komponente und Scroll-Rad (15-Minuten-Raster); Tagesart-Picker mit Tagesart-Liste, Trainingszeit (ab 09:00) und Dauer 60/90/120; Änderung gilt nur für diesen Tag.

## 2026-10-17 – 2.3 Heute-Screen
- Tabs Heute · Essen · Verlauf mit Menü; Heute mit situativer Begrüßung, Datum, Tagesart-Chip, Makro-Balken (Marker, Überschreitung, Fett-/Zucker-Richtwert) und Checkpoint-Pop-up.
- Menü-Platzhalter mit Abmelden / Überall abmelden.

## 2026-10-17 – 2.2 Fachlogik
- `frontend/src/domain/`: Fett-Richtwert, Offen-Werte, Checkpoints, kcal-Bewertung, Formatierung, logische Tageszeit, situative Begrüßung – mit 48 neuen Unit-Tests.

## 2026-10-17 – Konzept: situative Begrüßung
- BRIEFING §4a, DESIGN (Heute), Roadmap 2.3 um die regelbasierte Begrüßung ergänzt (D-101).

## 2026-10-17 – 2.1 Tagesarten, Wochenvorlage, Tage
- Migration `002_days`: Einstellungen (Protein-Standard, Checkpoint-Vorlage, Tagesgrenze), `day_types`, `week_template`, `days`.
- API: Einstellungen, Tagesarten (CRUD), Wochenvorlage, Tage (heute/Datum, manuell setzen); feste Vergangenheit (D-098); Tagesgrenze 02:00.
- Startdaten für neue User; CLI `--owner-defaults`, `bin/user-seed.php`.

## 2026-10-17 – Claim im Login
- „Primed for performance.“ unter dem Logo auf dem Login-Screen (D-097).

## 2026-10-17 – Login statt Loading-Screen
- Loading-Screen entfernt; Logo-Animation auf dem Login-Screen, Felder blenden danach ein; eingeloggte User ohne Wartezeit (D-096).

## 2026-10-17 – Logo-Lockup
- Neues `LogoLockup` (Zeichen als „p“ + „rimed“, Screen 18) in Loading, Login und Footer; `Wordmark` entfernt.

## 2026-10-17 – 1.4 Loading & Login
- API-Client mit CSRF-Header und typisierten Fehlern; Auth-Provider (Session wiederherstellen, Login, Logout, Überall abmelden).
- Loading-Screen (Ring-Animation ~1,4 s), Login-Screen nach Mockup (ohne „Passwort vergessen“), Fehler-/Retry-Screen, Platzhalter-Startseite mit Abmelden + „Überall abmelden“.
- Fix: `api/.htaccess` sperrte alle API-Pfade; `check-headers.sh` live in DDEV grün.
- Roadmap 1.5 verworfen (lokal testen).

## 2026-10-17 – 1.3 Härtung
- `frontend/public/.htaccess`: HTTPS-Weiterleitung, Dotfile-Sperre, SPA-Fallback, CSP, HSTS, Permissions-Policy, COOP/CORP, Caching.
- Build ohne Inline-Assets; Regressionstest für Header; Live-Prüfskript `scripts/check-headers.sh`.

## 2026-10-17 – 1.2 Login & Sessions
- Auth-API: Login, me, Logout, Überall abmelden, Passwort ändern; Rate-Limit nach D-061; gleitende Session 30/90 Tage; `__Host-`-Cookie; zustandslose CSRF-Tokens; Origin-/Content-Type-Prüfung.
- Passwort-Regeln mit Liste häufiger Passwörter; Argon2id mit Rehash.
- Admin-CLI `bin/user-create.php`, `bin/user-password.php`.
- `.env`: `APP_KEY` statt `IP_HASH_KEY`, neu `ALLOWED_ORIGINS`.

## 2026-10-17 – 1.1 Migrationen
- Migration `001_init`: users, sessions, login_attempts, user_settings, schema_migrations.
- Migrator + `bin/migrate.php`; Integrationstests gegen MariaDB 10.11 (Constraints, Kaskaden-Löschung, Idempotenz).
- DEPLOYMENT: zwei DB-User (Least Privilege), Migrationen per phpMyAdmin.

## 2026-10-17 – 0.4 Tokens, Schriften, Basis-Komponenten
- Tokens aus `design/tokens.css` direkt eingebunden, um `--input-border` und `--ring-track` ergänzt.
- Bricolage Grotesque und Inter selbst gehostet.
- Basis-Styles (Fokus sichtbar, `prefers-reduced-motion`), Komponenten Button, TextField, LogoMark (mit Lade-Animation ~1,4 s), Wordmark, Footer mit Version.

## 2026-10-17 – 0.3 API-Gerüst
- `api/` mit Composer (PHP 8.3 gepinnt), Front-Controller, `.htaccess`, Bootstrap, Router, Request/Response, `.env`-Parser, Logger, PDO-Factory, `GET /api/v1/health`.
- PHPUnit (Unit + Integration), PHPStan max, PHPCS PSR-12.
- DDEV-Konfiguration mit Test-Datenbank.

## 2026-10-17 – Design: Einheiten und Haushaltsmaße
- Screens 06 (Menge) und 07 (Produkt anlegen) ersetzt, 17 (Meal-Prep-Zutat) und 18 (PWA-Installation) neu; Screen-Index ergänzt.
- Haushaltsmaße global fest (1 EL = 15 g/ml, 1 TL = 5 g/ml), Einheiten-Umschalter bei der Mengeneingabe (D-073); BRIEFING, DEFAULTS, ARCHITECTURE, DESIGN angepasst.

## 2026-10-17 – 0.2 Frontend-Gerüst
- `frontend/` mit Vite, React, TypeScript (strict), ESLint, Prettier, Vitest, Testing Library angelegt; Node 22 über `.nvmrc`.
- Erste Fachfunktion `roundUpToQuarterHour` (D-047) mit Tests.
- Dev-Proxy `/api` → DDEV.

## 2026-10-17 – 0.1 Offene Punkte geklärt
- Alle offenen Punkte aus dem Briefing mit dem Nutzer geklärt und in BRIEFING, DEFAULTS, ARCHITECTURE, SECURITY, DEPLOYMENT eingearbeitet.
- Entscheidungen D-040 bis D-071 dokumentiert.
- `.env.example` um Session-, HMAC- und OFF-Einträge ergänzt.
- Roadmap: 0.1 fertig, neues Item 7.6 (Admin- und Nutzer-Doku).
- README: Verweis auf fehlende `START_PROMPT.md` entfernt.

## 2026-10-16 – Konzept & Start-Repo
- Konzept, Design (Light/Dark), Architektur und Arbeitsregeln festgelegt.
- Dokumentation angelegt: Briefing, Defaults, Architektur, Entscheidungen, Roadmap, Security, Deployment.
- Design-Ordner mit Richtlinien, Tokens, Kitchen Sink, 16 Screens (Light + Dark) und App-Icons.
