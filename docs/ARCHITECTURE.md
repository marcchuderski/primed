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
| Frontend | Vite, React, TypeScript (strict), PWA (Manifest + Service Worker nur für App-Shell, kein Offline-Datenbetrieb; `frontend/tools/sw.js` + `tools/pwa.ts`, Icons unter `/pwa/`, D-133) |
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
│       ├── api/          typisierter API-Client (client.ts: fetch, CSRF-Header, ApiError; auth.ts; days.ts mit Laufzeit-Prüfung der Antworten)
│       ├── features/     auth, shell (Tabs), today (Heute), entries (Mengen-Sheet), add (Hinzufügen, Suche, Scanner), foods (Produkt-Formular), essen (Bibliothek), menu (Menü und Einstellungsseiten, Richtwerte-Modal, `useAutoSave`, Theme), dishes, suggestions; später verlauf
│       ├── components/   UI-Bausteine als React + CSS-Module (Button, TextField, Logo, Footer, MacroBar, TopNav, Sheet, TimeWheel; später Stepper …)
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
│   └── .htaccess             aus frontend/public/: HTTPS, Security-Header, Dotfile-Sperre, SPA-Fallback, Caching
└── primed-app/               NICHT öffentlich
    ├── src/, vendor/, bootstrap.php
    ├── var/log/              Logs (schreibbar für PHP)
    └── .env
