# promax-redesign – Review nach ui-ux-pro-max

Stand: 29.10.2026 · Status: **Vorschlag, nichts umgesetzt** · Grundlage: Skill `ui-ux-pro-max` (Regelwerk `quick-reference.md` §1–10, `pro-rules.md`, Datenbank-Abfragen), Frontend-Code auf `main` (1.4.0), `design/DESIGN.md`, `docs/DECISIONS.md` bis D-182.

Screens: [`index.html`](index.html) im Browser öffnen (Light und Dark nebeneinander) oder die PNGs in [`png/`](png/) ansehen. Blaue Nummern sind Anmerkungen, keine UI.

## Kurzfazit

Das Frontend erfüllt die kritischen Regeln des Skills schon größtenteils: Touch-Ziele 44 px, Lucide statt Emojis, semantische Tokens, sichtbarer Fokus, `prefers-reduced-motion`, `dvh`, Status nie nur über Farbe, Skeletons in finaler Größe, Bestätigung vor dem Löschen, echte `<dialog>`-Sheets, `autocomplete` im Login. Die Lücken liegen vor allem bei **Rückmeldung auf Tippen** (gar kein Gedrückt-Zustand), **Bestätigung nach dem Eintragen**, **Kontrast im Light-Theme** (sechs Paare knapp unter 4,5 : 1, obwohl DESIGN §10 das verlangt) und **Lesbarkeit im Verlauf** (10–11 px, versteckter Horizontal-Scroll).

Der automatische Design-System-Vorschlag des Skills (grüne Palette, Barlow, Landingpage-Muster) passt nicht zu Primed und widerspricht D-020/D-021/D-078; er wurde bewusst **nicht** verwendet. Die Vorschläge bleiben in Sand & Glut / Night Court, Bricolage + Inter, Text-Tabs oben.

## Funde

Priorität nach Skill (1 = kritisch). „Code“ = nur Umsetzung, kein neuer Screen nötig.

