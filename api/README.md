# api/

PHP-REST-API (PHP 8.3, MariaDB 10.11). Architektur siehe `docs/ARCHITECTURE.md`, Deployment siehe `docs/DEPLOYMENT.md`.

## Lokal (DDEV)

```
ddev start                  # einmalig mit sudo-Abfrage (Hosts-Eintrag)
ddev composer install
ddev composer check         # PHPCS (PSR-12), PHPStan (max + strict), PHPUnit
curl -k https://primed.ddev.site/api/v1/health
```

`api/.env` (nicht im Repo) enthält die lokalen Werte; Vorlage `.env.example`. Integrationstests nutzen die Datenbank `db_test` (wird beim Start von DDEV angelegt) und werden übersprungen, wenn keine Test-DB erreichbar ist.

### Tests ohne DDEV

Optionale `api/.env.testing` (nicht im Repo) überschreibt die DB-Verbindung für Tests, z. B. für einen Container aus dem DDEV-Image:

```
docker run -d --name primed-test-db --user "$(id -u):$(id -g)" -p 127.0.0.1:33306:3306 ddev/ddev-dbserver-mariadb-10.11:v1.25.2
docker exec primed-test-db mysql -uroot -proot -e "CREATE DATABASE db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON db_test.* TO 'db'@'%';"
# .env.testing: DB_HOST=127.0.0.1, DB_PORT=33306, DB_USER=db, DB_PASS=db, DB_TEST_NAME=db_test
vendor/bin/phpunit
```

## Admin-CLI

| Befehl | Zweck |
|---|---|
| `php bin/migrate.php [--test]` | ausstehende Migrationen anwenden |
| `php bin/user-create.php [--set-password] [--owner-defaults]` | User mit Startdaten anlegen (Standard: zufälliges Startpasswort, einmalig angezeigt) |
| `php bin/user-password.php [--set-password]` | Passwort zurücksetzen, alle Sessions beenden |
| `php bin/user-seed.php [--owner-defaults]` | Startdaten für einen bestehenden User ohne Tagesarten |

## Aufbau

| Pfad | Inhalt |
|---|---|
| `public/index.php`, `public/.htaccess` | Front-Controller, wird nach `httpdocs/api/` deployt |
| `bootstrap.php` | Fehlerbehandlung, Autoloader, Config; liegt außerhalb des Webroots neben `.env` |
| `src/Http/` | Request, Response, Router, HttpException |
| `src/Config/` | strenger `.env`-Parser, Config |
| `src/Log/` | JSON-Zeilen-Logger mit Schwärzung sensibler Felder (`var/log/app.log`) |
| `src/Database/` | PDO-Factory (Exceptions, echte Prepared Statements, UTC, strict SQL mode) |
| `src/Auth/` | Login, Sessions, Rate-Limit, CSRF, Passwort-Regeln |
| `src/Cli/` | Admin-CLI-Logik |
| `src/App.php`, `src/Kernel.php` | Dispatch, Origin-Prüfung, sichere Fehlerantworten, Routen |
| `migrations/` | SQL-Migrationen |
| `resources/` | Liste häufiger Passwörter |
