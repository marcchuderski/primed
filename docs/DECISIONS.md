# Entscheidungslog

Format: **ID · Titel** – Entscheidung · Begründung · verworfene Alternativen · entschieden von · Datum.
Neue Einträge unten anhängen. Getroffene Entscheidungen werden nicht gelöscht, sondern bei Bedarf durch einen neuen Eintrag ersetzt („ersetzt D-0xx“).

## Produkt

**D-001 · Keine KI im MVP** – Alle Berechnungen und Vorschläge regelbasiert. · Sollwerte, Checkpoints und Shake-Logik sind feste Regeln; schneller, kostenlos, nachvollziehbar, kein API-Key nötig. · Gemini/LLM für Makroberechnung und Empfehlungen (später optional). · Nutzer · 2026-10-16

**D-002 · Keine Mahlzeiten-Slots** – Einträge nur mit Uhrzeit, Tagesliste chronologisch. · Für den Nutzer zählt der Tag; Zeit wird nur für Checkpoints gebraucht. · Frühstück/Mittag/Abend-Gliederung. · Nutzer · 2026-10-16

**D-003 · Keine gespeicherten Kombis** – stattdessen letzte Menge vorausgefüllt. · Kombis variieren ständig (Brötchenart, Menge). · Kombis, „Wie letztes Mal“-Button. · Nutzer · 2026-10-16

**D-004 · Meal Prep als Vorrat, nicht in der Bibliothek** – Gerichte leben im Vorrat mit Portionszähler, danach Archiv. Keine Wiederverwendung als Vorlage, kein Vorab-Planen. · Jedes Kochen ist anders; Bibliothek bleibt sauber. · „Von letztem Mal übernehmen“, Wochenplanung. · Nutzer · 2026-10-16

**D-005 · Nur Tagesarten, keine Trainingsarten** – Tag = Tagesart + Uhrzeit + Dauer; zwei Einheiten = Intensiv. · Für die Rechnung ist nur Intensität und Zeit relevant. · Separater Trainings-Screen mit Trainingsarten. · Nutzer · 2026-10-16

**D-006 · Wochenvorlage** – Standard-Tagesart pro Wochentag setzt den Tag automatisch. · Spart tägliches Einstellen. · Jeden Tag manuell setzen. · Nutzer · 2026-10-16

**D-007 · Spieltag = Intensiv** – keine eigene Tagesart. · gleicher Bedarf. · eigene Sollwerte. · Nutzer · 2026-10-16

**D-008 · Tagesarten-Werte** – Normal Basketball 2.600 kcal; Ruhetag auf 2.000 kcal gesenkt (leichtes Defizit an Ruhetagen bei 150 g Protein). · Muskelerhalt bei langsamer Fettreduktion. · Ruhetag 2.100 kcal. · Nutzer · 2026-10-16

**D-009 · Bewertung nur über kcal ±5 %** – drei Zustände im Rahmen / unter / über; unter ist kein Fehler. · Kern ist die Bilanz; Defizit ist gewollt. · Ampel mit Protein/kcal/KH-Toleranzen (knapp/daneben). · Nutzer · 2026-10-16

**D-010 · Wochentabelle mit Summenspalte** – letzte Spalte Σ Woche. · Nutzerwunsch. · – · Nutzer · 2026-10-16

**D-011 · Produkt anlegen als Stepper-Liste** – alle Werte auf einem Screen mit −/+ und eigener Schrittweite. · Am wenigsten tippen, kein „Weiter“. · Schritt-für-Schritt-Wizard, Lineal-Eingabe. · Nutzer · 2026-10-16

**D-012 · Uhrzeit im 15-Minuten-Raster per Scroll-Rad** · schnell, ausreichend genau. · freie Minuteneingabe. · Nutzer · 2026-10-16

**D-013 · Vorschläge auf Abruf (Zauberstab)** statt dauerhafter Vorschlagskarte. · Dashboard bleibt minimal. · Vorschlagskarte auf Heute, Vorschläge im „+“-Sheet. · Nutzer · 2026-10-16

**D-014 · Verworfene Funktionen** – Foto der Nährwerttabelle, Foto mehrerer Packungen, Export, Schlafenszeit. · nicht benötigt. · Nutzer · 2026-10-16

## Design

**D-020 · Name „Primed“**, Logo P mit ¾-Fortschrittsring, Wortmarke kleingeschrieben. · P = Primed + Protein. · Rebound, Prepped, Shotclock u. a. · Nutzer · 2026-10-16

**D-021 · Light „Sand & Glut“, Dark „Night Court“**, weiche Übergänge. · nach mehreren Runden ausgewählt. · Scoreboard, Lavendel, Petrol, Kobalt, Sorbet, Glas, Glow, Terrakotta, Riso, Kirsche. · Nutzer · 2026-10-16

**D-022 · Theme folgt Gerät, Schalter im Menü überschreibt** (System/Hell/Dunkel). · Nutzer · 2026-10-16

**D-023 · Statusfarben aus der Terrakotta-Familie** (Oliv/Ocker/Altrosa, transparent). Orange nie für Fehler. · Orange ist positive Markenfarbe; Motivation. · Grün/Gelb/Rot-Ampel, Orange für „über Soll“. · Nutzer · 2026-10-16

**D-024 · Navigation als Text-Tabs oben**, Fokus auf Heute. · Nutzer · 2026-10-16

**D-025 · Nur Balken, kein Tageskreis**; Trainings-Marker im Balken, Details per Tap-Pop-up. · minimalistisch. · Ring/Tageskreis, zwei Balkenblöcke. · Nutzer · 2026-10-16

**D-026 · Icon-Set Lucide** · Nutzer · 2026-10-16

## Technik

**D-030 · Hosting auf eigenem Plesk-Webspace in Deutschland** – statisches Frontend + PHP-API + MySQL/MariaDB. · vorhandene Infrastruktur, Datenschutz. · Supabase, eigener Node-Server. · Nutzer · 2026-10-16

**D-031 · Zugangsdaten in `.env` außerhalb des Webroots** · Nutzer (Ort: Empfehlung) · 2026-10-16

**D-032 · Login: Passwort, 30 Tage Session** (serverseitig, widerrufbar, „Überall abmelden“). · Komfort. · Passkey/2FA, kürzere Sessions, Mittelweg mit Re-Auth. · Nutzer · 2026-10-16

**D-033 · Nur online, kein Offline-Modus** · einfacher, weniger Fehlerquellen. · Offline + Sync. · Nutzer · 2026-10-16

**D-034 · Deployment manuell: lokal bauen, SFTP** (kein unverschlüsseltes FTP). · Plesk Git, GitHub Actions. · Nutzer · 2026-10-16

**D-035 · Open Food Facts nur über die eigene API** (User-Agent, Cache, keine direkte Browser-Anfrage). · OFF-Vorgaben, Datenschutz, CSP. · direkter Browser-Zugriff. · Empfehlung, ohne Trade-off · 2026-10-16

**D-036 · Nährwert-Schnappschüsse in Einträgen** · Vergangenheit bleibt stabil. · Live-Referenz auf Produkt. · Empfehlung, ohne Trade-off · 2026-10-16

**D-037 · Schriften selbst hosten** · Datenschutz (keine IP-Übertragung an Google), strengere CSP. · Google Fonts CDN. · Empfehlung, ohne Trade-off · 2026-10-16

**D-038 · Fachlogik als reine Funktionen in `frontend/src/domain/`** mit Unit-Tests. · testbar, UI-unabhängig. · Empfehlung · 2026-10-16

## Klärung offener Punkte (2026-10-17)

**D-040 · Proteinpulver als Einstellung** – „Aktuelles Proteinpulver“ wählt ein Bibliotheksprodukt; Shakes werden aus Milch + Pulver automatisch berechnet. Standard: ESN Designer Whey, Milk Chocolate. · Pulver wechselt gelegentlich, Werte sollen nicht doppelt gepflegt werden. · feste Shake-Werte. · Nutzer · 2026-10-17

