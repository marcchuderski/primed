# Apple-Redesign – HIG-Review und Screen-Vorschläge

Stand: 29.10.2026 · Status: **entschieden** – umgesetzt in Version 1.5.0: V4 Aktionsleiste (D-183), C3 `--text-muted` (D-184), V2 Sheets wegwischen (D-185); alles andere verworfen (D-186) · Grundlage: Skill `apple-design` (Apple Human Interface Guidelines, Stand Oktober 2026) und Frontend-Code auf `main` (Version 1.4.0)

Die Mockups öffnest du über [`index.html`](index.html) im Browser. Jeder Screen zeigt Light und Dark nebeneinander, nummerierte Markierungen und gestrichelte Trefferflächen lassen sich ausblenden.

Primed ist eine PWA, die auf dem iPhone läuft (D-069). Die HIG gelten deshalb als Gestaltungsprinzipien, nicht als native Komponenten. Liquid Glass, SF Symbols und System-Sheets stehen im Browser nicht zur Verfügung und werden hier nicht gefordert.

---

## 1. Zusammenfassung

**Bewertung: Critical issues** (laut Skill-Skala, weil es Barrierefreiheits-Funde gibt). Der Gesamteindruck ist trotzdem gut.

Die These des Designs ist klar: *Ein Blick auf „Heute“ zeigt, was bis zum Training noch fehlt.* In Erinnerung bleibt der orange Protein-Balken mit dem Trainings-Marker, getragen von einer ruhigen Sand-/Night-Court-Palette und Bricolage-Zahlen. Struktur, Ladezustände, Statusdarstellung und Dark Mode sind sauber. Die Funde betreffen fast nur Details: Textgröße, ein paar Kontraste in Light, zu kleine Trefferflächen und fehlende iOS-Gesten. Keiner davon verlangt, das Design umzubauen.

## 2. Kritisch

| # | Was | Warum (HIG) | Fix | Screen |
|---|---|---|---|---|
| C1 | **Textgröße des iPhones wird ignoriert.** Alle Schriftgrößen stehen in festen px (`base.css` 16 px, Komponenten 10–52 px). | `typography.md › Supporting Dynamic Type`: „Make sure your app’s layout adapts to all font sizes.“ · `layout.md › Adaptability`: „Apps that don’t respond to this setting can be difficult or impossible to use“ | Basis aus `-apple-system-body`, Schrift in `rem`, Umbruch-Layouts. **Trade-off, Optionen A/B/C** | [02](02-grosse-schrift.html) |
| C2 | **10 px Schrift im Verlauf** (`History.module.css:209, 356`), dazu 11 px an zwei Stellen. | `typography.md › Ensuring legibility`: iOS-Minimum 11 pt, Standard 17 pt | Nebenzeilen 12 px, Statusmarken 24 px mit 13-px-Symbol | [04](04-verlauf-woche.html) |
| C3 | **`--text-muted` auf `--tonal` (Light) hat 4,19 : 1**, gebraucht werden 4,5 : 1 für Text unter 18 pt. Betrifft inaktive Segment-Labels (Verlauf, Darstellung, Einstellungen; 14 px/600) und den Hinweis im Nur-lesen-Banner. | `accessibility.md › Vision`: „Up to 17 pts · All · 4.5:1“ | `--text-muted` Light von `#6A5E52` auf `#63574B`: 4,67 : 1 auf tonal, 6,09 : 1 auf surface. Optisch kaum zu sehen. **Berührt die Palette aus D-021 → deine Freigabe** | – |

## 3. Verbesserungen

