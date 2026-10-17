# Changelog

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