**D-041 · Milch als Bibliothekseintrag** – Milch 1,5 % / 3,5 % mit den Default-Werten als Richtwerte in der Bibliothek. · Defaults passen. · eigene Markenprodukte. · Nutzer · 2026-10-17

**D-042 · Basis pro 100 ml und Einheit ml** – Jedes Produkt hat genau eine Basis (100 g, 100 ml oder Stück); ml nur bei ml-Basis; keine g↔ml-Umrechnung. · Packungsangaben bei Flüssigkeiten sind pro 100 ml; Fehler g=ml wäre ~3 % (Milch) bis ~8 % (Öl). · g für alles (einfacher, ungenauer), Umrechnung über Dichte. · Nutzer · 2026-10-17

**D-043 · Richtwerte aus dem BLS** – 14 Lebensmittel aus `DEFAULTS.md`, Werte aus dem Bundeslebensmittelschlüssel, Lizenz wird vor Nutzung geprüft. · deutsche Referenzdaten. · USDA, eigene Handliste. · Nutzer · 2026-10-17

**D-044 · Bilanz-Einordnung** – ±5 % ausgeglichen, −5 bis −15 % leichtes Defizit, < −15 % Defizit, +5 bis +10 % leichter Überschuss, > +10 % Überschuss; Basis ist die prozentuale Abweichung der Summe vom Soll des Zeitraums. · konsistent zur Toleranz. · absolute kcal-Schwellen. · Nutzer · 2026-10-17

**D-045 · Protein-Standard mit Abweichung je Tagesart** – ein Standardwert (150 g), Tagesarten optional abweichend, Fallback immer Standard. · flexibel ohne Pflegeaufwand. · fester Wert je Tagesart, überall 150 g. · Nutzer · 2026-10-17

**D-046 · Halbe Portionen aus dem Vorrat** – Schritte 0,5, Zähler nie < 0, Korrektur bei Löschen/Ändern, „Rest entsorgen“, Gerichte immer editierbar (auch Portionsanzahl). · Portionen werden teils geteilt oder abgegeben. · nur ganze Portionen, Sperre nach erstem Eintrag. · Nutzer · 2026-10-17

**D-047 · „Jetzt“ auf die nächste Viertelstunde** · Nutzerwunsch. · auf die letzte Viertelstunde. · Nutzer · 2026-10-17

**D-048 · Tagesgrenze 02:00** – Einträge bis 01:59 zählen zum Vortag, Zeitzone Europe/Berlin. · Shakes nach späten Spielen gehören zum Trainingstag. · Kalendertag (Mitternacht), 03:00. · Nutzer · 2026-10-17

**D-049 · Nur heute und Vergangenheit** – keine Einträge für zukünftige Tage. · kein Vorab-Planen. · Nutzer · 2026-10-17

**D-050 · Tagesarten frei verwaltbar** – anlegen, bearbeiten, löschen; die fünf Defaults sind nur Startbestand. Vergangene Tage behalten ihren Schnappschuss. · ersetzt die Annahme „fünf feste Stufen“ aus dem Menü-Mockup. · feste fünf Tagesarten. · Nutzer · 2026-10-17

**D-051 · Einstellungsänderungen gelten ab heute** – vergangene Tage bleiben immer fest (Soll-Schnappschuss), auch bei geänderter Wochenvorlage. · Verlauf bleibt stabil. · rückwirkende Neuberechnung. · Nutzer · 2026-10-17

**D-052 · Löschen mit Bestätigungsdialog** · Schutz vor Fehlbedienung beim Wischen. · Undo-Toast, sofort löschen. · Nutzer · 2026-10-17

**D-053 · Bibliotheks-Details** – im Meal-Prep-Editor gescannte Produkte werden Zutat; gelöschte Produkte verschwinden aus Suche/Bibliothek, Einträge bleiben; OFF-Suche DE/Deutsch, max. 10 Treffer, ODbL-Hinweis; „Häufig um diese Zeit“: 5 häufigste, absteigend, ohne Shakes (Fenstergröße offen). · Nutzer · 2026-10-17

**D-054 · Checkpoint-Grenzen** – frühester Trainingsbeginn 09:00, frühester Checkpoint 06:00; läge er früher, entfällt er. · unrealistische Checkpoints vermeiden. · Checkpoint auf 07:00 verschieben. · Nutzer · 2026-10-17

**D-055 · Shake-Regel-Details** – „viele KH offen“ = ≥ 400 kcal aus KH (≥ 100 g KH); „nach dem Training“ ab Start + Dauer; bei mehreren passenden Regeln hat Protein Vorrang (Reihenfolge in Phase 5). „Für später merken“ entfällt. · Nutzer (Auslegung „400 kcal aus KH“: Claude, da die Zeile bereits ≥ 700 kcal gesamt voraussetzt; Bestätigung in Phase 5) · 2026-10-17

**D-056 · Verlauf-Details** – Tage ohne Einträge: „/“, ausgegraut, nicht in Bewertung/Durchschnitt/Summe; laufender Tag „läuft“, bewertet ab Folgetag; KW nach ISO 8601. · Nutzer · 2026-10-17

**D-057 · Mockups nur Beispiele** – Zahlen in den Screens sind Beispieldaten, maßgeblich sind BRIEFING/DEFAULTS. Screens ohne Mockup baut Claude aus vorhandenen Bausteinen und zeigt Screenshots. · Nutzer · 2026-10-17

## Sicherheit & Betrieb (2026-10-17)

**D-060 · Session gleitend 30 Tage, maximal 90 Tage** (ersetzt Laufzeit-Detail aus D-032). · Kompromiss: tägliche Nutzung ohne Re-Login, gestohlene Sessions laufen spätestens nach 90 Tagen aus. · fest 30 Tage, unbegrenzt gleitend. · Nutzer · 2026-10-17

**D-061 · Login-Schutz kombiniert** – IP+Username 5/15 min → 15 min Sperre; Username ab 10 Fehlversuchen steigende Verzögerung (keine harte Sperre, damit kein gezieltes Aussperren); IP 30/h. IPs nur als HMAC mit Schlüssel aus `.env`, Löschung nach 30 Tagen. · Nutzer (HMAC/Löschfrist: Claude, sicherere Variante) · 2026-10-17

**D-062 · Passwort-Regeln** – mindestens 12 Zeichen, keine Zeichenregeln, Abgleich mit lokaler Liste häufiger Passwörter (NIST SP 800-63B). · kein externer Dienst. · HIBP-Abgleich, nur Mindestlänge. · Nutzer · 2026-10-17

**D-063 · Kein „Passwort vergessen“, User-Verwaltung per CLI** – `bin/user-create` (und Passwort-Reset) per SSH mit `/opt/plesk/php/8.3/bin/php`. · keine Mail-Infrastruktur, keine öffentliche Angriffsfläche. · Reset per E-Mail, Setup-Seite. · Nutzer · 2026-10-17

**D-064 · „Überall abmelden“ als Textlink unter „Abmelden“** · Nutzer · 2026-10-17

**D-065 · Loading-Screen läuft einmal komplett (~1,4 s)** · Markenmoment; Animation gegenüber Mockup (1,8 s) leicht gekürzt. · nur während Session-Prüfung, 0,8 s Minimum. · Nutzer · 2026-10-17

**D-066 · Server** – PHP 8.3.8, MariaDB 10.11.4, SSH ohne Composer (vendor/ wird lokal gebaut und hochgeladen), Domain `primed.dev-pfeffermond.de`, Argon2id verfügbar. HSTS 1 Jahr ohne `preload`. · Nutzer (HSTS-Details: Claude) · 2026-10-17

**D-067 · Lokale Entwicklung mit DDEV und nvm** – DDEV mit PHP 8.3 + MariaDB 10.11 + Apache (wie Produktion, `.htaccess` greift lokal); Node 22 über `.nvmrc`. · Parität zur Produktion. · eigenes docker compose, Homebrew-MySQL. · Nutzer · 2026-10-17

