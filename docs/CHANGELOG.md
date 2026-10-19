# Changelog

## 2026-10-19 – Fix: Sheets auf iOS
- Sheets wurden auf dem iPhone nur teilweise gezeichnet (Seite schien durch, Scrim fehlte); Ursache `will-change: transform`, entfernt.

## 2026-10-19 – Gerätetest: Fixes
- Fix: Online-Treffer (z. B. „Banane“) ließen sich nicht eintragen („Der Barcode ist ungültig“), wenn Open Food Facts einen Code mit falscher Prüfziffer lieferte; sie werden jetzt ohne Barcode gespeichert.
- Sheets öffnen ruhiger: Uhrzeit-Rad springt sofort auf die Uhrzeit statt sichtbar zu drehen, Such-Sheets haben von Anfang an volle Höhe.
- Schließen-Animation der Sheets wieder entfernt.

## 2026-10-19 – Erster Deploy-Check (Teil 1)
- Fund: auf Plesk fehlten alle Sicherheits-Header, weil nginx statische Dateien selbst auslieferte („Intelligente Bearbeitung statischer Dateien“); nach Abschalten alle Header-Prüfungen ok.
- `check-headers.sh` bricht bei Verbindungsfehlern nicht mehr ab und weist auf eine mögliche Sperre durch Fail2Ban (Jail `plesk-apache`) hin. Header-Check auf dem Server danach komplett ok.

## 2026-10-19 – 8.1 Deploy-Vorbereitung
- `scripts/build-release.sh`: baut ein hochladefertiges Paket (`httpdocs/`, `primed-app/`, `migrations/`) mit Selbstprüfung und Prüfsummen; `DEPLOYMENT.md` beschreibt Upload und Ablauf damit.

## 2026-10-19 – Sheets: Schließen-Animation
- Bottom-Sheets fahren beim Schließen nach unten aus (220 ms), der Hintergrund blendet aus; bei „Bewegung reduzieren“ schließen sie sofort.
- Profil: Username und Schloss in einer Zeile mit dem Label, Hinweis darunter in voller Breite.

## 2026-10-19 – Username fest
- Der Username lässt sich nach dem Anlegen nicht mehr ändern; das Profil zeigt ihn mit Schloss-Symbol statt eines Eingabefelds. `PATCH /v1/profile` nimmt nur noch den Display-Namen an.

## 2026-10-19 – 7.5 Abschließendes Security Audit
- Barrierefreiheit-Check gestrichen (Nutzer).
- API: Datenbankfehler im Log nur noch als SQLSTATE; Login-Ereignisse mit kurzem IP-HMAC; Open-Food-Facts-Cache räumt sich selbst auf (> 30 Tage); Suchbegriffe mit ungültigem UTF-8 → 422.
- `.htaccess`: Sicherheits-Header fail closed (ohne `<IfModule>`), `/api/` leitet HTTP selbst auf HTTPS um.
- `check-headers.sh`: prüft auch Header auf Assets und die HTTPS-Weiterleitung der API.
- `DEPLOYMENT.md`: Abschnitt „Erster Deploy-Check“ (echte Client-IP, nginx-Direktauslieferung aus, Smoke-Test auf Geräten, Trusted Types).

## 2026-10-19 – 7.6 Doku
- Neu: `docs/BETRIEB.md` (Admin: User-CLI, Migrationen, Backups, Logs, Schlüsselwechsel, Störungen) und `docs/ANLEITUNG.md` (Nutzer: Login, App-Installation iPhone/Android, Bedienung, Einstellungen, Gesundheits-Hinweis, Daten).
- `DEPLOYMENT.md` und `README.md` verlinken beide.

## 2026-10-19 – 7.2 Theme flackerfrei
- Hell/Dunkel aus dem Menü gilt jetzt ab dem ersten Bild, auch auf dem Login-Screen und beim Start der installierten App; Browser-/Statusleisten-Farbe passt sich an.
- Die Auswahl wird zusätzlich auf dem Gerät gemerkt (nur das Theme); nach dem Löschen des Kontos wird sie vergessen.

## 2026-10-19 – 7.4 Animationen
- Bestand geprüft: Sheets fahren von unten ein (280 ms, Scrim blendet mit), Tabs/Screens mit 150-ms-Crossfade, Balken füllen sich animiert, Login-Animation.
- `prefers-reduced-motion`: jetzt auch kein weiches Scrollen mehr (Uhrzeit-Rad springt sofort).
- Roadmap: alle restlichen Punkte (7.2, 7.4, 7.5, 7.6) vor den ersten Deploy-Check gezogen.

## 2026-10-18 – Footer auf allen Seiten
- Logo und Version jetzt auch am Ende von Essen, Verlauf, Menü und den Einstellungsseiten (nicht in Sheets).

## 2026-10-18 – Bibliothek anlegen/scannen, Fix Gericht-Editor
- Fix: Zutatenliste im Gericht-Editor war auf kleinen Bildschirmen unsichtbar; neue Zeile „+ Zutat hinzufügen“ und Hinweis bei leerer Liste.
- Essen › Bibliothek wie „Zutat suchen“: Scannen, Online-Treffer, „Produkt anlegen“ (unten fest).

## 2026-10-18 – Shake-Varianten
- Migration `011_shake_liquids`: Größen fest (400/200 ml), Flüssigkeiten Milch 1,5 % / 3,5 % / Wasser wählbar, Milch-Produkte und Mengen-Einstellungen entfallen.
- Bis zu sechs Shakes im „+“ (Groß/Klein je Flüssigkeit); der Zauberstab wählt die passende Flüssigkeit nach offenen Kalorien.
- Einstellungen: Vorschlags-Schwellen als Abschnitt in „Shakes“ (eigener Menüpunkt entfällt); Flüssigkeiten als Pills mit Häkchen.
- Proteinpulver-Auswahl: direkt scannen oder neues Produkt anlegen; es landet in der Bibliothek und wird gewählt.
- Bottom-Sheets: nur der Inhalt scrollt; Titel, Suchzeile und Aktions-Buttons bleiben stehen (Hinzufügen, Zutat suchen, Proteinpulver). Behebt den versetzten, durchscheinenden Footer.

## 2026-10-18 – Shakes optional, Einstellungs-Reihenfolge
- Migration `010_shakes_enabled`; Schalter „Shakes verwenden“ mit Erklärung in Einstellungen › Shakes.
- Shakes aus: keine Shakes im „+“, keine Shake-Regeln; der Zauberstab schlägt nach dem Training proteinreiches Essen vor.
- Einstellungen neu sortiert: Tagesarten → Wochenvorlage → Checkpoints → Bewertung → Vorschläge → Shakes.

## 2026-10-18 – Phase 6 Verlauf
- `GET /v1/history`: Soll und Summen je Tag (Kontostart bis heute, max. 366 Tage).
- Fachlogik: Tagesstatus (im Rahmen/unter/über, „/“, „läuft“), Bilanzen mit Einordnung, ISO-Wochen, Monatsgruppen (getestet).
- Verlauf-Tab: Woche (Bilanzkarte, Tabelle mit Σ-Spalte), Monat (Kalender mit Status, Training, heute), Jahr (Monatsbalken, Monatsliste).

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
