# Sicherheit

Oberstes Prinzip: **maximale Sicherheit**. Trade-offs mit Benutzerfreundlichkeit oder Design werden dem Nutzer vorgelegt, nie selbst entschieden.

## Mindestanforderungen

**Transport & Header**
- HTTPS erzwungen (Let's Encrypt in Plesk), HSTS `max-age=31536000`, ohne `preload` (D-066).
- Strenge Content-Security-Policy ohne `unsafe-inline`/`unsafe-eval`; `connect-src 'self'`; keine externen Skripte, Fonts oder Bilder.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (Kamera nur `self`), `frame-ancestors 'none'`.

**Authentifizierung & Sessions**
- Passwörter mit Argon2id (`password_hash`, `PASSWORD_ARGON2ID`, auf dem Server verfügbar), mindestens 12 Zeichen, keine Zeichenregeln, Abgleich mit lokaler Liste häufiger Passwörter (D-062).
- Session-Token kryptografisch zufällig, in der DB nur als Hash.
- Cookie mit `__Host-`-Präfix (erzwingt `Secure`, `Path=/`, keine Domain), `HttpOnly; Secure; SameSite=Strict; Path=/`, gleitend 30 Tage, höchstens 90 Tage ab Login, serverseitig widerrufbar (D-060).
- „Überall abmelden“; nach Passwortänderung alle anderen Sessions beenden.
- Rate-Limit (D-061): IP+Username 5 Fehlversuche/15 min → 15 min Sperre; Username ab 10 Fehlversuchen steigende Verzögerung (keine harte Sperre); IP max. 30 Versuche/h. IPs nur als HMAC (Schlüssel in `.env`), Löschung nach 30 Tagen. Einheitliche Fehlermeldung (kein Hinweis, ob Username existiert), gleiche Laufzeit für unbekannte User.
- Kein Passwort-Reset über das Web; User-Anlage und Reset nur per CLI auf dem Server (D-063).
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
