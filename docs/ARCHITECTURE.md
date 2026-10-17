# Architektur

Stand: 17.10.2026 · Entwurf vor Implementierung. Wird von Claude Code laufend aktualisiert.

## Überblick

```
 Browser / Handy (PWA)                       Plesk-Webspace (Deutschland, HTTPS)
┌──────────────────────────┐   HTTPS    ┌───────────────────────────────────────────┐
│ React + TypeScript (Vite)│ ─────────► │ httpdocs/            statisch: Frontend    │
│  · UI (design/tokens.css)│  /api/v1   │ httpdocs/api/index.php  Front-Controller   │
│  · domain/ (Fachlogik)   │ ◄───────── │            │                                │
│  · Barcode-Scan (Kamera) │   JSON     │            ▼                                │
└──────────────────────────┘            │ primed-app/  (außerhalb Webroot)           │
                                        │  · src/ (PHP)  · vendor/  · .env           │
                                        │            │            │                   │
                                        │            ▼            ▼                   │
                                        │      MySQL/MariaDB   Open Food Facts (HTTPS)│
                                        └───────────────────────────────────────────┘
```

- Frontend und API laufen auf **derselben Domain**, daher kein CORS.
- Nur die API spricht mit der Datenbank und mit Open Food Facts.
- Zugangsdaten nur in `.env` **außerhalb** des Webroots.

## Technik

| Bereich | Wahl |
|---|---|
| Frontend | Vite, React, TypeScript (strict), PWA (Manifest + Service Worker nur für App-Shell, kein Offline-Datenbetrieb) |
| Icons | lucide-react |
| Styling | CSS-Module + CSS-Variablen aus `design/tokens.css` (direkt importiert, keine Kopie); Umschaltung über `data-theme` |
| Schriften | Bricolage Grotesque (opsz+wght), Inter (wght) als Variable Fonts, **selbst gehostet** via `@fontsource-variable` (nur Latin + Latin Ext), kein Google-CDN |
| Barcode | ZXing (iOS/WebKit hat keine BarcodeDetector-API), Kamera nur über HTTPS |
| API | PHP 8.3 (Server 8.3.8), Composer (nur lokal, `vendor/` wird hochgeladen), PSR-12, `strict_types` |
| Datenbank | MariaDB 10.11, `utf8mb4`, InnoDB |
| Lokale Entwicklung | DDEV (PHP 8.3, MariaDB 10.11, Apache), Node 22 via nvm (`.nvmrc`) |
| Tests | Vitest (Frontend, v. a. `domain/`), PHPUnit (API) |
| Deployment | lokal bauen, per SFTP hochladen (siehe `DEPLOYMENT.md`) |

## Repository-Struktur

```
/
├── CLAUDE.md, README.md
├── docs/                 Briefing, Architektur, Entscheidungen, Roadmap, Security, Deployment
├── design/               Design-Richtlinien, Tokens, Kitchen Sink, Screens, Brand-Assets
├── frontend/
│   ├── public/           Icons, Manifest, Schriften
│   └── src/
│       ├── domain/       reine Fachlogik + Tests (Sollwerte, Checkpoints, Shake-Regeln, Bewertung, Bilanzen)
│       ├── api/          typisierter API-Client
│       ├── features/     heute, hinzufuegen, essen, verlauf, menue, auth
│       ├── components/   UI-Bausteine als React + CSS-Module (Button, TextField, Logo, Footer; später Balken, Sheet, Stepper …)
│       └── styles/       index.css (importiert design/tokens.css direkt), fonts.css, base.css
├── .ddev/                DDEV (PHP 8.3, MariaDB 10.11, Apache; /api → api/public, Docroot frontend/dist)
└── api/
    ├── public/           index.php + .htaccess (werden nach httpdocs/api/ deployt)
    ├── bootstrap.php     außerhalb des Webroots, neben .env
    ├── src/              Http (Router, Request, Response), Config, Log, Database, Controller
    ├── var/log/          Logdateien (außerhalb des Webroots)
    ├── migrations/       001_init.sql, 002_…sql (nummeriert, nur vorwärts)
    ├── seeds/            Startdaten aus docs/DEFAULTS.md
    ├── tests/
    └── .env.example
```

