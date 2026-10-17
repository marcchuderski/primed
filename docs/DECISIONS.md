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
