# Deployment (Plesk, manuell per SFTP)

Wird von Claude Code mit jedem Schritt präzisiert (Befehle, Dateilisten, Migrationen).

## Einmalig einrichten

1. Subdomain `primed.dev-pfeffermond.de` in Plesk anlegen, **Let's Encrypt** aktivieren, HTTPS-Weiterleitung an.
2. PHP 8.3 wählen (Erweiterungen: pdo_mysql, mbstring, sodium, curl), `display_errors` aus (auch serverseitig nötig: Parse-Fehler entstehen, bevor `bootstrap.php` es abschalten kann). CLI per SSH immer mit `/opt/plesk/php/8.3/bin/php` (das Standard-`php` kann eine andere Version sein).
3. Datenbank (MariaDB 10.11) anlegen, **tägliches DB-Backup** in Plesk einrichten. Zwei DB-User (Least Privilege):
   - `primed_app` (für `.env`): nur `SELECT, INSERT, UPDATE, DELETE`.
   - Migrationen: über phpMyAdmin (Plesk-Admin) oder einen zweiten User mit zusätzlich `CREATE, ALTER, INDEX, REFERENCES, DROP`, der **nicht** in der `.env` steht.
4. Ordner `primed-app/` **neben** `httpdocs/` anlegen (nicht darin).
5. `.env` aus `api/.env.example` erstellen, ausfüllen, nach `primed-app/.env` hochladen (Rechte `600`). `APP_KEY` neu erzeugen: `php -r 'echo base64_encode(random_bytes(32)), PHP_EOL;'`. `ALLOWED_ORIGINS` leer lassen.
6. SFTP-Zugang nutzen, **kein** unverschlüsseltes FTP. SSH ist verfügbar, Composer nicht (wird lokal ausgeführt).
7. Ersten User anlegen: `/opt/plesk/php/8.3/bin/php primed-app/bin/user-create.php --set-password` (Username `marcch`, Display-Name „Marc“, Passwort verdeckt eingeben); für den Betreiber zusätzlich `--owner-defaults` (persönliche Wochenvorlage). Bestehende User ohne Startdaten: `bin/user-seed.php`. Freunde: ohne `--set-password` → zufälliges Startpasswort wird einmalig angezeigt. Passwort zurücksetzen: `bin/user-password.php`.

## Jedes Release

1. Lokal: Tests grün (`npm test`, `composer test`), Security Audit dokumentiert.
2. Frontend bauen: `npm run build` → Inhalt von `frontend/dist/` nach `httpdocs/`.
3. API: `composer install --no-dev --optimize-autoloader` lokal, dann `src/`, `vendor/`, `bin/`, `resources/`, `bootstrap.php` nach `primed-app/` (dort zusätzlich leeres, für PHP schreibbares `var/log/`); `public/index.php` und `public/.htaccess` nach `httpdocs/api/`.
4. Vorher Datenbank-Backup in Plesk. Neue Migrationen (`api/migrations/NNN_*.sql`) **in Reihenfolge** über phpMyAdmin ausführen (Datei-Inhalt im SQL-Tab). Jede Migration trägt sich selbst in `schema_migrations` ein; Stand prüfen mit `SELECT * FROM schema_migrations`.
5. Smoke-Test: Login, Heute laden, Eintrag anlegen/löschen, Barcode-Suche; `scripts/check-headers.sh https://primed.dev-pfeffermond.de` (inkl. PWA-Dateien).
   - Zum `dist/`-Inhalt gehören seit 7.3 auch `sw.js`, `manifest.webmanifest` und `pwa/` (Icons). Alles komplett ersetzen; alte `assets/` dürfen weg.
   - **Notfall: Service Worker abschalten.** `httpdocs/sw.js` durch diesen Inhalt ersetzen, dann entfernt er sich beim nächsten Aufruf selbst und löscht seine Caches:
     ```js
     self.addEventListener('install', () => self.skipWaiting());
     self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))).then(() => self.registration.unregister())));
     ```
6. `CHANGELOG.md` mit Version und Datum ergänzen.

## Ausgeführte Migrationen

| Nr. | Datei | Ausgeführt am |
|---|---|---|
| – | – | – |
