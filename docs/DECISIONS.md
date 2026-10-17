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