## Server-Layout (Plesk)

```
/var/www/vhosts/<webspace>/   (Domain: primed.dev-pfeffermond.de)
├── httpdocs/                 öffentlich
│   ├── index.html, assets/   Frontend-Build
│   ├── api/index.php         lädt nur ../../primed-app/bootstrap.php
│   └── .htaccess             HTTPS, Security-Header, SPA-Fallback, /api-Routing
└── primed-app/               NICHT öffentlich
    ├── src/, vendor/, bootstrap.php
    ├── var/log/              Logs (schreibbar für PHP)
    └── .env
```

## Fachlogik im Frontend

Berechnungen laufen als reine Funktionen in `frontend/src/domain/` und sind vollständig unit-getestet:
Sollwerte je Tagesart, Fett-Richtwert, Checkpoints, Offen-Werte, Shake- und Essens-Vorschläge, Bewertung (±5 %), Wochen-/Monats-/Jahresbilanzen.
Die API speichert, validiert und liefert Daten; sie berechnet Nährwert-Schnappschüsse beim Speichern eines Eintrags serverseitig, damit gespeicherte Werte konsistent sind.

## API (Entwurf, `/api/v1`, JSON)

| Bereich | Endpunkte |
|---|---|
| Auth | `POST /auth/login` · `POST /auth/logout` · `POST /auth/logout-all` · `GET /auth/me` · `POST /auth/password` |
| Einstellungen | `GET/PUT /settings` · `GET/PUT /day-types` · `GET/PUT /week-template` |
| Tage | `GET /days/{date}` (Tagesart, Training, Sollwerte, Einträge) · `PUT /days/{date}` (Tagesart/Training) |
| Einträge | `POST /entries` · `PATCH /entries/{id}` · `DELETE /entries/{id}` |
| Bibliothek | `GET /foods?q=&category=&type=` · `GET /foods/frequent?time=` · `POST /foods` · `PATCH /foods/{id}` |
| Open Food Facts | `GET /off/barcode/{ean}` · `GET /off/search?q=` (Proxy mit Cache) |
| Meal Prep | `GET /dishes?status=active|archived` · `POST /dishes` · `PATCH /dishes/{id}` |
| Verlauf | `GET /history/week?start=` · `GET /history/month?month=` · `GET /history/year?year=` |

Migrationen: `api/migrations/NNN_name.sql`, nur vorwärts; lokal `php bin/migrate.php [--test]`, Produktion per phpMyAdmin (siehe DEPLOYMENT). Implementiert ab 1.1: `001_init` (users, sessions, login_attempts, user_settings, schema_migrations). Alle Zeitstempel UTC.

Implementiert: `GET /v1/health` → `{"status":"ok"}`.

Fehlerformat: `{"error":{"code":"…","message":"…"}}` mit deutscher, nutzbarer Meldung; interne Details nur im Log. Body max. 64 KB, JSON-Tiefe max. 32, Pfad-Parameter nur `[A-Za-z0-9_-]{1,64}`.

Alle schreibenden Endpunkte: Session-Cookie + CSRF-Token, serverseitige Validierung, Zugriff nur auf eigene Daten (`user_id`).

## Datenmodell (Entwurf)