| # | Prio | Regel (Skill) | Befund | Wo | Vorschlag |
|---|---|---|---|---|---|
| F1 | 2 | `press-feedback`, `tap-feedback-speed`, `state-clarity` | Kein einziges `:active` im Frontend, `-webkit-tap-highlight-color: transparent` schaltet auch das System-Feedback ab. Tippen fühlt sich auf dem iPhone „tot“ an, bis das Sheet erscheint. | `styles/base.css`, alle `*.module.css` | Screen 07, Screen 01 A |
| F2 | 2 | `tap-delay` | `touch-action: manipulation` fehlt auf Buttons (nur Wisch-Eintrag hat `pan-y`). | global | Code |
| F3 | 2 | `loading-buttons` | „busy“ macht den Button nur 60 % blass, ohne Spinner/Text – sieht aus wie deaktiviert. | `Button.tsx` | Screen 07 |
| F4 | 2 | `swipe-clarity`, `gesture-alternative` | Wischen zum Löschen ist nirgends angedeutet. Alternative im Mengen-Sheet existiert (D-105), ist also barrierefrei, aber unentdeckbar. | `EntryItem` | Screen 01 A |
| F5 | 8 | `success-feedback`, `toast-accessibility` | Nach dem Eintragen schließt das Sheet ohne Rückmeldung; ob es geklappt hat, sieht man nur an den Balken. | `TodayScreen`, `AddFlow` | Screen 01 B |
| F6 | 8 | `empty-states` | „Noch nichts eingetragen.“ ohne Hinweis, was zu tun ist. | `TodayScreen` | Screen 02 A |
| F7 | 8 | `error-recovery`, `timeout-feedback` | Ladefehler zeigen nur den Text (`<p role="alert">`), kein „Nochmal versuchen“. | `TodayScreen:113` u. a. | Screen 02 B |
| F8 | 1 | `color-contrast`, `color-accessible-pairs` | Light: `--text-muted` auf `--tonal` 4,19, `--accent-text` auf `--tonal` 4,08, Status-Schriften auf ihren Pills 3,92–4,13 (Soll 4,5, DESIGN §10). Dark erfüllt alles. | `design/tokens.css` | Screen 06 · **Trade-off** |
| F9 | 1 | `contrast-data` (Nicht-Text 3 : 1) | Trainings-Marker in Orange auf neutralem Balken im Light 2,31 : 1. | `MacroBar` | Screen 06 · **Trade-off** |
| F10 | 5 | `readable-font-size`, `number-tabular` | Verlauf: Werte in 10–11 px (Tabellenzellen, Status-Symbole im Kalender, „läuft“). | `History.module.css:209, 217, 288, 356` | Screen 04 |
| F11 | 5 | `horizontal-scroll` | Wochentabelle 668 px breit, scrollt seitlich ohne sichtbaren Hinweis. | `WeekView` | Screen 04 (A) / 05 (B, **Konflikt D-010**) |
| F12 | 8 | `password-toggle`, `error-placement` | Kein Anzeigen-Schalter beim Passwort; Fehler steht unter dem Formular statt am Feld. | `LoginScreen` | Screen 03 · **Trade-off** |
| F13 | 7 | `transform-performance` | Makro-Balken animieren `width` (Layout pro Frame). Optisch gleich mit `transform: scaleX()`. | `MacroBar.module.css:49` | Code |
| F14 | 7 | `motion-consistency` | Dauern verstreut (150/200/250/280/400 ms, eine Kurve pro Datei). Kein Fehler, aber keine Tokens. | diverse | Code: `--motion-*`-Tokens in `tokens.css` |
| F15 | 5 | `safe-area-awareness` | `viewport-fit=cover` + Standalone-PWA, aber der App-Rahmen nutzt feste 44 px oben statt `env(safe-area-inset-top)`. Auf dem iPhone bitte prüfen, ob die Tabs unter Dynamic Island/Statusleiste rutschen. | `AppShell.module.css:9` | Code, erst prüfen |
| F16 | 10 | `screen-reader-summary`, `data-table` | Jahresbalken haben keine Textzusammenfassung für Screenreader. | `YearView` | Code |

Nicht als Fund gezählt (geprüft, passt): Touch-Ziele, Icon-Labels, Fokusring, Reduced Motion, `dvh`, Zahlen `tabular-nums`, Skeletons (D-157), Bestätigungsdialoge, Autofill, Fehler mit `role="alert"`, eine Primäraktion pro Screen, Sheet-Schließen mit Escape/Button.

## Screens in diesem Ordner

| Datei | Inhalt | Verhältnis zu Entscheidungen |
|---|---|---|
| `01-heute-interaktion` | A: Gedrückt-Zustand + Wisch-Hinweis · B: Bestätigung nach dem Eintragen (Snackbar „… eingetragen · Ändern“, Delta „+28“ am Protein, Kontur am neuen Eintrag) | verträglich; bewusst **ohne** „Rückgängig“ (D-052) |
| `02-heute-zustaende` | A: leerer Tag mit Ziel bis Checkpoint · B: Ladefehler mit „Nochmal versuchen“ | verträglich; kein zusätzlicher Primärbutton, Fehler-Icon in Altrosa statt Orange (D-023) |
| `03-login` | Passwort anzeigen (Auge), Fehler direkt am Feld | **Trade-off Sicherheit/Komfort** |
| `04-verlauf-woche-a` | Tabelle bleibt; feste erste Spalte, Status als erste Zeile, Pfeil-Knopf wie D-163, Seitenpunkte, ≥ 12 px | verträglich mit D-010 |
| `05-verlauf-woche-b` | Tage als Zeilen, Σ als letzte Zeile, kein seitliches Scrollen | **widerspricht D-010 / DESIGN §6** |
| `06-kontrast` | Light-Token eine Stufe dunkler, Marker dunkleres Orange; vorher/nachher mit Werten | **ändert Werte aus D-021/D-023** |
| `07-interaktionszustaende` | gedrückt / lädt / deaktiviert / Fokus für Buttons, Icon-Buttons, Chips, Tabs, Listeneinträge | verträglich (keine Schatten/Verläufe, nur Fläche + Skalierung 0,98) |