**D-068 · Deployment durch den Nutzer** – Claude bereitet Release-Paket und Anleitung vor, der Nutzer lädt hoch und führt Migrationen aus. Backups richtet der Nutzer in Plesk ein. · kein Schreibzugriff von Claude auf den Live-Server. · SSH-Zugriff für Claude. · Nutzer · 2026-10-17

**D-069 · Zielgerät iPhone (Chrome/PWA)** – Barcode-Scan über ZXing, da iOS-Browser (WebKit) keine BarcodeDetector-API haben. · Nutzer · 2026-10-17

**D-070 · Arbeitsweise** – Plan für alle Phasen freigegeben; Claude arbeitet Schritt für Schritt durch und hält nur bei neuen Trade-offs, kritischen Security-Funden oder Nutzer-Aufgaben an. Direkt auf `main`, nur Commits, kein Push. · Nutzer · 2026-10-17

**D-071 · Admin- und Nutzer-Doku zum Abschluss** – inkl. PWA-Installation (Screenshot vom Nutzer); kein eigener Installations-Hinweis in der App. · Nutzer · 2026-10-17

## Umsetzung

**D-072 · Frontend-Werkzeuge (0.2)** – Vite 8, React 19, **TypeScript 6.0.3** (nicht 7: typescript-eslint unterstützt nur < 6.1), ESLint 10 mit `strictTypeChecked` + `stylisticTypeChecked`, Prettier, Vitest 5 + jsdom, Testing Library (React, jest-dom, user-event) für Komponententests, `@types/node` 22. Alle Versionen exakt fixiert, Install-Skripte blockiert. Zusätzliche TS-Strenge: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. · Standardwerkzeuge, gut gepflegt; Testing Library prüft Komponenten über Rollen (Barrierefreiheit). · Jest, Biome statt ESLint/Prettier. · Claude · 2026-10-17

**D-073 · Haushaltsmaße global fest, Einheiten-Wahl bei der Mengeneingabe** – Produkte haben eine Basis (100 g / 100 ml / Stück) und eine Packungsgröße in deren Einheit, aber **keine** eigenen Haushaltsmaße. Global gilt fest im Code 1 EL = 15 g/ml, 1 TL = 5 g/ml. Bei Menge (Essen) und Zutat (Meal Prep) gibt es einen Einheiten-Umschalter g · ml · EL · TL · Packung; aktiv nur, was zur Basis passt (Stück: Stück · Packung). Umrechnungszeile unter der Zahl, Schnellwahl passend zur Einheit. Schnappschuss aus der umgerechneten Menge (g/ml), Menge + Einheit wie eingegeben werden mitgespeichert. Screens 06/07 ersetzt, 17 und 18 neu. · weniger Pflegeaufwand beim Anlegen, Einheit dort wählen, wo gegessen wird; Ungenauigkeit (Öl ~13–14 g/EL) bewusst akzeptiert. · Haushaltsmaße pro Produkt (ersetzt diesen Teil von D-042/A6), Einstellung für EL/TL. · Nutzer · 2026-10-17

**D-074 · API ohne Framework** – eigener schlanker Router, Request/Response, `.env`-Parser und Logger statt Slim/Symfony/phpdotenv/Monolog. Keine Laufzeit-Abhängigkeiten in Produktion. · kleine, vollständig getestete Angriffsfläche; keine Fremdpakete auf dem Server, die gepflegt werden müssen; `.env`-Werte landen nicht in `$_ENV`/`getenv`. · Slim 4, Symfony-Komponenten, vlucas/phpdotenv. · Claude · 2026-10-17

**D-075 · API-Werkzeuge** – PHPUnit 12 (13 braucht PHP 8.4, Server hat 8.3; Composer-Plattform auf 8.3.8 gepinnt), PHPStan Level max + strict-rules, PHP_CodeSniffer 4 (PSR-12 + verbotene Funktionen wie `eval`, `exec`, `var_dump`). · Standardwerkzeuge, strengste Prüfung. · Psalm, PHP-CS-Fixer. · Claude · 2026-10-17

**D-076 · Lokale Struktur in DDEV** – Docroot `frontend/dist` (Build), Apache-Alias `/api` → `api/public` wie in Produktion; Test-Datenbank `db_test` per Hook. Der Front-Controller findet `bootstrap.php` über zwei feste Pfade (Produktion `../../primed-app/`, Repo `../`). · gleiche URL-Struktur und `.htaccess`-Wirkung wie auf Plesk. · Claude · 2026-10-17

**D-077 · Styling mit CSS-Modulen, Tokens direkt aus `design/`** – Komponenten-Styles als CSS-Module (in Vite eingebaut, keine Laufzeit, CSP-freundlich); `design/tokens.css` wird direkt importiert statt kopiert (eine Quelle). Fehlende Mockup-Farben als Tokens ergänzt: `--input-border`, `--ring-track` (Werte 1:1 aus Login-/Loading-Mockup). · keine zusätzliche Abhängigkeit, keine Duplikate. · Tailwind, CSS-in-JS, Kopie mit Sync-Skript. · Claude · 2026-10-17

**D-078 · Schriften über `@fontsource-variable`** – Bricolage Grotesque (Achsen opsz + wght, wie im Mockup) und Inter (wght), nur Latin + Latin Extended, eigene `@font-face` mit den Familiennamen aus `tokens.css`. · gepflegte npm-Pakete mit OFL-Lizenz, Dateien werden mitgebündelt (D-037). · manuell heruntergeladene Dateien. · Claude · 2026-10-17

## Multi-User (2026-10-17)

**D-079 · Freunde als weitere User** – Accounts nur per CLI (`bin/user-create`) durch den Betreiber; Startpasswort wird vom Betreiber vergeben, **ohne** Pflicht zur Änderung beim ersten Login. · einfacher Ablauf. · Änderungspflicht (empfohlen), Einmal-Link. · Nutzer · 2026-10-17 · Hinweis: Der Betreiber kennt das Startpasswort, bis der User es selbst ändert; die Nutzer-Doku empfiehlt das Ändern.

**D-080 · Startdaten neuer User** – Vorlage ohne persönliche Daten: die fünf Tagesarten mit den Default-Sollwerten, leere Wochenvorlage (alles Ruhetag), Shakes, Milch, Richtwerte, Standard-Proteinpulver; keine Markenprodukte des Betreibers. Der erste User (`marcch`) bekommt zusätzlich Wochenvorlage und Startprodukte aus `DEFAULTS.md`. · Nutzer · 2026-10-17

**D-081 · Getrennte Bibliotheken** – jede Bibliothek gehört einem User (Richtwerte als Kopie je User); nur der OFF-Cache ist gemeinsam (nicht personenbezogen). · Nutzer · 2026-10-17

**D-082 · Konto selbst löschen** – in den Einstellungen, mit Bestätigungsdialog (unwiderruflich) **und** erneuter Passworteingabe; löscht alle Daten des Users (`ON DELETE CASCADE`). · Datenhoheit der Freunde; Schutz bei entsperrtem Gerät. · CLI-Löschung durch Betreiber, nur Dialog. · Nutzer · 2026-10-17

**D-083 · „Häufig um diese Zeit“: ±1,5 h** (3 h Fenster). · Nutzer · 2026-10-17

**D-084 · Migrationen als nummerierte SQL-Dateien** – nur vorwärts, jede Datei trägt sich in `schema_migrations` ein, damit `bin/migrate.php` (lokal/SSH) und phpMyAdmin (Produktion) denselben Stand führen. Eine Anweisung endet mit `;` am Zeilenende. · einfach, ohne Migrations-Framework, nachvollziehbar. · Phinx, Doctrine Migrations. · Claude · 2026-10-17

**D-085 · Integrationstests auch ohne DDEV** – optionale, nicht versionierte `api/.env.testing` zeigt auf eine Test-DB (z. B. Container aus dem DDEV-MariaDB-10.11-Image); Tests laufen zusätzlich unter PHP 8.3 im DDEV-Webserver-Image. · Produktionsparität (PHP 8.3, MariaDB 10.11) unabhängig vom DDEV-Start. · Claude · 2026-10-17