```

## Fachlogik im Frontend

Berechnungen laufen als reine Funktionen in `frontend/src/domain/` und sind vollständig unit-getestet:
Sollwerte je Tagesart, Fett-Richtwert, Checkpoints, Offen-Werte, Shake- und Essens-Vorschläge, Bewertung (±5 %), Wochen-/Monats-/Jahresbilanzen.

Umgesetzt (5.1): `suggestions.ts` (Shake-Entscheidung, Essens-Auswahl, 2–3 Vorschläge mit Zeitpunkt, Begründung, Effekt, Aktion); Kandidaten (nur bereits gegessene Lebensmittel, Gerichte) in `features/suggestions/candidates.ts`. `GET /settings` liefert dafür `shakeFoods` (Proteinpulver, Milch). Die Schwellen kommen aus `settings.thresholds` (`features/suggestions/thresholds.ts`, 7.1).

Umgesetzt (2.2): `targets.ts` (Fett-Richtwert, Summen, Offen-Werte), `checkpoint.ts` (Checkpoint, gegessen bis, Trainingsende), `rating.ts` (kcal ±5 %, Grenzen inklusive), `format.ts` (deutsche Zahlen, Restzeit in halben Stunden), `time.ts` (15-Minuten-Raster, logische Minute nach Tagesgrenze), `greeting.ts` (Begrüßung, BRIEFING §4a).
Die API speichert, validiert und liefert Daten; sie berechnet Nährwert-Schnappschüsse beim Speichern eines Eintrags serverseitig, damit gespeicherte Werte konsistent sind.

## API (Entwurf, `/api/v1`, JSON)

| Bereich | Endpunkte |
|---|---|
| Auth | `POST /auth/login` · `POST /auth/logout` · `POST /auth/logout-all` · `GET /auth/me` · `POST /auth/password` |
| Einstellungen | `GET/PUT /settings` · `GET/PUT /day-types` · `GET/PUT /week-template` |
| Tage | `GET /days/{date}` (Tagesart, Training, Sollwerte, Einträge) · `PUT /days/{date}` (Tagesart/Training) |
| Einträge | `POST /entries` · `PATCH /entries/{id}` · `DELETE /entries/{id}` |
| Bibliothek | `GET /foods?q=&category=&type=` · `GET /foods/frequent?time=` · `POST /foods` · `PATCH /foods/{id}` |
| Bibliothek (umgesetzt 3.1/3.4) | `GET /foods?q=&category=&type=&context=mealprep` · `GET /foods/frequent` · `GET /foods/{id}` · `POST /foods` · `PATCH /foods/{id}` · `DELETE /foods/{id}` (weich) · `GET /foods/barcode/{ean}` (eigene Bibliothek, sonst OFF) |
| Open Food Facts | `GET /off/search?q=` (Proxy mit Cache, max. 10 Treffer, DE) |
| Gerichte (umgesetzt 4.x) | `GET /dishes?status=active|archived` · `GET /dishes/{id}` (mit Zutaten) · `POST /dishes` `{name, portions, ingredients:[{foodId, amount, unit}], basedOnDishId?}` · `PUT /dishes/{id}` · `POST /dishes/{id}/discard` · `POST /entries/dish` `{date, timeMin, dishId, portions}` |
| Einträge (umgesetzt 2.5) | `GET /days/{date}/entries` · `POST /entries` `{date, timeMin, foodId, amount, unit}` · `POST /entries/shake` `{date, timeMin, shake: big/small_low/small_high}` · `GET /shakes` · `PATCH /entries/{id}` `{timeMin?, amount?, unit?}` · `DELETE /entries/{id}` |
| Verlauf | `GET /history/week?start=` · `GET /history/month?month=` · `GET /history/year?year=` |

Migrationen: `api/migrations/NNN_name.sql`, nur vorwärts; lokal `php bin/migrate.php [--test]`, Produktion per phpMyAdmin (siehe DEPLOYMENT). Implementiert ab 1.1: `001_init` (users, sessions, login_attempts, user_settings, schema_migrations). Alle Zeitstempel UTC.

Implementiert: `GET /v1/health` → `{"status":"ok"}`.

**Auth (1.2)**

| Endpunkt | Anfrage | Antwort |
|---|---|---|
| `POST /v1/auth/login` | `{username, password}` | 200 `{user, csrfToken}` + Session-Cookie · 401 `invalid_credentials` · 429 `too_many_attempts` (+ `Retry-After`) |
| `GET /v1/auth/me` | Cookie | 200 `{user, csrfToken}` (Cookie wird bei gleitender Verlängerung erneuert) · 401 |
| `POST /v1/auth/logout` | Cookie + `X-CSRF-Token` | 204, Cookie gelöscht |
| `POST /v1/auth/logout-all` | Cookie + `X-CSRF-Token` | 204, alle Sessions des Users widerrufen |
| `POST /v1/auth/password` | `{currentPassword, newPassword}` + CSRF | 204, andere Sessions beendet · 422 `invalid_current_password` / `weak_password` |

- Cookie `__Host-primed_session`: 32 Zufallsbytes (base64url), in der DB nur SHA-256.
- CSRF-Token = HMAC(abgeleiteter Schlüssel, Token-Hash): zustandslos, an die Session gebunden, über `/auth/me` jederzeit neu abrufbar.
- `OriginGuard` (alle schreibenden Methoden): `Origin` ∈ `APP_URL` + `ALLOWED_ORIGINS` (ohne `Origin` nur mit `Sec-Fetch-Site: same-origin`), `Content-Type: application/json` Pflicht.
- Schlüssel: `APP_KEY` (`.env`) → abgeleitete Teilschlüssel für IP-HMAC und CSRF.
**Tage & Einstellungen (2.1)**

| Endpunkt | Zweck |
|---|---|
| `GET/PATCH /v1/settings` | Einstellungen lesen; ändern (jede Gruppe optional, innerhalb von `thresholds`/`shake` auch einzelne Felder; unbekannte Felder → 422): `theme`, `proteinDefault`, `checkpoint {offsetMin 60–300/15, pct 50–95/5, earliestMin 240–600/15}`, `earliestTrainingMin` 300–720/15, `tolerancePct` 1–15, `thresholds {minProteinGap, bigShakeProtein, bigShakeKcal, lightMealKcal, restShakeFrom, richMilkKcal, overKcalProtein}`, `shake {proteinPowderFoodId, milkLowFoodId, milkHighFoodId (eigene Produkte, nicht pro Stück, null erlaubt), bigMl, smallMl, powderG}` |
| `PATCH /v1/profile` | `{displayName, username}` + CSRF → `{user}` · 409 `username_taken` · 422 bei ungültigem Username |
| `POST /v1/account/delete` | `{password}` + CSRF → 204, Cookie gelöscht, alle Daten des Users gelöscht (D-082) · 422 `invalid_password` · 429 (Login-Rate-Limit, D-124) |
| `GET/POST /v1/day-types`, `PATCH/DELETE /v1/day-types/{id}` | Tagesarten verwalten (Löschen: nicht, wenn in der Wochenvorlage benutzt; mindestens eine bleibt; weich gelöscht) |
| `GET/PUT /v1/week-template` | Wochenvorlage (genau 7 Einträge) |
| `GET /v1/days/today`, `GET /v1/days/{date}` | Tag mit Soll-Schnappschuss; Zukunft → 422 |
| `PUT /v1/days/{date}` | Tagesart/Training für einen Tag setzen (auch rückwirkend, `source = manual`) |

- Logischer Tag: Europe/Berlin, endet um `day_boundary_min` (02:00) des Folgetags (`LogicalCalendar`).
- Heute wird bei jedem Abruf aus den aktuellen Einstellungen neu berechnet; vergangene Tage bleiben fest. Vor jeder Änderung an Tagesarten, Wochenvorlage oder Protein-Standard werden alle vergangenen Tage ohne Datensatz (seit Kontoanlage) mit den bisherigen Werten gespeichert – in derselben Transaktion wie die Änderung.
- Trainingszeit: 15-Minuten-Raster, `earliest_training_min` (09:00) bis 23:45; Dauer 30/60/90/120.
- Startdaten (`UserSeeder`, D-080): fünf Tagesarten, Wochenvorlage alles Ruhetag; mit `--owner-defaults` Di/Do Basketball 20:00.

- Admin-CLI (`bin/`, nur per SSH): `user-create.php` (zufälliges Startpasswort oder `--set-password`), `user-password.php` (Reset + alle Sessions beenden), `migrate.php`, `user-seed.php` (Startdaten für bestehende User).

Fehlerformat: `{"error":{"code":"…","message":"…"}}` mit deutscher, nutzbarer Meldung; interne Details nur im Log. Body max. 64 KB, JSON-Tiefe max. 32, Pfad-Parameter nur `[A-Za-z0-9_-]{1,64}`.

Alle schreibenden Endpunkte: Session-Cookie + CSRF-Token, serverseitige Validierung, Zugriff nur auf eigene Daten (`user_id`).

## Datenmodell (Entwurf)

| Tabelle | Wichtige Felder |
|---|---|
| `users` | id, username (unique, klein, `[a-z0-9._-]{3,32}`), display_name, password_hash (Argon2id), password_changed_at, created_at |
| `schema_migrations` | version, applied_at (jede Migration trägt sich selbst ein) |
| `sessions` | id, user_id (FK, CASCADE), token_hash (BINARY(32), SHA-256, unique), created_at, last_seen_at, expires_at (gleitend 30 Tage), absolute_expires_at (90 Tage), revoked_at |
| `login_attempts` | id, username, ip_hash (HMAC), attempted_at, success · Löschung nach 30 Tagen |
| `user_settings` | user_id (FK, CASCADE), theme (system/light/dark), protein_default, default_duration_min, earliest_training_min, checkpoint_offset_min, checkpoint_pct, earliest_checkpoint_min, day_boundary_min, updated_at · protein_powder_food_id, shake_milk_low_food_id, shake_milk_high_food_id (FK SET NULL), shake_big_ml (400), shake_small_ml (200), shake_powder_g (30) · ab `009_settings`: tolerance_pct (5), sg_min_protein_gap (25), sg_big_shake_protein (35), sg_big_shake_kcal (500), sg_light_meal_kcal (700), sg_rest_shake_from (1140 = 19:00), sg_rich_milk_kcal (400), sg_over_kcal_protein (30) |
| `day_types` | id, user_id, system_key (`rest` = fester Ruhetag, D-106), name, kcal, protein (nullable = Protein-Standard), carbs, sugar_ref, is_training, sort, deleted_at |
| `week_template` | user_id, weekday (1–7, ISO), day_type_id (FK RESTRICT), training_start (Minuten), duration_min |
| `days` | id, user_id, date (logischer Tag, unique je User), day_type_id (FK SET NULL), day_type_name (Schnappschuss), is_training, training_start, duration_min, target_kcal/protein/carbs/sugar (Schnappschuss), source (template/manual) |
| `foods` | id, user_id, type (product/reference/ingredient), name, brand, barcode (unique je User), category (snacks/dairy/bread/produce/drinks), basis (per_100g/per_100ml/per_unit), Nährwerte je Basis (DECIMAL), package_amount (Einheit der Basis), source (seed/manual/off/bls), deleted_at, usage_count, last_amount, last_unit, is_quick (Shakes) |
| `off_cache` | cache_key (`barcode:…`/`search:<sha256>`), payload (normalisiert, NULL = nicht gefunden), fetched_at · TTL: Treffer 30 Tage, Fehlanzeigen/Suchen 1 Tag |
| `rate_limits` | user_id, bucket, window_start, hits (z. B. OFF-Barcode 30/min, OFF-Suche 10/min je User) |
| `dishes` | id, user_id, name, cooked_on, portions_total (DECIMAL, Schritte 0,5), Summen kcal/protein/carbs/sugar/fat, discarded_at, based_on_dish_id · übrige Portionen = total − Summe der Gericht-Einträge (abgeleitet); Status active/archived/discarded abgeleitet |
| `dish_ingredients` | id, dish_id, food_id (FK SET NULL), sort, name_snapshot, food_type, amount + unit (wie eingegeben), quantity (umgerechnet), Nährwert-Schnappschuss |
| `entries` | id, user_id, date (logischer Tag), time_min (Wandzeit, 15-Min-Raster), kind (food/dish/shake), food_id (FK SET NULL) / dish_id, name_snapshot, amount + unit (wie eingegeben: g/ml/el/tl/packung/stueck/portion), quantity (umgerechnet: g, ml, Stück oder Portionen), Nährwert-Schnappschuss kcal/protein/carbs/sugar/fat |

Der **logische Tag** endet um 02:00 (`day_boundary`); ein Eintrag um 00:30 am 21.10. gehört zum Tag 20.10. Tage werden beim ersten Zugriff aus der Wochenvorlage angelegt (mit Soll-Schnappschuss). Damit vergangene Tage fest bleiben, werden **vor jeder Änderung** an Wochenvorlage, Tagesarten oder Protein-Standard alle vergangenen Tage seit Kontoanlage ohne Datensatz mit den bisherigen Werten angelegt (wenige hundert Zeilen pro Jahr, in einer Transaktion).

Haushaltsmaße sind Konstanten (1 EL = 15 g/ml, 1 TL = 5 g/ml) in `frontend/src/domain/units.ts` und `api/src/Food/Units.php`; beide Test-Suiten lesen dieselben Fälle aus `frontend/src/domain/units.cases.json`. Beim Bearbeiten eines Eintrags wird der gespeicherte Schnappschuss nur nach Menge skaliert, nie aus dem (evtl. geänderten) Produkt neu berechnet.

Einträge und Gerichtszutaten speichern **Schnappschüsse**, damit spätere Produktänderungen die Vergangenheit nicht verändern.

## Wichtige Abläufe

**Login:** Username + Passwort → Bereinigung alter Versuche/Sessions → Rate-Limit-Prüfung → Argon2id-Prüfung → zufälliger Session-Token (nur Hash in DB) → Cookie `HttpOnly; Secure; SameSite=Strict`, gleitend 30 Tage, max. 90 Tage → CSRF-Token an den Client.

**Barcode:** Kamera liest EAN → `GET /foods/barcode/{ean}` → API prüft Prüfziffer, eigene Bibliothek, dann `off_cache`, dann Open Food Facts (`world.openfoodfacts.org/api/v2/product`) → normalisierte, plausibilisierte Werte zurück → Nutzer bestätigt → Produkt in Bibliothek.

**Online-Suche:** `search.openfoodfacts.org/search` (Lucene); der Suchbegriff wird auf Buchstaben/Ziffern reduziert, der Länderfilter `countries_tags:"en:germany"` von der API angehängt. Ausgehende Anfragen nur per `CurlFetcher`: Host-Allowlist, nur HTTPS, keine Redirects, 3 s Connect-/5 s Gesamt-Timeout, max. 1 MB Antwort.

**Eintrag:** Lebensmittel/Portion + Menge + Zeit → API berechnet Nährwerte aus Produktdaten → speichert Schnappschuss → bei Gerichten `portions_left − 1`, bei 0 Status `archived`.

## Theme

`data-theme` auf `<html>`: nicht gesetzt = System, sonst `light`/`dark` aus `user_settings.theme`. Tokens in `design/tokens.css`.