| Tabelle | Wichtige Felder |
|---|---|
| `users` | id, username (unique, klein, `[a-z0-9._-]{3,32}`), display_name, password_hash (Argon2id), password_changed_at, created_at |
| `schema_migrations` | version, applied_at (jede Migration trägt sich selbst ein) |
| `sessions` | id, user_id (FK, CASCADE), token_hash (BINARY(32), SHA-256, unique), created_at, last_seen_at, expires_at (gleitend 30 Tage), absolute_expires_at (90 Tage), revoked_at |
| `login_attempts` | id, username, ip_hash (HMAC), attempted_at, success · Löschung nach 30 Tagen |
| `user_settings` | user_id (FK, CASCADE), theme (system/light/dark), updated_at · weitere Felder per späterer Migration: tolerance_pct, protein_default, protein_powder_food_id, Shake-Schwellen, Checkpoint-Vorlage (inkl. frühester Checkpoint/Trainingsbeginn), day_boundary (02:00) |
| `day_types` | id, user_id, name, kcal, protein (nullable = Protein-Standard), carbs, sugar_ref, is_training, sort, deleted_at |
| `week_template` | user_id, weekday, day_type_id, training_start, duration_min |
| `days` | id, user_id, date (logischer Tag, unique je User), day_type_id, day_type_name_snapshot, training_start, duration_min, Soll-Schnappschuss |
| `foods` | id, user_id, type (product/reference/ingredient), name, brand, barcode (unique je User), category, basis (per_100g/per_100ml/per_unit), Nährwerte, package_amount (Einheit der Basis), source, usage_count, last_amount, last_unit, is_quick (Shakes) |
| `off_cache` | barcode, payload, fetched_at |
| `dishes` | id, user_id, name, cooked_at, portions_total, portions_left (DECIMAL, Schritte 0,5), Summen, status (active/archived/discarded) |
| `dish_ingredients` | id, dish_id, food_id (nullable), name_snapshot, amount + unit (wie eingegeben: g/ml/EL/TL/Packung/Stück), grams_or_ml (umgerechnet; bei Basis Stück: Stückzahl), Nährwerte |
| `entries` | id, user_id, date (logischer Tag), eaten_at (Datum + Uhrzeit, Europe/Berlin), food_id/dish_id (nullable), name_snapshot, amount + unit (wie eingegeben), grams_or_ml (umgerechnet; bei Basis Stück: Stückzahl, bei Gerichten: Portionen), Nährwert-Schnappschuss |

Der **logische Tag** endet um 02:00 (`day_boundary`); ein Eintrag um 00:30 am 21.10. gehört zum Tag 20.10. Tage werden beim ersten Zugriff aus der Wochenvorlage angelegt (mit Soll-Schnappschuss). Damit vergangene Tage fest bleiben, werden **vor jeder Änderung** an Wochenvorlage, Tagesarten oder Protein-Standard alle vergangenen Tage seit Kontoanlage ohne Datensatz mit den bisherigen Werten angelegt (wenige hundert Zeilen pro Jahr, in einer Transaktion).

Haushaltsmaße sind Konstanten (1 EL = 15 g/ml, 1 TL = 5 g/ml) in `frontend/src/domain/` und spiegelbildlich in der API (Schnappschuss-Berechnung); ein Test sichert die Gleichheit beider Seiten.

Einträge und Gerichtszutaten speichern **Schnappschüsse**, damit spätere Produktänderungen die Vergangenheit nicht verändern.

## Wichtige Abläufe

**Login:** Username + Passwort → Rate-Limit-Prüfung → Argon2id-Prüfung → zufälliger Session-Token (nur Hash in DB) → Cookie `HttpOnly; Secure; SameSite=Strict`, gleitend 30 Tage, max. 90 Tage → CSRF-Token an den Client.

**Barcode:** Kamera liest EAN → `GET /off/barcode/{ean}` → API prüft eigene Bibliothek, dann `off_cache`, dann Open Food Facts (Timeout, User-Agent mit Kontakt) → normalisierte Werte zurück → Nutzer bestätigt → Produkt in Bibliothek.

**Eintrag:** Lebensmittel/Portion + Menge + Zeit → API berechnet Nährwerte aus Produktdaten → speichert Schnappschuss → bei Gerichten `portions_left − 1`, bei 0 Status `archived`.

## Theme

`data-theme` auf `<html>`: nicht gesetzt = System, sonst `light`/`dark` aus `user_settings.theme`. Tokens in `design/tokens.css`.