**D-086 · Zustandslose CSRF-Tokens** – Token = HMAC(abgeleiteter Schlüssel, Session-Token-Hash), Übertragung im Header `X-CSRF-Token`. · Session-Token liegt nur gehasht in der DB, trotzdem kann `/auth/me` das CSRF-Token nach einem Neuladen wieder ausliefern; keine zusätzliche Spalte. · Token in der DB, Double-Submit-Cookie. · Claude · 2026-10-17

**D-087 · Ein `APP_KEY`, abgeleitete Teilschlüssel** – ersetzt `IP_HASH_KEY`; IP-HMAC und CSRF nutzen getrennte, per HMAC abgeleitete Schlüssel. · ein Geheimnis zu verwalten, trotzdem Zweckbindung. · mehrere Einzel-Schlüssel. · Claude · 2026-10-17

**D-088 · Origin- und Content-Type-Prüfung für alle schreibenden Requests** (inkl. Login) zusätzlich zu SameSite=Strict und CSRF-Token. · Schutz vor Login-CSRF und Formular-Angriffen, Defense in Depth. · Claude · 2026-10-17

**D-089 · Liste häufiger Passwörter** – aus SecLists „100k-most-used-passwords-NCSC“ (MIT), nur Einträge ≥ 12 Zeichen, klein geschrieben (~1.200 Einträge, `api/resources/common-passwords.txt`); zusätzlich darf das Passwort den Username nicht enthalten. · lokal, kein externer Dienst (D-062). · HIBP-API. · Claude · 2026-10-17

**D-090 · Startpasswörter** – 4 Gruppen à 5 Zeichen aus einem Alphabet ohne verwechselbare Zeichen (~114 Bit), einmalig in der CLI angezeigt. · sicher und abtippbar. · Claude · 2026-10-17

**D-091 · Security-Header im Web-Root-`.htaccess`** – CSP `default-src 'none'` mit expliziten `'self'`-Quellen, HSTS 1 Jahr (`includeSubDomains`, ohne `preload`, betrifft nur `*.primed.dev-pfeffermond.de`), `Permissions-Policy` mit Kamera nur `self`, COOP/CORP `same-origin`, `index.html` `no-cache`, gehashte Assets `immutable`. Die API setzt zusätzlich eigene Header (`no-store`, CSP `default-src 'none'`). · strengste Konfiguration, die das App-Konzept zulässt. · Header nur in PHP. · Claude · 2026-10-17

**D-092 · Kein Test-Deployment in Phase 1** – Roadmap 1.5 verworfen; geprüft wird lokal mit DDEV (Apache, PHP 8.3, MariaDB 10.11) und `npm run dev`. · Nutzer · 2026-10-17

**D-093 · Frontend-Auth-Zustand** – Session nur im `HttpOnly`-Cookie, CSRF-Token nur im Speicher (nach Reload über `/auth/me`); Loading-Screen wartet auf `/auth/me` und mindestens 1,4 s (bei `prefers-reduced-motion` ohne Mindestzeit); Bildschirmwechsel mit 150-ms-Crossfade. · Claude · 2026-10-17

**D-094 · API-`.htaccess` per Rewrite statt `FilesMatch`** – existierende Dateien außer `index.php` → 403, alles andere → `index.php`. · `FilesMatch` sperrte auch virtuelle API-Pfade. · Claude · 2026-10-17

**D-095 · Logo-Lockup „P“ + „rimed“** – in allen Screens ersetzt das Zeichen das „p“ der Wortmarke (wie Screen 18), statt Zeichen + „primed“ nebeneinander. Komponente `LogoLockup`. · Nutzer · 2026-10-17

**D-096 · Kein Loading-Screen, Logo-Animation im Login** (ersetzt D-065) – Während der Session-Prüfung nur Hintergrund; ohne Session Login-Screen mit animiertem Lockup, danach blenden Text und Felder ein; mit Session direkt in die App. `prefers-reduced-motion`: alles sofort sichtbar (auch Animations-Verzögerungen werden aufgehoben). · Nutzer (Verhalten bei bestehender Session: Claude, ohne Wartezeit) · 2026-10-17

**D-097 · Claim im Login** – „Primed for performance.“ unter dem Logo-Lockup (Bricolage 800, 24 px, `--accent-text`), blendet mit dem Formular ein; nur auf dem Login-Screen. · Nutzer (Größe/Platzierung: Claude) · 2026-10-17

**D-098 · Feste Vergangenheit durch Materialisierung** – Tage werden beim Abruf angelegt; vor jeder Änderung an Tagesarten, Wochenvorlage oder Protein-Standard werden alle vergangenen Tage ohne Datensatz (seit Kontoanlage) mit den bisherigen Werten gespeichert, in derselben Transaktion. Heute wird immer aus den aktuellen Einstellungen berechnet (manuell gesetzte Tagesart bleibt). · erfüllt D-051 ohne Versionierung aller Einstellungen. · versionierte Einstellungen mit Gültigkeitsdatum, nächtlicher Job. · Claude · 2026-10-17

**D-099 · Tagesarten weich löschen** – `deleted_at`; vergangene Tage behalten Name und Sollwerte (Schnappschuss). Löschen nicht möglich, solange die Tagesart in der Wochenvorlage steht oder es die letzte ist; `is_training` einer in der Vorlage benutzten Tagesart ist nicht änderbar. · konsistente Vorlage, keine verwaisten Verweise. · Claude · 2026-10-17

**D-100 · Zeiten als Minuten seit Mitternacht** (Europe/Berlin, Wandzeit) für Training und später Einträge; Zeitstempel bleiben UTC. · einfach, DST-unabhängig für das 15-Minuten-Raster. · Claude · 2026-10-17

**D-101 · Situative Begrüßung** – regelbasierter Satz hinter „Hey, [Name].“ nach BRIEFING §4a (erste passende Regel gewinnt), reine Funktion mit Tests. Kein Spieltag-Satz; „Guten Morgen“ nur 02:00–11:00; bei erreichtem Protein-Soll im Standardfall „Protein-Soll erreicht. Stark gemacht.“; Kurzformen nur für die Start-Tagesarten. · Nutzer (Kurzform-Fallback und Komma nach „Hey“ wie im Mockup: Claude) · 2026-10-17

**D-102 · Fachlogik-Details (2.2)** – Checkpoint-Werte gerundet; „gegessen bis Checkpoint“ schließt Einträge genau zur Checkpoint-Zeit ein; kcal-Bewertung mit inklusiven ±5 %-Grenzen; Restzeit auf halbe Stunden gerundet (< 30 min „gleich“); offene Proteinmengen in der Begrüßung aufgerundet (nie „0 g“). · Claude · 2026-10-17

**D-103 · Heute-Screen-Details (2.3)** – Tagesart-Chip mit Lucide-Icon `Dumbbell` (Training) bzw. `Moon` (Ruhetag) statt des Ball-Pfads im Mockup (nur Lucide erlaubt, D-026); Pop-up an Ruhetagen zeigt „Heute: x von y · noch z“ (ohne Checkpoint); Tabs ohne Router-Bibliothek (Zustand in `AppShell`); Heute lädt neu, wenn während der Nutzung ein neuer logischer Tag beginnt. · Claude · 2026-10-17

**D-104 · Sheet und Scroll-Rad (2.4)** – Bottom-Sheets als natives modales `<dialog>` (Fokusfalle, Escape, inerter Hintergrund; Safari ≥ 15.4), Scrim und Sheet innerhalb des Dialogs gezeichnet (Tokens wirken auch in älteren Safari-Versionen, `::backdrop` erbt dort keine Variablen). Scroll-Rad mit CSS-Scroll-Snap, nicht zyklisch (Mockup zeigt „45“ über „00“), per Tastatur (Pfeile) und Tipp bedienbar. Wechsel auf eine Trainings-Tagesart ohne bisherige Zeit startet bei 18:00. · keine Abhängigkeit, barrierearm. · eigener Fokus-Trap, Wheel-Bibliothek. · Claude · 2026-10-17

