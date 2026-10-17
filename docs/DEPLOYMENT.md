# Deployment (Plesk, manuell per SFTP)

Wird von Claude Code mit jedem Schritt präzisiert (Befehle, Dateilisten, Migrationen).

## Einmalig einrichten

1. Domain/Subdomain in Plesk anlegen, **Let's Encrypt** aktivieren, HTTPS-Weiterleitung an.
2. PHP-Version wählen (siehe offene Punkte), `display_errors` aus.
3. Datenbank + eigener DB-User mit minimalen Rechten anlegen.
4. Ordner `primed-app/` **neben** `httpdocs/` anlegen (nicht darin).
5. `.env` aus `api/.env.example` erstellen, ausfüllen, nach `primed-app/.env` hochladen.
6. SFTP-Zugang nutzen, **kein** unverschlüsseltes FTP.

## Jedes Release

1. Lokal: Tests grün (`npm test`, `composer test`), Security Audit dokumentiert.
2. Frontend bauen: `npm run build` → Inhalt von `frontend/dist/` nach `httpdocs/`.
3. API: `composer install --no-dev --optimize-autoloader` lokal, dann `src/`, `vendor/`, `bootstrap.php` nach `primed-app/`; `public/index.php` nach `httpdocs/api/`.
4. Neue Migrationen (`api/migrations/NNN_*.sql`) **in Reihenfolge** über phpMyAdmin ausführen. Vorher Datenbank-Backup in Plesk.
5. Smoke-Test: Login, Heute laden, Eintrag anlegen/löschen, Barcode-Suche.
6. `CHANGELOG.md` mit Version und Datum ergänzen.

## Ausgeführte Migrationen

| Nr. | Datei | Ausgeführt am |
|---|---|---|
| – | – | – |