## Konflikte mit getroffenen Entscheidungen

Diese Skill-Regeln würden bestehende Entscheidungen kippen. Ich habe sie **nicht** als Screen umgesetzt (außer wo als Variante markiert) und weise nur darauf hin:

| Skill-Regel | Entscheidung | Umgang |
|---|---|---|
| Design-System-Vorschlag (Grün, Barlow, Landingpage) | D-020, D-021, D-078 | ignoriert |
| `tab-bar-ios`, `bottom-nav-limit`, `nav-label-icon` (Bottom-Tab-Bar mit Icons) | D-024, DESIGN §6 „Keine Bottom-Navigation“ | nicht vorgeschlagen |
| `undo-support` (Löschen per Undo-Toast) | D-052 (Bestätigungsdialog, Undo verworfen) | nicht vorgeschlagen; Snackbar in 01 B bietet nur „Ändern“ |
| `exit-faster-than-enter`, `state-transition` (Sheets animiert schließen) | D-155 (keine Schließen-Animation nach Gerätetest) | nicht vorgeschlagen |
| `destructive-emphasis` (Löschen in Rot) | D-023 / DESIGN §3 (keine Ampel, kein Rot, Orange nie für Fehler) | nicht vorgeschlagen; Löschen bleibt neutral mit Icon + Text |
| Ausblende-Verlauf als Scroll-Hinweis | DESIGN §3 „Keine Verläufe“, D-163 | stattdessen runder Pfeil wie in Sheets (04 A) |
| `horizontal-scroll` (kein seitliches Scrollen) | D-010, DESIGN §6 Verlauf | Variante A verträglich, Variante B **Konflikt** – deine Wahl |
| `color-contrast` 4,5 : 1 | D-021/D-023 (Farbwerte) vs. DESIGN §10 (4,5 : 1) – die eigenen Regeln widersprechen sich im Light-Theme | Vorschlag 06 – deine Wahl |
| Input-Rahmen 3 : 1 (`Icon Contrast`/Nicht-Text) | DESIGN §1 „weiche Übergänge“, `--input-border` 14 % (1,3 : 1) | **nicht** vorgeschlagen, nur erwähnt; Felder haben sichtbare Labels und Fläche |
| `haptic-feedback` | – | entfällt: iOS-Safari/PWA unterstützt `navigator.vibrate` nicht |
| A11y-Prüfung als eigener Schritt | D-149 (A11y-Check gestrichen) | Funde F8–F10 beruhen nur auf DESIGN §10, das weiter gilt; kein neuer Prüfschritt |

## Offene Entscheidungen für dich

1. **Passwort anzeigen (03):** Komfort beim langen Passwort vs. Schulterblick-Risiko. Empfehlung: einbauen, standardmäßig verborgen, beim Absenden und beim Verlassen der Seite wieder verbergen.
2. **Kontrast Light (06):** Token eine Stufe dunkler (Empfehlung, kaum sichtbarer Unterschied) oder Werte lassen und DESIGN §10 für Pills/Chips lockern.
3. **Trainings-Marker (06):** dunkleres Orange `#C24A1C` nur für den Marker auf neutralen Balken, oder unverändert lassen (Werte stehen ja zusätzlich als Zahl da).
4. **Verlauf Woche:** A (Tabelle bleibt, Empfehlung) oder B (Zeilen, ersetzt D-010).
5. **Bestätigung nach dem Eintragen (01 B):** Snackbar mit „Ändern“ gewünscht? Falls zu unruhig: nur Delta + Kontur ohne Snackbar.
6. **Wisch-Hinweis (01 A):** einmaliger Hinweis (pro Gerät gemerkt) oder dauerhaft weglassen.

Nach deiner Auswahl: Einträge in `docs/DECISIONS.md`, DESIGN.md/Kitchen-Sink nachziehen, dann umsetzen.