**D-105 · Einträge (2.5)** – Zeit als Wandzeit-Minute im 15-Min-Raster; Sortierung nach logischer Minute (Einträge nach Mitternacht ans Tagesende), Anzeige neueste zuerst (Mockup). Bearbeiten skaliert den Schnappschuss nach Menge; Einheitenwechsel nutzt Basis/Packung des Produkts (auch wenn gelöscht). Startbibliothek: Milch 1,5 %/3,5 % für alle, die sechs Startprodukte nur mit `--owner-defaults`; Quarkcreme als „pro 100 g“ mit Packung 200 g. Mengen-Sheet (Screen 06) als gemeinsame Komponente für Bearbeiten und (ab 3.3) Hinzufügen; „Eintrag löschen“ zusätzlich im Sheet (barrierefreie Alternative zum Wischen). · Claude · 2026-10-17

**D-106 · Ruhetag fest im System** – `day_types.system_key = 'rest'` (eindeutig je User); nicht löschbar, Name und Art fix, Sollwerte änderbar. Bestehende Daten per Migration 004 zugeordnet. · eindeutige Identifikation (z. B. Begrüßung, Vorschläge). · Erkennung über den Namen. · Nutzer · 2026-10-17

**D-107 · Tagesart-Picker überarbeitet** – zusätzliche Dauer 30 min (API und UI), Dauer-Pills als 2×2-Raster in Höhe des Uhrzeit-Rads; bei gewählter Trainings-Tagesart nur Auswahl + „Auswahl ändern“, damit die Trainingszeit sichtbar wird. · Nutzer · 2026-10-17

**D-108 · KI-Fragebogen für Tagesarten und Richtwerte** – Einstellungen „Tagesarten & Sollwerte“ mit Hilfe-Zeile und Modal „Richtwerte ermitteln“ (Screens 19/20): Fragebogen aus `docs/RICHTWERTE-PROMPT.md` als Frontend-Konstante kopieren und in eine KI eigener Wahl einfügen; Ergebnis manuell eintragen. Keine Nutzerdaten in Text oder Links, keine Einbettung, CSP unverändert, Zwischenablage nur auf Klick. Gesundheits-Hinweis wörtlich im Modal und in der Nutzer-Doku. Offen: Link-Ziele (Vorbefüllung) und Logos – Nutzerentscheidung. · Nutzer · 2026-10-17

**D-109 · KI-Links nur auf Startseiten, ohne Logos** – „Dann einfügen in“ öffnet die Startseiten von ChatGPT, Claude, Copilot, Gemini; der Fragebogen wird vorher kopiert. Anzeige nur Name + Lucide ExternalLink. · einheitlich und robust (Vorbefüllung nur bei zwei Anbietern, teils undokumentiert, Auto-Submit-Risiko), keine Markenrechts-Prüfung, Icon-Regel (nur Lucide) bleibt. · Vorbefüllung per `?q=`, offizielle Logos. · Nutzer · 2026-10-17

**D-110 · Richtwerte und Proteinpulver ohne Einzelbestätigung** – Claude recherchiert die Nährwerte der 14 Richtwerte (Quelle BLS, sonst gleichwertige Referenz, jeweils dokumentiert) und des ESN Designer Whey Milk Chocolate und übernimmt sie direkt in den Seed; Werte bleiben in der App änderbar. Formulierungen unter 30 Minuten (Begrüßung) angepasst. · Nutzer · 2026-10-17

**D-111 · Kategorie „Grundnahrungsmittel“ (vorläufig)** – sechste Kategorie für BLS-Richtwerte ohne passende Kategorie (Hähnchen, Reis, Nudeln, Haferflocken, Öl, Butter, Ei). · Die fünf Kategorien decken diese nicht ab. · Zuordnung zu bestehenden Kategorien. · Claude, vom Nutzer bestätigt · 2026-10-17

**D-112 · OFF-Suche über search.openfoodfacts.org** – der Legacy-Endpunkt `cgi/search.pl` antwortet 503; Suche über den neuen Suchdienst (Lucene), Barcode weiter über `api/v2/product`. Begriffe werden auf Buchstaben/Ziffern reduziert, Länderfilter serverseitig. · im Live-Test festgestellt. · Claude · 2026-10-17

**D-113 · Startbibliothek idempotent** – `FoodSeeder` ergänzt fehlende Standard-Lebensmittel (nach Name) auch bei bestehenden Usern (`bin/user-seed.php`); Startprodukte des Betreibers nur beim ersten Seed. · Claude · 2026-10-17

**D-114 · Shakes als eigene Eintragsart** – Ein Shake ist ein Eintrag (`kind = shake`, ohne `food_id`) mit Schnappschuss aus Milch (Bibliothek) + aktuellem Proteinpulver; Zusammensetzung in `user_settings` (Milch-/Pulver-Produkt, 400/200 ml, 30 g), beim Seed verknüpft. Fehlt Milch oder Pulver (z. B. gelöscht), werden die Shake-Buttons ausgeblendet. Shakes zählen nicht zu „Häufig um diese Zeit“. · ein Eintrag pro Shake statt zwei; Werte folgen automatisch dem gewählten Pulver (D-040). · zwei Einzeleinträge, feste Shake-Werte. · Claude · 2026-10-17

**D-115 · Barcode-Bibliothek ZXing 0.21.3 / browser 0.1.5** – ältere, stabile Version statt 0.23 (verlangt Node ≥ 24 für die Entwicklung); lazy geladen, nur EAN-13/EAN-8/UPC-A/UPC-E, Prüfziffer clientseitig und serverseitig; manuelle Eingabe als Alternative. · iOS braucht eine JS-Bibliothek (D-069); kein Node-Upgrade nötig. · ZXing 0.23 + Node 24 (später möglich), BarcodeDetector (nicht auf iOS). · Claude · 2026-10-17

**D-116 · Hinzufügen-Ablauf (3.2–3.6)** – „+“ öffnet Suche/Schnell-Eintrag; Online-Produkte werden beim ersten Eintragen in die Bibliothek übernommen (Kategorie aus OFF, später änderbar); unbekannter Barcode → „Neues Produkt“ mit verknüpftem Barcode; Shakes mit einem Tipp zur aktuellen (aufgerundeten) Zeit; Nachtragen über „Tag“-Auswahl (heute bis 6 Tage zurück) im Mengen-Sheet. Markenname wird nur vorangestellt, wenn der Produktname ihn nicht enthält. Footer-Button „Scannen“ statt „Barcode scannen“ (Platz bei 390 px). · Claude · 2026-10-17

**D-117 · Essen-Tab-Bibliothek (3.7)** – Standard-Filter alle drei Typen (Punkt am Filter-Button, sobald eingeschränkt); Werte in der Liste für die zuletzt genutzte Menge, sonst je Basis; Tipp öffnet „Produkt bearbeiten“ (inkl. Typwechsel und Löschen mit Bestätigung); Quellenhinweis BLS/OFF unter der Liste. · Claude · 2026-10-17

**D-118 · „Gerichte“ und „Nochmal kochen“** (ersetzt den Teil „keine Wiederverwendung als Vorlage“ aus D-004) – Bereich heißt „Gerichte“ statt „Vorrat“. Archivierte Gerichte lassen sich über „Nochmal kochen“ als Vorlage öffnen (Name, Zutaten, Mengen vorausgefüllt) und als neues Gericht speichern (`based_on_dish_id`); das alte bleibt unverändert. Archiv weiterhin nicht in der Lebensmittel-Suche. „+“-Sheet unten: „Gericht zubereiten“ · „Produkt anlegen“. Großer Shake heißt „Groß 1,5 %“. · schneller bei ähnlichen Gerichten. · jedes Gericht neu anlegen. · Nutzer · 2026-10-17

