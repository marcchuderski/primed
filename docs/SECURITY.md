# Sicherheit

Oberstes Prinzip: **maximale Sicherheit**. Trade-offs mit Benutzerfreundlichkeit oder Design werden dem Nutzer vorgelegt, nie selbst entschieden.

## Mindestanforderungen

**Transport & Header**
- HTTPS erzwungen (Let's Encrypt in Plesk), HSTS.
- Strenge Content-Security-Policy ohne `unsafe-inline`/`unsafe-eval`; `connect-src 'self'`; keine externen Skripte, Fonts oder Bilder.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (Kamera nur `self`), `frame-ancestors 'none'`.

**Authentifizierung & Sessions**
- Passwörter mit Argon2id (`password_hash`), Mindestlänge festlegen.
- Session-Token kryptografisch zufällig, in der DB nur als Hash.
- Cookie `HttpOnly; Secure; SameSite=Strict; Path=/`, 30 Tage, serverseitig widerrufbar.
- „Überall abmelden“; nach Passwortänderung alle anderen Sessions beenden.
- Rate-Limit und temporäre Sperre bei Fehlversuchen; einheitliche Fehlermeldung (kein Hinweis, ob Username existiert).
- Keine öffentliche Registrierung.

**Anfragen & Daten**
- CSRF-Token für alle schreibenden Requests.
- Serverseitige Validierung aller Eingaben (Typen, Bereiche, Längen, Datumsformate, EAN-Format).
- Nur vorbereitete Statements (PDO), DB-User mit minimalen Rechten.
- Jede Abfrage strikt auf `user_id` der Session begrenzt.
- Fehlerantworten ohne Stacktraces oder interne Details; Logs ohne Passwörter, Tokens, Sessions.

**Konfiguration & Ablage**
- `.env` und PHP-Code außerhalb des Webroots; `display_errors=Off` in Produktion.
- Keine Geheimnisse im Repo, nur `.env.example`.
- Abhängigkeiten fixiert, regelmäßig prüfen (`npm audit`, `composer audit`).

**Externe Dienste**
- Open Food Facts nur serverseitig, mit Timeout, Größenlimit, Antwortvalidierung und Cache. Übermittelt wird nur Barcode bzw. Suchbegriff.

**Datenschutz**
- Server in Deutschland. Ernährungsdaten sind gesundheitsnah: Datensparsamkeit, keine Tracker, keine externen CDNs, Schriften selbst gehostet.

## Audit-Log

Nach **jedem** Implementierungsschritt mit `agent-skills:security-and-hardening` prüfen und hier eintragen.

| Datum | Schritt (Roadmap-ID) | Umfang | Funde | Maßnahmen | Status |
|---|---|---|---|---|---|
| – | – | – | – | – | – |
