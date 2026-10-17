# Sicherheit

Oberstes Prinzip: **maximale Sicherheit**. Trade-offs mit Benutzerfreundlichkeit oder Design werden dem Nutzer vorgelegt, nie selbst entschieden.

## Mindestanforderungen

**Transport & Header**
- HTTPS erzwungen (Let's Encrypt in Plesk), HSTS `max-age=31536000`, ohne `preload` (D-066).
- Strenge Content-Security-Policy ohne `unsafe-inline`/`unsafe-eval`; `connect-src 'self'`; keine externen Skripte, Fonts oder Bilder. Umgesetzt in `frontend/public/.htaccess`: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; media-src 'self' blob:; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests`. Build ohne `data:`-URIs (`assetsInlineLimit: 0`).
- Prüfung: Regressionstest `frontend/src/security/htaccess.test.ts` und Live-Check `scripts/check-headers.sh <URL>`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (Kamera nur `self`), `frame-ancestors 'none'`.

**Authentifizierung & Sessions**
- Passwörter mit Argon2id (`password_hash`, `PASSWORD_ARGON2ID`, auf dem Server verfügbar), mindestens 12 Zeichen, keine Zeichenregeln, Abgleich mit lokaler Liste häufiger Passwörter (D-062).
- Session-Token kryptografisch zufällig, in der DB nur als Hash.
- Cookie mit `__Host-`-Präfix (erzwingt `Secure`, `Path=/`, keine Domain), `HttpOnly; Secure; SameSite=Strict; Path=/`, gleitend 30 Tage, höchstens 90 Tage ab Login, serverseitig widerrufbar (D-060).
- „Überall abmelden“; nach Passwortänderung alle anderen Sessions beenden.
- Rate-Limit (D-061): IP+Username 5 Fehlversuche/15 min → 15 min Sperre; Username ab 10 Fehlversuchen steigende Verzögerung (keine harte Sperre); IP max. 30 Versuche/h. IPs nur als HMAC (Schlüssel in `.env`), Löschung nach 30 Tagen. Einheitliche Fehlermeldung (kein Hinweis, ob Username existiert), gleiche Laufzeit für unbekannte User.
- Kein Passwort-Reset über das Web; User-Anlage und Reset nur per CLI auf dem Server (D-063). Startpasswörter: zufällig erzeugt (CLI), keine Änderungspflicht (D-079).
- Konto löschen nur mit Passwort-Bestätigung (D-082); löscht alle Daten des Users.
- Keine öffentliche Registrierung.

**Anfragen & Daten**
- CSRF-Token für alle schreibenden Requests (Header). Zusätzlich: `Origin`-Prüfung gegen `APP_URL` und erzwungener `Content-Type: application/json` für alle schreibenden Requests, auch für den Login (Schutz vor Login-CSRF).
- Größenlimit für Request-Bodys (z. B. 64 KB).
- Serverseitige Validierung aller Eingaben (Typen, Bereiche, Längen, Datumsformate, EAN-Format).
- Nur vorbereitete Statements (PDO), DB-User mit minimalen Rechten.
- Jede Abfrage strikt auf `user_id` der Session begrenzt.
- Fehlerantworten ohne Stacktraces oder interne Details; Logs ohne Passwörter, Tokens, Sessions.
- Sicherheitsereignisse protokollieren (Login ok/fehlgeschlagen, Sperre, Logout-all, Passwortwechsel) mit User-ID und IP-HMAC, ohne Geheimnisse; Logdateien außerhalb des Webroots.

**Konfiguration & Ablage**
- `.env` und PHP-Code außerhalb des Webroots; `display_errors=Off` in Produktion.
- Keine Geheimnisse im Repo, nur `.env.example`.
- Abhängigkeiten fixiert, Lockfiles committed (`package-lock.json`, `composer.lock`), vor jedem Release `npm audit` und `composer audit`.
- npm-Installationsskripte standardmäßig blockiert (`ignore-scripts=true` in `.npmrc`), Ausnahmen nur einzeln geprüft und dokumentiert.
- Vor jedem Commit den Diff auf Geheimnisse prüfen (keine `.env`, keine echten Adressen/Schlüssel).

**Externe Dienste**
- Open Food Facts nur serverseitig, mit Timeout, Größenlimit, Antwortvalidierung und Cache. Übermittelt wird nur Barcode bzw. Suchbegriff.
- SSRF-Schutz: feste Ziel-Host-Allowlist (`world.openfoodfacts.org`), nur HTTPS, keine Redirects; Barcode nur Ziffern (EAN-8/13, UPC-A) mit Prüfziffer, Suchbegriff längenbegrenzt und URL-kodiert.
- Keine Produktbilder von OFF laden (CSP bleibt `img-src 'self'`).

**Datenschutz**
- Server in Deutschland. Ernährungsdaten sind gesundheitsnah: Datensparsamkeit, keine Tracker, keine externen CDNs, Schriften selbst gehostet.
- Datenklassen: Zugangsdaten (Passwort-Hash, Session-Token-Hash) · personenbezogen (Username, Display-Name, IP-HMAC) · gesundheitsnah (Einträge, Tage, Gerichte) · nicht personenbezogen (OFF-Cache).
- Aufbewahrung: Login-Versuche 30 Tage, abgelaufene/widerrufene Sessions nach 30 Tagen löschen. Ein User lässt sich per CLI vollständig löschen (alle Tabellen per `user_id`, `ON DELETE CASCADE`).

## Audit-Log

Nach **jedem** Implementierungsschritt mit `agent-skills:security-and-hardening` prüfen und hier eintragen.

| Datum | Schritt (Roadmap-ID) | Umfang | Funde | Maßnahmen | Status |
|---|---|---|---|---|---|
| 2026-10-17 | 0.1 | Sicherheitsanforderungen in SECURITY, ARCHITECTURE, `.env.example` (nur Doku, kein Code) | 1) Login-CSRF nicht adressiert · 2) keine Vorgaben zu npm-Installationsskripten/Lockfiles · 3) kein Security-Event-Logging · 4) SSRF-Schutz für OFF nicht konkret · 5) keine Aufbewahrungs-/Löschregeln für Sessions und User · 6) Cookie ohne `__Host-`-Präfix · 7) kein Body-Größenlimit | Alle Punkte als Anforderungen in SECURITY.md ergänzt; Umsetzung in 0.2 (npm), 0.3 (Limits), 1.1–1.3 (Auth, Logging, Header) | erledigt (Doku) |
| 2026-10-17 | 0.2 | Frontend-Gerüst: Abhängigkeiten, npm-Konfiguration, Build, Lint-Regeln | 1) Dev-Proxy mit `secure: false` (DDEV-Zertifikat ist für Node nicht vertrauenswürdig) · 2) keine Install-Skripte im Abhängigkeitsbaum · 3) `npm audit`: 0 Funde, `npm audit signatures`: verifiziert | 1) nur Dev-Server, nicht im Build – akzeptiert · ESLint verbietet `dangerouslySetInnerHTML`, `eval`; Sourcemaps im Produktions-Build aus; `ignore-scripts`, `save-exact`, `engine-strict` in `.npmrc`; Lockfile committed | erledigt |
| 2026-10-17 | 2.2 | Reine Fachfunktionen im Frontend (`domain/`) | keine Angriffsfläche (keine Ein-/Ausgabe, kein DOM, keine Speicherung); Eingaben kommen typisiert aus der API · Hinweis: Berechnungen im Client dienen nur der Anzeige, gespeicherte Schnappschüsse berechnet die API | keine Maßnahmen nötig | erledigt |
| 2026-10-17 | 2.1 | Einstellungen, Tagesarten, Wochenvorlage, Tage (API), Startdaten | 1) PATCH auf fremde/gelöschte Tagesart antwortete 422 statt 404 (Validierung vor Existenzprüfung → Hinweis auf existierende IDs) · 2) Materialisierung vergangener Tage wächst mit dem Kontoalter · 3) Zugriff fremder User | 1) Existenz/Eigentum zuerst, Test · 2) begrenzt (~365 Tage/Jahr, nur bei Einstellungsänderungen, in Transaktion), bei Bedarf später als Sammel-Insert · 3) alle Abfragen über `user_id` der Session, IDs nur `[1-9]\d{0,9}`, Datum per Regex + `checkdate`; Tests für fremde IDs, CSRF, fehlende Session, Typ-/Bereichs-/Steuerzeichen-Validierung | erledigt |
| 2026-10-17 | 1.4 | API-Client, Auth-Zustand, Loading-/Login-Screen, Live-Prüfung in DDEV (Apache, PHP 8.3, MariaDB 10.11) | 1) **`api/.htaccess` sperrte alle API-Pfade (403)**: `FilesMatch` griff vor dem Rewrite – erst durch den Live-Check gefunden · 2) Prüfskript las nur 200 Byte und meldete die App-Shell fälschlich als Datenleck · 3) CSRF-Token im Browser | 1) Sperre per Rewrite-Regel (nur existierende Dateien außer `index.php` → 403), `check-headers.sh` vollständig grün · 2) Skript korrigiert · 3) nur im Speicher, nie in `localStorage`; nach Reload über `/auth/me` · Außerdem: Fehlertexte nur aus definierten Server-Meldungen, Passwortfeld wird nach Fehlversuch geleert, `autocomplete`-Attribute für Passwortmanager, kein „Passwort vergessen“; End-to-End per curl: Login → Cookie `__Host-` → me → Logout ohne CSRF 403 → Logout 204 → me 401 | erledigt |
| 2026-10-17 | 1.3 | `.htaccess` (Web-Root, API), Header, CSP, HSTS, Caching, Fehlerbehandlung | 1) Vite könnte kleine Assets als `data:` einbetten → würde `img-src`/`font-src data:` erzwingen · 2) fehlende Assets lieferten per SPA-Fallback HTML statt 404 · 3) Trusted Types (`require-trusted-types-for 'script'`) würde XSS weiter erschweren, aber iOS-Unterstützung und Bibliotheks-Kompatibilität (ZXing) ungeprüft · 4) Live-Prüfung über Apache noch nicht möglich (DDEV nicht gestartet) | 1) `assetsInlineLimit: 0` · 2) `/assets/` vom Fallback ausgenommen · 3) Prüfung in 7.5 mit echtem Browser vorgemerkt · 4) `scripts/check-headers.sh` bei DDEV-Start und in 1.5 ausführen · Fehlerbehandlung: API liefert nur generische Meldungen (seit 0.3 getestet), `index.php` fängt Bootstrap-Fehler ab | erledigt (Punkt 4 erledigt: live in DDEV geprüft, siehe 1.4) |
| 2026-10-17 | 1.2 | Login, Logout, Überall abmelden, Passwort ändern, Rate-Limit, Session-Cookie, CSRF, Origin-Prüfung, Admin-CLI | 1) Login-Versuche wurden nur nach erfolgreichem Login bereinigt → Tabelle durch Fehlversuch-Fluten unbegrenzt wachsend · 2) unbekannter User antwortete schneller (Timing-Enumeration) · 3) verdeckte Passworteingabe in der CLI braucht `stty` · 4) Startpasswörter kennt der Betreiber (D-079, Nutzerentscheidung) | 1) Bereinigung bei jedem Versuch (Test) · 2) Dummy-Argon2id-Prüfung, identische Antwort (Test) · 3) CLI bricht ab, wenn Echo nicht abschaltbar ist, statt das Passwort sichtbar zu lesen; Standard ist ein zufälliges Startpasswort · 4) Nutzer-Doku empfiehlt Ändern · Außerdem getestet: Rate-Limit (Paar/User/IP), gleitende 30 + absolute 90 Tage, Widerruf, Logout-all, Passwortwechsel beendet andere Sessions, CSRF fehlend/gefälscht, fremde Origin, Formular-Content-Type, Token nur gehasht, keine Geheimnisse im Log, kaputte Cookies | erledigt |
| 2026-10-17 | 1.1 | Migration `001_init`, Migrator, `bin/migrate.php`, Test-Setup | 1) App-DB-User bräuchte für Migrationen DDL-Rechte · 2) CLI-Skripte könnten bei falschem Upload im Webroot landen · 3) Retention der Login-Versuche/Sessions braucht Indizes | 1) Zwei DB-User in DEPLOYMENT: App nur DML, Migrationen per phpMyAdmin/separatem User · 2) `bin/` liegt in `primed-app/` (außerhalb Webroot), Skripte brechen ohne CLI-SAPI ab · 3) Indizes auf `attempted_at`/`expires_at`; Token nur als SHA-256 (BINARY(32), unique); FK mit `ON DELETE CASCADE` für vollständige Kontolöschung (getestet) | erledigt |
| 2026-10-17 | 0.3 | API-Gerüst: Front-Controller, `.htaccess`, Bootstrap, `.env`-Parser, Request/Router, Fehlerbehandlung, Logger, PDO-Factory, Composer | 1) Router-Parameter akzeptierten Zeilenumbruch/beliebige Zeichen (per Test gefunden) · 2) Client-IP aus `REMOTE_ADDR`: hinter dem nginx-Proxy von Plesk muss Apache die echte IP liefern · 3) frühe Parse-Fehler vor `bootstrap.php` · 4) `composer audit`: 0 Funde, keine Composer-Plugins erlaubt | 1) Parameter auf `[A-Za-z0-9_-]{1,64}` begrenzt, Regex mit `$`+`D`, Tests · 2) in 1.5 auf dem Server prüfen, Forward-Header werden bewusst nicht vertraut · 3) `display_errors=Off` in Plesk (DEPLOYMENT) · Weitere Maßnahmen: `.env` ohne `putenv`, Fehlermeldungen ohne Werte/Pfade, nur `index.php` per `.htaccess` erreichbar, API-Header `no-store`/`nosniff`/CSP `default-src 'none'`, Body ≤ 64 KB, JSON-Tiefe ≤ 32, Log-Schwärzung sensibler Keys, PDO ohne emulierte Prepares, strict SQL mode, UTC | erledigt (Punkt 2 offen bis 1.5) |
| 2026-10-17 | 0.4 | Schriften, Tokens, Basis-Komponenten, Build-Ausgabe | 1) Build-Ausgabe auf externe URLs geprüft: keine (nur XML-Namespaces) · 2) Wortmarke setzt `font-size` per React-`style` (CSSOM, nicht von CSP `style-src` betroffen) · 3) Dev-Server darf nur `frontend/` und `design/` lesen | Schriften lokal gebündelt (OFL), keine CDN-Anfragen; `fs.allow` eingeschränkt; `npm audit`: 0 | erledigt |
