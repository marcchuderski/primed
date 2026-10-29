# Taste-Review Frontend · Screen-Vorschläge

Stand: 29.10.2026 · Status: **Vorschlag, nichts entschieden, nichts umgesetzt**

Die Vorschläge liegen als HTML in diesem Ordner (`index.html` öffnen). Jeder Screen zeigt Hell und Dunkel nebeneinander, rechts daneben jede Änderung mit Begründung und Konfliktstufe.

## 1. Umfang und Methode

- **Skill:** `taste-skill:design-taste-frontend` v2.1.2, Regeln für App-Screens (`references/app-screens.md`), nicht die Landingpage-Regeln.
- **Stil:** `editorial-greeting` (Seed 1214058427), gezogen mit `--keep palette,type`: Farben „Sand & Glut“ / „Night Court“ und die Schriften Bricolage Grotesque + Inter bleiben, übernommen wird nur die Komposition. Gewählt, weil der Stil die Begrüßung als h1 vorsieht. Das ist bei uns schon beschlossen (D-178, BRIEFING §4a).
- **Gemessen:**
  - `lint.mjs --app` über `frontend/src` (166 Dateien)
  - `inspect.mjs --app` bei 390 px auf die Referenz-Mockups 03, 04, 06, 10, 13, 14, 16
  - Durchsicht des Codes, ob die Muster aus den Mockups dort wirklich vorkommen
- **Nicht gemessen:** Die laufende App selbst. Der Inspektor kann sich nicht einloggen. Die Befunde zu Versalien-Labels, Titelgrößen und Kacheln sind im Code bestätigt (siehe unten), Kontrastwerte stammen aus den Mockups mit denselben Tokens.
- **Nicht gemockt:** Login, Hinzufügen, Suche, Produkt anlegen, Tagesart, Vorschläge, Bibliothek, Meal-Prep-Editor, Verlauf Jahr, Einstellungsseiten. Für sie gelten die Querschnitts-Befunde U1–U5 genauso.

## 2. Was schon gut ist (nicht anfassen)

Primed erfüllt die meisten Regeln des Skills bereits. Die Vorschläge sind deshalb eher Feinschliff als Umbau.

- **Eigenes Gesicht:** Die Begrüßung nennt die Lage des Tages aus den Daten („Noch 2½ Stunden bis zu deinem Pre-Workout.“). Genau das verlangt der Stil. Der Trainings-Marker im Balken ist das Element, das nur dieses Produkt hat.
- **Farbe auf Daten:** Orange liegt nur auf Protein, Hauptaktion und Training (DESIGN §3).
- **Flache Flächen:** Kein Schatten auf ruhenden Karten. Es gibt Tonstufen statt Linien.
- **Zahlen:** gleich breite Ziffern, deutsche Formate, echtes Minus.
- **Status:** immer Farbe **und** Symbol, keine Ampel.
- **Laden:** Skeletons im fertigen Layout, ohne Schimmer (D-157, war schon am Skill orientiert).
- **Keine Bottom-Navigation, kein Dashboard-Dschungel.**

## 3. Befunde