| # | Stufe | Was | HIG | Vorschlag | Decisions |
|---|---|---|---|---|---|
| V1 | High | **Trefferflächen 32–36 px**: Chips auf Heute (36), Einheiten-Segment (34), Schnellwahl (34), „Jetzt“ (32), Kategorie-Pills (36), Darstellungs-Toggle (36). DESIGN.md §5 verlangt selbst 44. | `accessibility.md › Mobility`: 44 × 44 pt Standard | Unsichtbar auf 44 pt erweitern, die Optik bleibt | D-163 bleibt · [01](01-heute.html), [03](03-menge-sheet.html) |
| V2 | High | **Sheets lassen sich nicht wegwischen.** Der Griff ist nur Dekoration. | `sheets.md`: „Support swiping to dismiss a sheet.“ · „Include a grabber in a resizable sheet.“ | Ziehen an Griff oder Titel (oder am Inhalt, wenn er ganz oben steht) schließt ab ca. 30 %. Bei ungespeicherten Änderungen kommt eine Rückfrage. | berührt D-155, Gerätetest · [03](03-menge-sheet.html) |
| V3 | High | **Akzent-Icon auf tonal (Light) 2,13 : 1** (Tagesart-Chip). | `accessibility.md › Vision` (Text **und Icons**) | `--accent-text` für Icons auf tonalen Flächen (4,08 : 1) | D-023 bleibt · [01](01-heute.html) |
| V4 | Medium | **„+“ und Zauberstab mitten im Screen**, sie scrollen bei langen Listen weg. | `designing-for-ios.md › Best practices`: Bedienelemente „in the middle or bottom area“ | Feste Aktionsleiste unten mit „Vorschläge“ und „Hinzufügen“ wie im Essen-Tab (D-144) | Abweichung von Screen 03 → **Freigabe nötig** · [01](01-heute.html) |
| V5 | Medium | **Wischen auf einem Eintrag löst sofort den Dialog aus**, man sieht vorher nichts. | `designing-for-ios.md`: „swipe … initiate actions in a list row“ | Wisch gibt einen „Löschen“-Knopf frei, ein voller Wisch löst weiter direkt aus | D-052 bleibt · [01](01-heute.html) |
| V6 | Medium | **Kein Modus für „Kontrast erhöhen“.** | `accessibility.md`: „ensure it at least provides a higher contrast color scheme when the system setting Increase Contrast is turned on“ | `@media (prefers-contrast: more)` in `tokens.css`: `--text-muted` ≈ Text 80 %, `--input-border` 30 %, Akzent-Marker in `--accent-text` | ergänzt nur, kein Konflikt |
| V7 | Low | **Trainings-Marker in Light 2,78 : 1** auf der hellen Fläche (für Nicht-Text-Elemente sind 3 : 1 üblich). | `accessibility.md › Vision` | Nur bei „Kontrast erhöhen“ dunkler (siehe V6), sonst die Markenfarbe lassen | D-023/D-025 bleiben |
| V8 | Low | **Keine Zurück-Geste in Menü-Unterseiten** (Tabs ohne Router, D-103). | `designing-for-ios.md`: „let people swipe to navigate back“ | Unterseiten mit `history.pushState`, damit die Randgeste bzw. Zurück funktioniert. Vorher prüfen, ob die installierte PWA die Geste anbietet. | D-103 bleibt (kein Router nötig) |

## 4. Konflikte mit getroffenen Entscheidungen

Diese HIG-Empfehlungen widersprechen bewussten Entscheidungen. **Ich schlage nicht vor, sie umzusetzen.** Du sollst nur sehen, wo Primed bewusst von Apple abweicht.

| # | HIG sagt | Entscheidung | Empfehlung | Screen |
|---|---|---|---|---|
| K1 | Navigation als Tab-Bar unten (`tab-bars.md`) | **D-024** Text-Tabs oben, **DESIGN.md §6 / BRIEFING §14** keine Bottom-Navigation | Beibehalten. Die Daumenreichweite deckt V4 ab. | [K1](K1-tab-bar-unten.html) |
| K2 | Kein Dialog für häufige, rückgängig machbare Aktionen, stattdessen Undo (`alerts.md`) | **D-052** Löschen mit Bestätigungsdialog (Undo-Toast verworfen) | Beibehalten, dazu V5 (Knopf beim Wischen) | [K2](K2-loeschen-rueckgaengig.html) |
| K3 | Keine eigene Darstellungs-Einstellung in der App (`dark-mode.md`: „Avoid offering an app-specific appearance setting“) | **D-022** System · Hell · Dunkel im Menü, D-148 | Beibehalten. „System“ ist Standard, damit ist die HIG-Absicht erfüllt. | – |
| (K4) | Wegwischen von Sheets (V2) | **D-155** Schließen ohne Animation, nach Gerätetest | Verträglich: Das Sheet folgt dem Finger, beim Loslassen schließt es sofort. Wegen D-155/D-161 aber nur mit Gerätetest. | [03](03-menge-sheet.html) |