**D-119 · Gericht-Zähler abgeleitet** – übrige Portionen = Portionen gesamt − Summe der Gericht-Einträge; Status (aktiv/archiviert/entsorgt) wird daraus berechnet. Eintragen nur in 0,5-Schritten und höchstens so viel wie übrig; Bearbeiten der Portionszahl nie unter die bereits gegessenen Portionen; Nährwerte pro Eintrag aus der Gesamtsumme × Portionen / Gesamtportionen (keine Doppelrundung). Gerichte bleiben editierbar, Einträge behalten ihren Schnappschuss. Tipp auf ein Gericht im „+“-Sheet öffnet die Menge (1 Portion, ½-Schritte) statt sofort einzutragen, damit halbe Portionen und Uhrzeit möglich sind. · kein Auseinanderlaufen des Zählers bei Löschen/Ändern. · gespeicherter Zähler. · Claude · 2026-10-17

**D-120 · Gerichte-Oberfläche (Phase 4)** – Essen-Tab startet auf „Gerichte“: Karten mit „x von y“ und Portions-Punkten (halbe Punkte für ½), Tipp = bearbeiten (mit „Rest entsorgen“), Archiv als Sheet mit „Nochmal kochen“. Editor: Zutaten per Suche (Bibliothek inkl. Zutaten/Richtwerte und Online) oder Scan; neu gescannte/online gewählte Produkte werden als Typ „Zutat“ gespeichert (D-053); Standardmenge ganze Packung, sonst 100 g/ml bzw. 1 Stück; Tipp auf Zutat ändert Menge oder entfernt sie; Portionen in ½-Schritten, nicht unter bereits gegessene. „+“-Sheet: Gerichte-Kacheln mit „x übrig“ öffnen die Menge in Portionen; „Gericht zubereiten“ öffnet den Editor und danach direkt das Eintragen. Beim Speichern rechnet der Server mit den aktuellen Produktwerten. · Claude · 2026-10-17

**D-121 · Reihenfolge der Shake-Regeln** – siehe BRIEFING §10: Protein-Lücke < 25 g → kein Shake; kcal überschritten → Klein 1,5 % nur ab 30 g; Training: davor kein Shake, währenddessen nichts, danach leichte Mahlzeit + kleiner Shake (≥ 700 kcal und ≥ 100 g KH offen) bzw. Groß (≥ 35 g P und ≥ 500 kcal) bzw. Klein; Ruhetag ab 19:00 Klein (3,5 % ab 400 kcal). Für „Klein“ nach dem Training gilt dieselbe Milch-Regel wie am Ruhetag (3,5 % ab 400 kcal offen). Bewusst: „Kalorien überschritten“ greift auch vor/während des Trainings; „leichte Mahlzeit + kleiner Shake“ hat Vorrang vor „Groß“. · setzt „Protein hat Vorrang“ (D-055) um. · Claude, vom Nutzer bestätigt · 2026-10-17

**D-122 · Realistische Vorschläge** – nur Gerichte (≥ 1 Portion übrig) und bereits gegessene Lebensmittel in ihrer zuletzt verwendeten Menge; Proteinpulver und Shake-Milch nie einzeln (sie stecken in den Shakes), keine Zutaten; max. 900 kcal je Vorschlag. · „niemand isst 100 g Proteinpulver“. · Standardmengen (100 g) für alle Produkte. · Nutzer · 2026-10-17

**D-123 · Einstellungen als Teil-Updates** – `PATCH /v1/settings` nimmt einzelne Gruppen und innerhalb von Schwellen/Shake einzelne Felder; Spalten nur über eine Allowlist im Repository, unbekannte Felder → 422, Schrittweiten serverseitig geprüft. Shake-Zutaten müssen eigene Lebensmittel mit Basis pro 100 g/ml sein (fremde → 404). Alternative: immer das komplette Objekt senden (fehleranfälliger im Client). Entschieden: Claude.

**D-124 · Konto löschen** – `POST /v1/account/delete` mit Passwort; Fehlversuche zählen in dasselbe Rate-Limit wie der Login (D-061), danach 429. Gelöscht wird in einer Transaktion: zuerst die Wochenvorlage (deren FK auf Tagesarten ist RESTRICT und würde die Kaskade abbrechen), dann der User mit `ON DELETE CASCADE` für alle Daten; Login-Versuche verfallen regulär. Profiländerung `PATCH /v1/profile` normalisiert den Username wie beim Anlegen, Konflikt → 409. Entschieden: Claude.

**D-125 · Umbenennung Archiv-Hinweis** – „vergangene Gerichte“ statt „aufgegessene Gerichte“ (Screen 10 angepasst). Entschieden: Nutzer.

**D-126 · Reihenfolge Phase 7** – 7.1 und 7.3 vor Phase 6; nach Phase 6 Deploy-Vorbereitung und erster Deploy-Check. Danach 7.4 als Erstes, dann 7.2, 7.5 und 7.6 (nichts davon vor dem Deploy-Check). Entschieden: Nutzer.

**D-127 · Einstellungen speichern automatisch** – Stepper-Seiten (Protein-Standard, Shakes, Checkpoints, Vorschläge, Bewertung) speichern 0,5 s nach der letzten Änderung (Teil-Update, D-123), beim Verlassen sofort; Status „Gespeichert“ bzw. Fehler unten. Formulare mit Texteingabe (Profil, Passwort) und Sheets (Tagesart, Wochentag) haben einen eigenen Speichern-Button. · Screen 19 zeigt keinen Speichern-Button; viele kleine Änderungen per Tipp. · überall Speichern-Button. · Claude · 2026-10-17

**D-128 · „Konto löschen“ in der Profil-Seite** – unten in „Profil“ statt im Menü: Sheet mit Warnung und Passwort, danach Bestätigungsdialog „Konto endgültig löschen?“ (D-082). · Screen 16 sieht im Menü keinen Platz vor; seltene, unwiderrufliche Aktion gehört nicht neben „Abmelden“. · eigener Menüpunkt. · Claude · 2026-10-17

**D-129 · Shake-Zutaten per Suche wählen** – Proteinpulver und beide Milchsorten werden über eine Bibliothekssuche gewählt (nur Basis pro 100 g/ml, „Keins“ möglich), Mengen per Stepper (Milch in 50-ml-, Pulver in 5-g-Schritten; Server erlaubt feiner). · Auswahlliste wäre auf 50 Treffer begrenzt. · `<select>`. · Claude · 2026-10-17

**D-130 · Theme ohne Seitenneuladen** – Auswahl im Menü setzt `data-theme` sofort und speichert danach; bei Fehler zurück. Nach dem Login wird das gespeicherte Theme gesetzt; flackerfreier Start (vor dem ersten Rendern) folgt in 7.2. · Claude · 2026-10-17

**D-131 · Fragebogen-Sync per Test** – `GUIDANCE_PROMPT` ist eine Frontend-Konstante; ein Vitest-Test vergleicht sie mit dem Codeblock in `docs/RICHTWERTE-PROMPT.md`. Vite darf `docs/` nur während Vitest lesen. · eine Quelle, keine Drift, kein Laufzeit-Import aus `docs/`. · Claude · 2026-10-17

**D-132 · Vorschlags-Schwellen aus den Einstellungen** – der Zauberstab nutzt die Schwellen aus „Vorschläge“; Pre-Workout-/KH-Snack-Werte und die größte realistische Mahlzeit bleiben fest (DEFAULTS). Wochenvorlage-Zusammenfassung im Menü: „Di + Do Basketball 20:00“, sonst „n Trainingstage“. · Claude · 2026-10-17

**D-133 · Eigener Service Worker statt vite-plugin-pwa** – ~60 Zeilen (`frontend/tools/sw.js`) plus kleines Vite-Plugin (`tools/pwa.ts`), das die Precache-Liste und eine Version einträgt und die Icons aus `design/brand/` ausgibt. Precache: alle gebündelten Assets außer nachgeladenen Chunks (Scanner). Seitenaufrufe Network-first mit Shell-Fallback offline; `/assets/` und `/pwa/` Cache-first; `/api` nie. `skipWaiting` + `clients.claim`. · keine neue Abhängigkeit (Workbox), volle Kontrolle darüber, was gecacht wird. · vite-plugin-pwa. · Claude · 2026-10-17

