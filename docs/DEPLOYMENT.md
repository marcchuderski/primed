# Deployment (Plesk, manuell per SFTP)

Wird von Claude Code mit jedem Schritt präzisiert (Befehle, Dateilisten, Migrationen). Laufender Betrieb (User-CLI, Backups, Logs, Störungen): [`BETRIEB.md`](BETRIEB.md). Anleitung für Nutzer: [`ANLEITUNG.md`](ANLEITUNG.md).

## Einmalig einrichten

1. Subdomain `primed.dev-pfeffermond.de` in Plesk anlegen, **Let's Encrypt** aktivieren, HTTPS-Weiterleitung an.
2. PHP 8.3 wählen (Erweiterungen: pdo_mysql, mbstring, sodium, curl), `display_errors` aus (auch serverseitig nötig: Parse-Fehler entstehen, bevor `bootstrap.php` es abschalten kann). CLI per SSH immer mit `/opt/plesk/php/8.3/bin/php` (das Standard-`php` kann eine andere Version sein).
3. Datenbank (MariaDB 10.11) anlegen, **tägliches DB-Backup** in Plesk einrichten. Zwei DB-User (Least Privilege):
   - `primed_app` (für `.env`): nur `SELECT, INSERT, UPDATE, DELETE`.
   - Migrationen: über phpMyAdmin (Plesk-Admin) oder einen zweiten User mit zusätzlich `CREATE, ALTER, INDEX, REFERENCES, DROP`, der **nicht** in der `.env` steht.
4. Ordner `primed-app/` **neben** `httpdocs/` anlegen (nicht darin).
5. `.env` aus `api/.env.example` erstellen, ausfüllen, nach `primed-app/.env` hochladen (Rechte `600`). `APP_KEY` neu erzeugen: `php -r 'echo base64_encode(random_bytes(32)), PHP_EOL;'`. `ALLOWED_ORIGINS` leer lassen.
6. SFTP-Zugang nutzen, **kein** unverschlüsseltes FTP. SSH ist verfügbar, Composer nicht (wird lokal ausgeführt).
7. In Plesk unter **Apache & nginx-Einstellungen** für die Subdomain: „Proxymodus“ **an**, „Intelligente Bearbeitung statischer Dateien“ **aus** und „Statische Dateien direkt durch nginx bedienen“ **aus** (beim ersten Deploy-Check bestätigt: mit der intelligenten Bearbeitung fehlten alle Sicherheits-Header) (sonst gelten die Header und Cache-Regeln aus `.htaccess` nicht für JS/CSS/Bilder/`sw.js`). Falls möglich `ServerTokens Prod` (sonst bleibt der `Server`-Header; unkritisch).
8. Ersten User anlegen: `/opt/plesk/php/8.3/bin/php primed-app/bin/user-create.php --set-password` (Username `marcch`, Display-Name „Marc“, Passwort verdeckt eingeben); für den Betreiber zusätzlich `--owner-defaults` (persönliche Wochenvorlage). Bestehende User ohne Startdaten: `bin/user-seed.php`. Freunde: ohne `--set-password` → zufälliges Startpasswort wird einmalig angezeigt. Passwort zurücksetzen: `bin/user-password.php`.

## Erster Deploy-Check (einmalig, vor der Freigabe an Freunde)

1. Erstes Release nach „Jedes Release“ einspielen, alle Migrationen `001`–`011` in Reihenfolge.
2. ✓ (2026-10-19, alle ok) `scripts/check-headers.sh https://primed.dev-pfeffermond.de` vom eigenen Rechner (nicht auf dem Server): alles `ok`. Die Proben auf `.env`/`.git` wirken wie ein Angriffs-Scan; Fail2Ban (Jail `plesk-apache`, zählt die 403-Antworten) sperrt dann die eigene IP (`Failed to connect`). Den Check daher über einen Wegwerf-Anschluss laufen lassen (Handy-Hotspot) oder die eigene IP für die Dauer des Checks unter Tools & Einstellungen › IP-Adressensperre (Fail2Ban) › Vertrauenswürdige IP-Adressen eintragen und danach wieder entfernen. Gesperrt? Dort unter „Gesperrte IP-Adressen“ entsperren. (inkl. Header auf `/assets/*.js` und HTTP→HTTPS für `/api/`).
3. **Echte Client-IP prüfen** (Rate-Limit, D-061): je einmal mit falschem Passwort aus zwei verschiedenen Netzen anmelden (z. B. WLAN und Mobilfunk), dann in phpMyAdmin `SELECT HEX(ip_hash), attempted_at FROM login_attempts ORDER BY id DESC LIMIT 5;`. Die beiden Hashes **müssen verschieden** sein. Sind sie gleich, sieht Apache nur die Proxy-Adresse: in Plesk `mod_remoteip` (bzw. „Real IP“) für nginx → Apache aktivieren und erneut prüfen. Forward-Header werden in PHP bewusst nicht ausgewertet.
4. Smoke-Test auf iPhone und Android: Login, App installieren (`ANLEITUNG.md`), Theme Hell/Dunkel (startet ohne Flackern), Eintrag anlegen/löschen, Barcode-Scan mit Kamera, offline öffnen („Keine Verbindung“).
5. Trusted Types testen: in Chrome DevTools einmal mit zusätzlichem Header `Content-Security-Policy-Report-Only: require-trusted-types-for 'script'` (z. B. per Override) alle Bildschirme und den Scanner öffnen; keine Verstöße in der Konsole → Entscheidung über Aktivierung festhalten (`DECISIONS.md`).
6. Ergebnis in `SECURITY.md` (Audit-Log) eintragen.

## Jedes Release

1. Lokal: alles committet, Tests grün (`cd frontend && npm run check`, `ddev composer check`), Security Audit dokumentiert.
2. Paket bauen: `scripts/build-release.sh` → `build/release-<version>-<commit>/` mit `httpdocs/`, `primed-app/`, `migrations/`, `SHA256SUMS`, `RELEASE.txt`. Das Skript baut das Frontend, installiert die API ohne Dev-Abhängigkeiten (nur Autoloader), setzt Rechte 644/755 und bricht ab bei fehlenden Dateien, Dev-Paketen, `.env`, Source Maps, PHP im Web-Root oder möglichen Geheimnissen. Lokal geprüft: die API startet aus diesem Layout.
3. Hochladen per SFTP: Inhalt von `httpdocs/` nach `httpdocs/` (`assets/` vorher komplett leeren), Inhalt von `primed-app/` nach `primed-app/` (die `.env` und `var/log/` auf dem Server bleiben; `var/log/` muss für PHP schreibbar sein). `migrations/` wird **nicht** hochgeladen. `bin/migrate.php` ist bewusst nicht im Paket (Migrationen nur per phpMyAdmin).
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