| # | Befund | Gemessen | Wo |
|---|---|---|---|
| U1 | Gruppenlabels in 12 px Versalien mit Sperrung („WOCHENBILANZ“, „UHRZEIT“, „DANACH OFFEN“, Pop-up-Titel) | Inspektor: `micro-label` auf 03, 06, 13, 14 | 13 Stellen im Code mit `text-transform: uppercase` (Today, Essen, Menge, Tagesart, Einstellungen, Hinzufügen, Vorschläge, Gericht-Editor, Produkt, Verlauf) |
| U2 | Titel 34–38 px | Inspektor: `app-title-size` 34–38 px (App-Regel: 20–24 px auf dem Telefon) | Heute, Essen, Verlauf 34 px; Menü 30 px |
| U3 | Doppelter Titel: Tab „Verlauf“ bzw. „Essen“ und darunter dieselbe h1 | Screenshot | Verlauf, Essen |
| U4 | Drei getönte Status-Kacheln in der Bilanz | Inspektor: `icon-chips` 9 getönte Flächen auf 13 | Verlauf Woche/Monat/Jahr |
| U5 | Kontrast unter 4,5 : 1: `--text-muted` und `--accent-text` auf `--tonal` (Hell) | 4,1–4,2 : 1 (u. a. „noch 728“, „Monat“, „Jahr“, „Danach offen“) | Segment-Labels, Pop-up, „Danach offen“, Archiv-Zeile |
| U6 | Checkpoint-Ergebnis nur per Tippen sichtbar, die Zeile darunter erklärt nur die Bedienung | Skill: „das Ergebnis dort, wo zuerst gelesen wird“ | Heute |
| U7 | Einträge als einzelne Karten mit Abstand statt einer Liste | Skill: „Group, don't box“ | Heute |
| U8 | Wochentabelle: erste Spalte scrollt mit, 49 % des Texts unter 13 px, Werte zentriert | Inspektor: `tiny-text`, `edge-text` | Verlauf Woche |
| L1 | `linear-gradient` für den halben Portions-Punkt | Linter FAIL | `DishesView.module.css:83` |
| L2 | `linear-gradient` als Ausblendung der Fragebogen-Vorschau | Linter FAIL | `GuidanceSheet.module.css:72` (siehe Konflikt K4) |
| L3 | Schatten am aktiven Segment | Linter WARN | `MenuScreen.module.css:94` |
| L4 | Beispieldaten in den Mockups: „leichtes Defizit“ bei rund −1,3 % bzw. −1,6 % | nachgerechnet mit D-044 | Mockups 13, 14 (nur Doku) |

Keine Funde: Schatten an Sheet, Dialog und Schalter (schwebende Elemente, erlaubt). Die ✓-Treffer des Linters sind Statussymbole, kein Emoji. `padStart` wird nur für Uhrzeiten genutzt.

## 4. Konfliktstufen

- **A · konfliktfrei:** widerspricht keiner Entscheidung und keinem Text in DESIGN.md oder BRIEFING. Kann ohne Rückfrage umgesetzt werden, sobald du die Richtung freigibst.
- **B · weicht von DESIGN.md / BRIEFING ab:** keine D-Entscheidung betroffen, aber ein verbindlicher Text oder ein Referenz-Mockup. Braucht deine Freigabe, danach Update von DESIGN.md bzw. BRIEFING und ein neuer D-Eintrag.
- **C · widerspricht einer Entscheidung:** **nicht** in die Vorschläge eingebaut, nur hier aufgeführt.

## 5. Konflikte, auf die ich hinweisen muss

**K1 · Palette „Sand & Glut“ (C, D-021).** Der Skill verbietet ausdrücklich „cremefarbenen Grund mit Terrakotta/Rost“ als typische KI-Palette, und der Inspektor meldet `palette-cream` auf jedem hellen Screen. Das ist genau unsere helle Palette. **Nicht geändert.** Sie wurde nach mehreren Runden gewählt (D-021) und trägt die Marke inklusive App-Icon (D-160). Empfehlung: beibehalten. Der Skill sagt selbst, dass bei einer bestehenden Marke deren Farben gelten (`--keep palette`).

**K2 · Große Zahlen in Bricolage 800 (B, DESIGN §4).** Der Stil setzt Zahlen in normaler Stärke. Bei uns sind fette Display-Zahlen Teil der Marke („Zahlen zuerst“, DESIGN §1). **Nicht geändert.** Empfehlung: beibehalten.

**K3 · Orange als Primärbutton (B, DESIGN §3).** Der Skill bevorzugt einen fast schwarzen Primärbutton und Akzent nur auf Daten. Bei uns ist die Akzentfläche als Hauptaktion festgelegt. **Nicht geändert.** Empfehlung: beibehalten. Pro Screen gibt es nur eine.