**D-134 · Icons unter `/pwa/`** – nicht `/icons/`, weil Apache dort standardmäßig ein Alias auf seine Autoindex-Symbole hat. · Claude · 2026-10-17

**D-135 · Verlauf: Bewertung im Client, Summen vom Server** – `GET /v1/history` liefert je Tag Soll-Schnappschuss, Summen und Anzahl Einträge; Status, Bilanzen, Einordnung, ISO-Wochen und Monatsgruppen rechnen reine Funktionen in `domain/history.ts`. Ein Abruf je Ansicht (Woche, Monat, Jahr ≤ 366 Tage). · Toleranz kommt aus den Einstellungen, eine Quelle für Heute und Verlauf; testbar ohne DB. · Bewertung serverseitig. · Claude · 2026-10-18

**D-136 · Details der Verlaufsansichten** – Einordnung (D-044): Band „ausgeglichen“ folgt der Toleranz aus „Bewertung“, −15 % / +10 % bleiben fest. Tage vor Kontostart und in der Zukunft gestrichelt ohne Wert; Tage ohne Einträge gestrichelt mit „/“; heute im Kalender „heute“, in der Tabelle „läuft“. Σ-Spalte und Bilanz nur über abgeschlossene Tage mit Einträgen; Ø-Protein-Soll = Mittel der gezählten Tage. Jahr: Balken skaliert auf die größte Monatsabweichung (mind. ±10 %), Farbe nach Status; Kacheln als Anteil der Tage; Monatsliste neueste zuerst, nur Monate mit Daten. „Weiter“ endet bei der laufenden Periode, „Zurück“ ist offen (leere Perioden zeigen einen Hinweis). · Claude · 2026-10-18

**D-137 · Shakes optional** – Schalter „Shakes verwenden“ in Einstellungen › Shakes (`user_settings.shakes_enabled`, Migration 010, Standard an). Aus: `GET /v1/shakes` liefert eine leere Liste (Shakes verschwinden aus „+“), `POST /v1/entries/shake` → 409, Vorschläge ohne Shake-Regeln mit proteinreicher Mahlzeit „Nach dem Training“; Proteinpulver/Milch werden nicht mehr aus den Kandidaten ausgeschlossen (es bleibt bei bereits gegessenen Lebensmitteln in ihrer Menge, D-122). Eingetragene Shakes bleiben unverändert. Die Shakes-Seite erklärt kurz Zweck und Wirkung. · Nutzer (Schalter, Reihenfolge), Claude (Logik) · 2026-10-18

**D-138 · Reihenfolge der Einstellungen** – Tagesarten & Sollwerte · Wochenvorlage · Checkpoints · Bewertung · Vorschläge · Shakes. · Nutzer · 2026-10-18

**D-139 · Shake-Varianten aus Flüssigkeits-Auswahl** – ersetzt die Milch-Produkte und Mengen-Einstellungen aus D-040/D-114: Größen fest (Groß 400 ml, Klein 200 ml); Flüssigkeiten Milch 1,5 %, Milch 3,5 %, Wasser als Mehrfachauswahl (mind. eine, Standard alle), Werte fest aus den Richtwerten (Wasser 0); Proteinpulver aus der Bibliothek, Menge einstellbar (10–80 g, Standard 30 g). Varianten `big|small` × Flüssigkeit, live berechnet; nicht gewählte Varianten → 409. Shakes nur im „+“ und in den Vorschlägen, keine Bibliothekseinträge (Nutzer: gesperrte, synchronisierte Einträge und Unordnung in Suche/Filter vermeiden). Zauberstab: „leicht“ = Wasser → 1,5 % → 3,5 %, „reichhaltig“ = 3,5 % → 1,5 % → Wasser, großer Shake = 1,5 % → 3,5 % → Wasser; nur die Proteinpulver-Auswahl bleibt von Vorschlägen ausgeschlossen. Migration 011 entfernt die alten Spalten. · Nutzer (Größen fest, Mehrfachauswahl, Pulver einstellbar, Standard alle, nur „+“), Claude (Präferenzreihenfolge) · 2026-10-18

**D-140 · „Vorschläge (Shake)“** – alle Schwellen betreffen Shakes: Seite umbenannt, an letzter Stelle, bei Shakes aus ausgegraut (Stepper gesperrt) mit Hinweis zum Einschalten. Ersetzt die Reihenfolge aus D-138. · Nutzer · 2026-10-18

**D-141 · Vorschläge in „Shakes“, Flüssigkeiten als Pills, Pulver anlegen/scannen** – Die Shake-Schwellen sind ein Abschnitt „Vorschläge“ auf der Shakes-Seite (nur sichtbar, wenn Shakes an sind); der eigene Menüpunkt entfällt. Ersetzt D-140. Flüssigkeiten als Mehrfachauswahl-Pills mit Häkchen; die letzte gewählte Pill ist gesperrt (mind. eine), kcal-Angaben stehen im Hinweis darunter. Die Proteinpulver-Auswahl bietet wie die Zutatensuche Scan-Button und „Scannen“ / „Produkt anlegen“: Bibliothekstreffer per Scan wird direkt gewählt; Online-Treffer und unbekannte Barcodes öffnen „Neues Produkt“ (vorausgefüllt) zum Prüfen, „Speichern & verwenden“ legt es in der Bibliothek an und wählt es. Produkte pro Stück werden abgelehnt (wie der Server). · Nutzer (Zusammenlegung, Pills, Schnellzugriff), Claude (Online-Treffer erst prüfen statt direkt speichern, Kategorie-Vorgabe „Getränke & Shakes“) · 2026-10-18

**D-142 · Scrollen in Bottom-Sheets** – Nur der Sheet-Inhalt scrollt (eigener Scroll-Container, `overscroll-behavior: contain`); Griff und Titel stehen fest. `Sheet` hat optionale Bereiche `header` (z. B. Suche, Filter) und `footer` (Aktionen), die außerhalb des Scroll-Bereichs liegen und so immer sichtbar und bündig mit den Listeneinträgen sind. Ersetzt den `position: sticky`-Footer, unter dem Einträge durchschienen. Der Scroll-Bereich ragt in das Sheet-Padding, damit Fokusrahmen nicht abgeschnitten werden. Feste Suche und Aktionen nur in den Such-Sheets (Hinzufügen, Zutat suchen, Proteinpulver-Auswahl), weil deren Buttons Schnellzugriffe auf Bibliothek und Scanner sind; alle anderen Sheets (Produkt, Gericht, Tagesart bearbeiten/wählen, Menge, Richtwerte ermitteln) behalten ihren Hauptbutton am Ende des scrollenden Inhalts. Seiten außerhalb von Sheets scrollen weiter mit dem Fenster. · Nutzer (Anforderung, Umfang nur Such-Sheets), Claude (Umsetzung) · 2026-10-18

**D-143 · Sheet-Inhalte schrumpfen nicht** – im Scroll-Bereich eines Sheets behalten alle Blöcke ihre Höhe (`flex-shrink: 0`), gescrollt wird der Bereich. Behebt den Fehler, dass die Zutatenliste im Gericht-Editor auf kleinen Bildschirmen auf 0 schrumpfte (Folge von D-142). Die Zutatenliste hat zusätzlich eine feste Zeile „+ Zutat hinzufügen“ (öffnet die Suche) und im leeren Zustand einen Hinweis. · Nutzer (Fehlermeldung), Claude (Umsetzung) · 2026-10-18

**D-144 · Bibliothek wie „Zutat suchen“** – Essen › Bibliothek: Scan-Button in der Suchzeile, Online-Treffer (Open Food Facts) ab 3 Zeichen unter den eigenen Treffern, unten fest am Bildschirmrand „Scannen“ und „Produkt anlegen“. Scan: Bibliothekstreffer öffnet zum Bearbeiten, Online-Treffer und unbekannte Barcodes öffnen „Neues Produkt“ (vorausgefüllt) zum Prüfen; gespeichert wird erst mit „In Bibliothek speichern“. „Produkt anlegen“ übernimmt den Suchbegriff als Namen. · Nutzer · 2026-10-18