Mit Absicht **nicht** vorgeschlagen, weil es Entscheidungen widersprechen würde: Liquid Glass oder Blur für Leisten (DESIGN.md §3 „keine Glas-Effekte“), Ampelfarben, SF-Symbol-Optik (D-026 Lucide), Hauptbutton in der Sheet-Kopfzeile (D-142), Tagesleiste oder Pfeile am Datum (in D-178 verworfen).

## 5. Craft

- **Haltung: vorhanden.** Orange bedeutet nur Protein, Hauptaktion und Training. Die Statusfarben kommen aus der Terrakotta-Familie und zeigen Status nie nur über Farbe. Zahlen stehen in Bricolage mit gleich breiten Ziffern. Das deckt sich mit `branding.md` (Markenfarbe für Hauptaktionen und Status, ansonsten zurückhaltend).
- **Template-Check:** Warme Sandfläche mit Terrakotta-Akzent ist eines der drei Looks, die generierte Oberflächen gerade dominieren. Hier ist er aber begründet (in D-021 nach vielen Runden gewählt, Bezug „Glut“/„Night Court“) und mit einer Grotesk statt einer Serifenschrift umgesetzt. Kein Handlungsbedarf, nur nicht weiter in Richtung „Cream & Serif“ schieben.
- **Weglassen:** Auf „Heute“ lässt sich nichts ohne Verlust streichen. Mit V4 entfällt der Kopf „Einträge“ mit den zwei Icon-Buttons zugunsten einer reinen Überschrift.

## 6. Was gut ist (bitte so lassen)

- Großer Titel „Hey, [Name].“ in 34 px entspricht dem iOS-Large-Title (34 pt).
- Ladezustände im fertigen Layout ohne Springen (D-157), passt zu `loading.md`.
- Status mit Symbol und Farbe (✓ ↓ ↑), `accessibility.md`: „Convey information with more than color alone.“
- Löschen geht auch ohne Geste über „Eintrag löschen“ im Sheet (D-105), `accessibility.md`: „Offer alternatives to gestures.“
- Ein Sheet zur Zeit im Hinzufügen-Ablauf, `sheets.md`: „Display only one sheet at a time.“
- Dialog-Texte: Titel als Frage, konkreter Button „Löschen“, „Abbrechen“ (`alerts.md › Buttons`).
- `prefers-reduced-motion` schaltet alle Animationen und weiches Scrollen ab (D-147).
- Dark Mode: alle geprüften Text-Kombinationen ≥ 4,8 : 1, Statusfarben ≥ 4,98 : 1.
- Kein Glas, keine Verläufe, keine harten Schatten. Das ist bei einer Web-App richtig, weil Glas nur der schwebenden Bedienebene zusteht (`liquid-glass.md`).

## 7. Kontrastwerte (berechnet aus `tokens.css`, WCAG)

| Paar | Light | Dark |
|---|---|---|
| `--text-muted` auf `--surface` | 5,47 | 5,71 |
| `--text-muted` auf `--tonal` | **4,19** | 4,81 |
| `--accent-text` auf `--surface` | 5,32 | 7,41 |
| `--on-accent` auf `--accent` (Primärbutton) | 4,59 | 6,42 |
| `--accent` auf `--tonal` (Icon) | **2,13** | 4,90 |
| `--accent` auf `--surface` (Marker) | 2,78 | 5,82 |
| Status-Pills (13 px fett) ok / unter / über | 4,49 / 4,22 / 4,45 (fett: 3 : 1 reicht) | 5,98 / 5,99 / 4,98 |

## 8. Offene Entscheidungen für dich

1. **V4 Aktionsleiste unten** (Screen 01): freigeben, verwerfen oder anpassen?
2. **C1 Textgröße**: Option A (voll), B (gedeckelt, Empfehlung) oder C (so lassen)?
3. **C3 `--text-muted` Light** auf `#63574B` anpassen?
4. **V2 Sheets wegwischen**: als Prototyp mit Gerätetest umsetzen?
5. **K1–K3**: Bestätigst du, dass die Entscheidungen bleiben?

Alles andere (V1, V3, V5, V6, V8, C2) ist konfliktfrei und kann nach deiner Freigabe als Roadmap-Item eingeplant werden. Nach dem Plan-Schritt gehen die Entscheidungen in `docs/DECISIONS.md` ein.
