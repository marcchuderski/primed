# Betrieb (Admin-Doku)

Für den Betreiber von Primed. Einrichtung und Releases stehen Schritt für Schritt in [`DEPLOYMENT.md`](DEPLOYMENT.md); hier steht, was im laufenden Betrieb anfällt. Sicherheitsvorgaben: [`SECURITY.md`](SECURITY.md).

## Überblick

| Teil | Ort auf dem Server | Inhalt |
|---|---|---|
| App (Frontend) | `httpdocs/` | Inhalt von `frontend/dist/` inkl. `.htaccess`, `sw.js`, `manifest.webmanifest`, `pwa/`, `assets/` |
| API-Einstieg | `httpdocs/api/` | nur `index.php` und `.htaccess` aus `api/public/` |
| API-Code | `primed-app/` (neben `httpdocs/`, nicht darin) | `src/`, `vendor/`, `bin/`, `resources/`, `bootstrap.php`, `.env` (Rechte `600`), `var/log/` |
| Datenbank | MariaDB 10.11 | App-User `primed_app` nur mit `SELECT, INSERT, UPDATE, DELETE` |

PHP-CLI auf dem Server immer mit vollem Pfad: `/opt/plesk/php/8.3/bin/php`. Alle Befehle unten laufen per SSH im Verzeichnis oberhalb von `primed-app/`.

## User verwalten (CLI)

Eine Registrierung im Web gibt es nicht; Konten legt nur der Betreiber an (D-063, D-079).

| Aufgabe | Befehl | Hinweis |
|---|---|---|
| Username | wird nur beim Anlegen vergeben und ist danach **fest** (D-152); auch per CLI nicht änderbar. | – |
| User anlegen (Freund) | `/opt/plesk/php/8.3/bin/php primed-app/bin/user-create.php` | fragt Username und Display-Name; erzeugt ein **zufälliges Startpasswort**, das einmalig angezeigt wird. Sicher übergeben (persönlich oder Messenger mit Ende-zu-Ende-Verschlüsselung, nicht per E-Mail). |
| User mit eigenem Passwort | `… user-create.php --set-password` | Passwort verdeckt eingeben (mind. 12 Zeichen, keine häufigen Passwörter). |
| Betreiber-Konto | `… user-create.php --set-password --owner-defaults` | zusätzlich die persönliche Wochenvorlage (D-080). |
| Startdaten nachrüsten | `… user-seed.php [--owner-defaults]` | nur für User ohne Tagesarten/Wochenvorlage. |
| Passwort zurücksetzen | `… user-password.php [--set-password]` | ohne Option zufälliges Passwort; **beendet alle Sessions** des Users. |
| Konto löschen | in der App: Menü › Profil › Konto löschen (mit Passwort) | löscht alle Daten des Users. Einen CLI-Befehl dafür gibt es nicht; ein direktes `DELETE FROM users` in phpMyAdmin scheitert an der Wochenvorlage (Fremdschlüssel `RESTRICT`) und ist nicht vorgesehen. |

Löschwunsch eines Users, der sein Passwort nicht mehr kennt: `user-password.php` ausführen, mit dem neuen Passwort anmelden (gemeinsam oder durch den User) und unter Menü › Profil › Konto löschen.

Ein User hat sein Passwort vergessen: `user-password.php` ausführen, neues Passwort sicher übergeben. Der User kann es danach unter Menü › Profil selbst ändern.

## Migrationen

- Dateien `api/migrations/NNN_*.sql`, immer **in Reihenfolge** und **nach einem DB-Backup** über phpMyAdmin (SQL-Tab, Dateiinhalt einfügen) oder mit dem zweiten DB-User mit DDL-Rechten.
- Jede Migration trägt sich in `schema_migrations` ein. Stand: `SELECT * FROM schema_migrations ORDER BY version;`
- Erster Deploy: `001` bis `011` nacheinander. Ausgeführte Migrationen in der Tabelle in `DEPLOYMENT.md` nachtragen.

