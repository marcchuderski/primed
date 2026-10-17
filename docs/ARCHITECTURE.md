# Architektur

Stand: 16.10.2026 · Entwurf vor Implementierung. Wird von Claude Code laufend aktualisiert.

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
| Styling | CSS-Variablen aus `design/tokens.css`; Umschaltung über `data-theme` |
| Schriften | Bricolage Grotesque, Inter, **selbst gehostet** (kein Google-CDN, Datenschutz + strenge CSP) |
| Barcode | JS-Bibliothek (z. B. ZXing), Kamera nur über HTTPS |
| API | PHP (Version laut Plesk, ≥ 8.2 angestrebt), Composer, PSR-12, `strict_types` |
| Datenbank | MySQL oder MariaDB, `utf8mb4`, InnoDB |
| Tests | Vitest (Frontend, v. a. `domain/`), PHPUnit (API) |
| Deployment | lokal bauen, per SFTP hochladen (siehe `DEPLOYMENT.md`) |

## Repository-Struktur

```
/
├── CLAUDE.md, README.md, START_PROMPT.md
├── docs/                 Briefing, Architektur, Entscheidungen, Roadmap, Security, Deployment
├── design/               Design-Richtlinien, Tokens, Kitchen Sink, Screens, Brand-Assets
├── frontend/
│   ├── public/           Icons, Manifest, Schriften
│   └── src/
│       ├── domain/       reine Fachlogik + Tests (Sollwerte, Checkpoints, Shake-Regeln, Bewertung, Bilanzen)
│       ├── api/          typisierter API-Client
│       ├── features/     heute, hinzufuegen, essen, verlauf, menue, auth
│       ├── components/   UI-Bausteine (Balken, Sheet, Stepper, Scroll-Rad, Segment …)
│       └── styles/       tokens.css (aus design/), Basis-Styles
└── api/
    ├── public/index.php  Front-Controller (wird nach httpdocs/api/ deployt)
    ├── src/              Controller, Services, Repositories, Middleware
    ├── migrations/       001_init.sql, 002_…sql (nummeriert, nur vorwärts)
    ├── seeds/            Startdaten aus docs/DEFAULTS.md
    ├── tests/
    └── .env.example
```

## Server-Layout (Plesk)

```
/var/www/vhosts/<domain>/
├── httpdocs/                 öffentlich
│   ├── index.html, assets/   Frontend-Build
│   ├── api/index.php         lädt nur ../../primed-app/bootstrap.php
│   └── .htaccess             HTTPS, Security-Header, SPA-Fallback, /api-Routing
└── primed-app/               NICHT öffentlich
    ├── src/, vendor/, bootstrap.php
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

Alle schreibenden Endpunkte: Session-Cookie + CSRF-Token, serverseitige Validierung, Zugriff nur auf eigene Daten (`user_id`).

## Datenmodell (Entwurf)

| Tabelle | Wichtige Felder |
|---|---|
| `users` | id, username (unique), display_name, password_hash, password_changed_at |
| `sessions` | id, user_id, token_hash (unique), created_at, last_seen_at, expires_at, revoked_at |
| `login_attempts` | id, username, ip_hash, attempted_at, success |
| `user_settings` | user_id, theme (system/light/dark), tolerance_pct, Shake-Schwellen, Checkpoint-Vorlage |
| `day_types` | id, user_id, key, name, kcal, protein, carbs, sugar_ref, default_duration_min, sort |
| `week_template` | user_id, weekday, day_type_id, training_start, duration_min |
| `days` | id, user_id, date (unique je User), day_type_id, training_start, duration_min, Soll-Schnappschuss |
| `foods` | id, user_id, type (product/reference/ingredient), name, brand, barcode (unique je User), category, basis (per_100g/per_unit), Nährwerte, package_g, household_units, source, usage_count, last_amount, last_unit, is_quick (Shakes) |
| `off_cache` | barcode, payload, fetched_at |
| `dishes` | id, user_id, name, cooked_at, portions_total, portions_left, Summen, status (active/archived) |
| `dish_ingredients` | id, dish_id, food_id (nullable), name_snapshot, amount, unit, grams, Nährwerte |
| `entries` | id, user_id, date, time, food_id/dish_id (nullable), name_snapshot, amount, unit, Nährwert-Schnappschuss |

Einträge und Gerichtszutaten speichern **Schnappschüsse**, damit spätere Produktänderungen die Vergangenheit nicht verändern.

## Wichtige Abläufe

**Login:** Username + Passwort → Argon2id-Prüfung → zufälliger Session-Token (nur Hash in DB) → Cookie `HttpOnly; Secure; SameSite=Strict`, Laufzeit 30 Tage → CSRF-Token an den Client.

**Barcode:** Kamera liest EAN → `GET /off/barcode/{ean}` → API prüft eigene Bibliothek, dann `off_cache`, dann Open Food Facts (Timeout, User-Agent mit Kontakt) → normalisierte Werte zurück → Nutzer bestätigt → Produkt in Bibliothek.

**Eintrag:** Lebensmittel/Portion + Menge + Zeit → API berechnet Nährwerte aus Produktdaten → speichert Schnappschuss → bei Gerichten `portions_left − 1`, bei 0 Status `archived`.

## Theme

`data-theme` auf `<html>`: nicht gesetzt = System, sonst `light`/`dark` aus `user_settings.theme`. Tokens in `design/tokens.css`.
