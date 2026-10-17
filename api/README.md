# api/

PHP-REST-API (PHP 8.3, MariaDB 10.11). Architektur siehe `docs/ARCHITECTURE.md`, Deployment siehe `docs/DEPLOYMENT.md`.

## Lokal (DDEV)

```
ddev start                  # einmalig mit sudo-Abfrage (Hosts-Eintrag)
ddev composer install
ddev composer check         # PHPCS (PSR-12), PHPStan (max + strict), PHPUnit
curl -k https://primed.ddev.site/api/v1/health
```

`api/.env` (nicht im Repo) enthält die lokalen Werte; Vorlage `.env.example`. Integrationstests nutzen die Datenbank `db_test` (wird beim Start von DDEV angelegt) und werden außerhalb von DDEV übersprungen.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `public/index.php`, `public/.htaccess` | Front-Controller, wird nach `httpdocs/api/` deployt |
| `bootstrap.php` | Fehlerbehandlung, Autoloader, Config; liegt außerhalb des Webroots neben `.env` |
| `src/Http/` | Request, Response, Router, HttpException |
| `src/Config/` | strenger `.env`-Parser, Config |
| `src/Log/` | JSON-Zeilen-Logger mit Schwärzung sensibler Felder (`var/log/app.log`) |
| `src/Database/` | PDO-Factory (Exceptions, echte Prepared Statements, UTC, strict SQL mode) |
| `src/App.php`, `src/Kernel.php` | Dispatch, sichere Fehlerantworten, Routen |