## Backups und Wiederherstellung

- Tägliches Datenbank-Backup in Plesk (Einrichtung siehe `DEPLOYMENT.md`). Vor jedem Release zusätzlich ein manuelles Backup.
- Dateien (`httpdocs/`, `primed-app/`) lassen sich jederzeit aus dem Repo neu bauen; nur `primed-app/.env` ist einmalig. Eine Kopie der `.env` gehört in einen Passwort-Manager, **nicht** ins Repo.
- Wiederherstellen: Backup in Plesk zurückspielen; danach in der App einmal ab- und anmelden.

## Logs

- `primed-app/var/log/app.log`: JSON-Zeilen mit Fehlern und Sicherheitsereignissen (Login ok/fehlgeschlagen, Sperre, Logout überall, Passwortwechsel). Passwörter, Tokens, Cookies und Schlüssel werden geschwärzt; IPs stehen nur als kurzes HMAC-Präfix (`ip`) drin, Datenbankfehler nur als SQLSTATE.
- Es gibt keine automatische Rotation. Gelegentlich prüfen (`ls -lh primed-app/var/log/`) und bei Bedarf archivieren oder leeren; höchstens 90 Tage aufbewahren (SECURITY.md).
- Auffälligkeiten: viele `login_failed` für einen Username oder viele Sperren → Passwort des Users zurücksetzen, ggf. betroffene IP-Bereiche in Plesk sperren.
- Login-Versuche in der DB werden nach 30 Tagen, abgelaufene Sessions beim Login, Open-Food-Facts-Cache nach 30 Tagen automatisch gelöscht.

## Sicherheitsprüfung im Betrieb

- Nach jedem Release: `scripts/check-headers.sh https://primed.dev-pfeffermond.de` (Header auf Seite und Assets, CSP, HSTS, PWA-Dateien, HTTPS-Weiterleitung, keine Dotfiles erreichbar). Schlägt der Asset-Teil fehl, liefert nginx statische Dateien direkt aus (siehe `DEPLOYMENT.md`, Einrichtung Punkt 7).
- Vor jedem Release lokal: `npm audit` (Frontend) und `composer audit` (API); Funde nach `SECURITY.md` bewerten.
- `APP_KEY` wechseln (z. B. nach Verdacht auf Leck): neuen Wert in `.env` eintragen. Folge: bestehende CSRF-Tokens werden ungültig (Seite neu laden genügt), die IP-HMACs der Login-Versuche passen nicht mehr (unkritisch). Sessions bleiben gültig; alle User abmelden geht per `UPDATE sessions SET revoked_at = NOW() WHERE revoked_at IS NULL;`.
- DB-Passwort wechseln: in Plesk ändern, dann `DB_PASS` in der `.env` anpassen.

## Störungen

| Symptom | Ursache / Abhilfe |
|---|---|
| Weißer Bildschirm oder alte Version nach einem Release | Service Worker liefert die alte Shell: App einmal schließen und neu öffnen. Hilft das nicht, `assets/` vollständig ersetzt? Notfall: Service Worker abschalten (Anleitung in `DEPLOYMENT.md`, „Jedes Release“ Punkt 5). |
| API antwortet mit 500 | `primed-app/var/log/app.log` lesen; häufig: `.env` fehlt/falsch, `var/log/` nicht schreibbar, Migration fehlt. |
| Login immer „falsch“, obwohl richtig | Rate-Limit greift (15 min warten) oder Passwort per CLI zurücksetzen. |
| Barcode-/Online-Suche liefert nichts | Open Food Facts nicht erreichbar oder Rate-Limit; `OFF_CONTACT_EMAIL` in der `.env` gesetzt? Manuelle Eingabe funktioniert weiter. |
| Kamera startet nicht | nur über HTTPS und mit Kamera-Freigabe im Browser; im iPhone unter Einstellungen › Safari › Kamera. |