**D-145 · Footer auf allen Seiten** – Logo + Version am Ende von Heute, Essen (Gerichte und Bibliothek, dort unter den festen Aktionen), Verlauf, Menü und allen Einstellungsseiten; nicht in Sheets und Dialogen. · Nutzer · 2026-10-18

**D-146 · Restliche Roadmap vor dem Deploy-Check** – 7.4, 7.2, 7.5 und 7.6 werden vor dem ersten Deploy-Check umgesetzt (ändert die Reihenfolge vom 2026-10-17); „Später / vielleicht“ bleibt danach. · Nutzer · 2026-10-19

**D-147 · Reduced Motion schaltet auch weiches Scrollen ab** – die globale Regel setzt zusätzlich `scroll-behavior: auto` (Uhrzeit-Rad). Eine Schließen-Animation für Sheets ist in DESIGN.md §8 nicht vorgesehen und wird nicht gebaut (ersetzt durch D-153). · Claude · 2026-10-19

**D-148 · Flackerfreier Theme-Start** – Kopie der Theme-Wahl in `localStorage` (`primed.theme`), gelesen von einem blockierenden klassischen Skript am Ende von `<head>` (eigene Datei unter `/assets/` mit Content-Hash, kein Inline-Skript). Die Kopie bleibt beim Abmelden erhalten (Geräte-Vorliebe, Login-Screen im gewählten Theme) und wird bei „System“ und nach dem Löschen des Kontos entfernt; maßgeblich bleibt der Server-Wert. `theme-color` folgt dem gewählten Theme. · Alternativen: Inline-Skript mit CSP-Hash (Hash muss bei jeder Änderung in `.htaccess` nachgezogen werden), Cookie (wird bei jedem Request mitgeschickt), nur Server-Wert (flackert bis nach `/auth/me` und `/settings`). · Claude · 2026-10-19

**D-149 · Barrierefreiheit-Check gestrichen** – der A11y-Teil von 7.5 entfällt; 7.5 umfasst nur noch das abschließende Security Audit. Die Grundregeln aus DESIGN.md §10 gelten weiter. · Nutzer · 2026-10-19

**D-150 · Doku-Aufteilung** – Einrichtung/Release bleiben in `DEPLOYMENT.md`, laufender Betrieb in `BETRIEB.md`, Nutzer-Anleitung in `ANLEITUNG.md` (Du-Form, Inhalt von Screen 18 und Hinweis aus Screen 20 wörtlich übernommen). · Claude · 2026-10-19

**D-151 · Funde aus dem Abschluss-Audit (7.5)** – DB-Fehler nur mit SQLSTATE loggen; IP-HMAC-Präfix (12 Hex) in Login-Ereignissen; OFF-Cache bei jedem Schreiben bereinigen (statt Zufall oder Cron, Index auf `fetched_at`); Sicherheits-Header ohne `<IfModule>` (fail closed); HTTPS-Weiterleitung auch in `api/.htaccess`; Client-IP hinter nginx, nginx-Direktauslieferung und Trusted Types werden im ersten Deploy-Check auf dem Server geprüft (lokal nicht prüfbar). · Claude · 2026-10-19

**D-152 · Username fest** – vergeben nur beim Anlegen per CLI, danach weder in der App noch per API/CLI änderbar; das Profil zeigt ihn als feste Zeile mit Schloss. Ersetzt die Username-Änderung aus 7.1. · Alternativen: Änderung mit Passwort-Bestätigung, Änderung ohne Passwort (bisher). · Nutzer · 2026-10-19

**D-153 · Sheets fahren beim Schließen aus** (ersetzt den zweiten Teil von D-147; zurückgenommen durch D-155) – 220 ms ease-in nach unten, Scrim blendet aus, danach erst `dialog.close()`. Während des Ausfahrens zeigt das Sheet den letzten Inhalt (viele Aufrufer leeren ihn beim Schließen) und reagiert nicht auf Eingaben; erneutes Öffnen bricht das Ausfahren ab. Ende über nativen `animationend`-Listener, Rückfall-Timer 300 ms; bei `prefers-reduced-motion` sofort zu. Fokus bleibt bei einem inzwischen geöffneten anderen Sheet. · Nutzer (Animation), Claude (Umsetzung) · 2026-10-19

**D-154 · Release per Skript** – `scripts/build-release.sh` erzeugt das Paket in `build/` (gitignored) statt manueller Kopierschritte; `bin/migrate.php` wird nicht deployt (Migrationen nur per phpMyAdmin, D-Least-Privilege aus `DEPLOYMENT.md`); `--classmap-authoritative`, da die API keine Laufzeit-Abhängigkeiten hat. Ein Zip/Upload-Automatismus ist bewusst nicht enthalten (SFTP durch den Nutzer). · Claude · 2026-10-19

**D-155 · Keine Schließen-Animation, ruhiges Einfahren** – nach dem Gerätetest (iPhone) zurückgenommen: Sheets schließen wieder sofort (D-153 entfällt). Ursachen für das Ruckeln beim Öffnen behoben: das Uhrzeit-Rad scrollte beim Öffnen mit `scroll-behavior: smooth` sichtbar von 00 zur Uhrzeit (Startposition jetzt sofort, spätere Änderungen weiter weich); Such-Sheets wuchsen beim Nachladen von halber auf volle Höhe (jetzt feste volle Höhe wie Screens 04/05). `will-change: transform` am Sheet wurde nach dem nächsten Gerätetest wieder entfernt: iOS zeichnete das Sheet im `<dialog>` damit nur teilweise und ohne Scrim. · Nutzer (Schließen), Claude (Ursachen/Umsetzung) · 2026-10-19

**D-156 · Online-Treffer ohne gültigen Barcode** – Codes von Open Food Facts mit falscher Prüfziffer (z. B. Händlercodes für lose Ware) werden beim Speichern weggelassen; das Produkt wird ohne Barcode angelegt. Die Server-Prüfung bleibt streng. · Claude · 2026-10-19

**D-157 · Skeletons statt „Lädt …“** – Ladezustände im fertigen Layout mit Platzhalter-Balken (Komponente `Skeleton`: `Bone`, `Loading`, `SkeletonRows`), Opacity-Puls, statisch bei Reduced Motion, Screenreader hören „Lädt …“. Volle Höhe nur für ladende Sheets (`Sheet fullHeight`, Such-Sheets automatisch). Hinzufügen füllt sich erst, wenn Shakes, Gerichte und „Häufig“ da sind. Menü: Namen sofort, nur Zusammenfassungen als Platzhalter. Angelehnt an die Regeln für App-Screens aus dem Taste-Skill (finale Struktur, reale Größen, kein Schimmer); den Puls hat der Nutzer gewünscht. · Nutzer (Skeletons, Puls, volle Höhe nur für ladende Sheets), Claude (Umsetzung) · 2026-10-19

**D-158 · Typ-Zeile in der Bibliothek bricht um** – „Typ: …“ neben „Nach Häufigkeit“ darf auf schmalen Geräten in die zweite Zeile umbrechen, statt über den Rand zu laufen. · Claude · 2026-10-19

**D-159 · Schlanke Startbibliothek** – Migration 012 entfernt für alle User die BLS-Richtwerte und die sechs Start-Produkte (weich über `deleted_at`, umkehrbar; Einträge behalten ihren Schnappschuss, Gerichte ihre Zutaten; eigene Einträge `manual`/`off` und ein als Proteinpulver gewähltes Lebensmittel bleiben). Die Milch bleibt mit `system_key` und erscheint in Bibliothek, Suche und „Häufig“ nur, solange Shakes an sind; das Whey bleibt. Neue User bekommen nur Milch und Whey; `--owner-defaults` wirkt nur noch auf die Wochenvorlage. Die Shake-Berechnung nutzt ohnehin feste Milchwerte. · Nutzer (Umfang: BLS + Start-Produkte für alle, auch benutzte), Claude (weiches Löschen, Pulver-Ausnahme, `system_key`) · 2026-10-19