**K4 · Fragebogen-Vorschau (Widerspruch in der eigenen Doku).** BRIEFING §12 verlangt eine Vorschau „nach unten ausgeblendet“. DESIGN §3 („Keine Verläufe“) und D-163 („kein Verlauf als Ausblendung“) schließen genau das aus. Der Code nutzt einen Verlauf (L2). Optionen:
- (a) Vorschau hart nach N Zeilen abschneiden, darunter „Ganzen Fragebogen anzeigen“. Konsistent mit D-163, Empfehlung.
- (b) Den Verlauf als Ausnahme dokumentieren.

Du entscheidest.

**K5 · Wochentabelle auf dem Telefon (C, D-010 / BRIEFING §11).** Der Skill empfiehlt, Tabellen unter 640 px in zweizeilige Listen umzubauen. Beschlossen sind „Tage als Spalten, horizontal scrollbar, Σ-Spalte“. **Nicht geändert.** Der Vorschlag nutzt die Alternative, die der Skill ebenfalls erlaubt: Die Tabelle scrollt in ihrem eigenen Rahmen, die erste Spalte bleibt stehen.

**K6 · Begrüßung bleibt 34 px (kein Konflikt).** Die App-Regeln wollen Titel bis 32 px. Der gezogene Stil erlaubt die Begrüßung als große h1 aber ausdrücklich. „Hey, Marc.“ bleibt deshalb wie in D-178. Verkleinert bzw. ersetzt werden nur die reinen Seitentitel (U2/U3).

## 6. Vorschläge je Screen (Kurzfassung)

| Screen | Änderung | Stufe | Betrifft |
|---|---|---|---|
| 01 Heute | Checkpoint-Zeile „Bis 17:00 noch 595 kcal · 25 g P · 72 g KH“ statt Bedienhinweis | B | DESIGN §6 (Legende); D-025 bleibt, Pop-up bleibt |
| 01 Heute | Einträge als eine Liste mit Trennlinien | B | DESIGN §5/§6 Listeneintrag |
| 01 Heute | Pop-up-Titel normal geschrieben, „noch 595“ in Textfarbe | B / A | DESIGN §4 / Kontrast |
| 02 Woche | Wochen-Streifen Mo–So statt drei Kacheln | B | BRIEFING §11, DESIGN §6 |
| 02 Woche | Zeile „kcal-Rahmen“ entfällt, Status unter dem kcal-Wert | B | BRIEFING §11 |
| 02/03 Verlauf | h1 = Zeitraum („KW 42“, „Oktober 2026“), kein zweites „Verlauf“ | B | DESIGN §4 |
| 02 Woche | Feste erste Spalte, rechtsbündig, ≥ 12 px | A | – |
| 03 Monat | Zählung als Zeile statt Kacheln, dient zugleich als Legende | B | BRIEFING §11, DESIGN §6 |
| 04 Gerichte | „Essen“-h1 nur für Screenreader | B | DESIGN §4 |
| 04 Gerichte | „Neues Gericht kochen“ tonal statt gestrichelt | B | Mockup 10 |
| 04 Gerichte | Halbe Portion ohne Verlauf, Archiv-Zeile auf `--surface` | A | – |
| 05 Menge | Labels normal geschrieben, „Danach offen“ auf `--surface` | B | DESIGN §4, BRIEFING §7 |
| 05 Menge | Checkpoint-Zeile im Sheet | B | BRIEFING §7 |
| 05 Menge | „ml“ sichtbar deaktiviert, Stapelbalken mit Fuge | A | – |
| 06 Menü | Gruppenlabels normal geschrieben, Avatar tonal | B | DESIGN §4, Mockup 16 |
| alle | Segment-Labels in Textfarbe, aktives Segment ohne Schatten | A | – |

Neue Tokens sind nicht nötig. Alle Vorschläge nutzen ausschließlich `design/tokens.css`.

## 7. Wenn du freigibst

1. Du wählst je Zeile aus Abschnitt 6: übernehmen, ändern oder verwerfen. K4 braucht eine Entscheidung.
2. Ich trage die Entscheidungen als D-Einträge ein und passe DESIGN.md, BRIEFING und die betroffenen Referenz-Mockups an.
3. Erst dann folgt die Umsetzung im Frontend als eigener Roadmap-Schritt, inklusive Tests und Security-Audit nach CLAUDE.md.
