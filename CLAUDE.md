# CLAUDE.md – Arbeitsregeln für Primed

Diese Regeln gelten für jede Sitzung. Lies vor jeder Arbeit diese Datei, `docs/BRIEFING.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` und `design/DESIGN.md`.

## Grundprinzipien

1. **Maximale Sicherheit** ist das oberste Ziel. Im Zweifel die sicherere Lösung vorschlagen.
2. **Keine Annahmen.** Ist etwas unklar, unvollständig oder widersprüchlich: fragen, nicht raten. Offene Punkte stehen in `docs/BRIEFING.md` → „Offene Punkte“.
3. **Trade-offs entscheidet der Nutzer.** Sobald Sicherheit, Benutzerfreundlichkeit und Design (in beliebiger Kombination) gegeneinander stehen, triffst du **keine** Entscheidung selbst. Stelle die Optionen mit Vor- und Nachteilen dar, gib optional eine Empfehlung, und warte auf die Entscheidung.
4. **Alles andere darfst du selbst entscheiden**, und zwar so, wie es fachlich am besten ist. Dokumentiere die Entscheidung in `docs/DECISIONS.md`.
5. **Dokumentation läuft immer mit.** Kein Schritt gilt als fertig, solange die Doku nicht aktualisiert ist.

## Ablauf pro Implementierungsschritt

1. **Plan:** Schritt aus `docs/ROADMAP.md` nehmen, kurz planen, offene Fragen stellen. Bei Trade-offs Optionen vorlegen. Auf Freigabe warten.
2. **Umsetzen:** in kleinen, nachvollziehbaren Commits.
3. **Testen:** Unit-Tests für Fachlogik (Vitest), API-Tests (PHPUnit), Build muss fehlerfrei laufen.
4. **Security Audit:** nach **jedem** Implementierungsschritt mit dem Skill `agent-skills:security-and-hardening`. Ergebnis mit Datum, Umfang, Funden und Maßnahmen in `docs/SECURITY.md` eintragen. Kritische Funde vor dem nächsten Schritt beheben oder als Trade-off vorlegen.
5. **Doku aktualisieren:**
   - `docs/CHANGELOG.md`: was hat sich geändert
   - `docs/DECISIONS.md`: neue Entscheidungen (was, warum, Alternativen, wer entschieden hat)
   - `docs/ROADMAP.md`: Status der Items
   - `docs/ARCHITECTURE.md`: bei Änderungen an Struktur, Datenmodell, Schnittstellen
   - `docs/DEPLOYMENT.md`: bei neuen Migrationen oder Deploy-Schritten
6. **Zusammenfassung** an den Nutzer: was gemacht wurde, was offen ist, was als Nächstes kommt.

## Roadmap-Status

Jedes Item in `docs/ROADMAP.md` hat genau einen Status: `geplant` · `in Arbeit` · `fertig` · `verworfen` · `blockiert` (mit Grund).

## Konventionen

- **Sprache:** UI-Texte Deutsch in Du-Form. Doku Deutsch. Code, Bezeichner und Code-Kommentare Englisch.
- **Frontend:** TypeScript `strict`, ESLint + Prettier, React-Funktionskomponenten, Icons nur aus `lucide-react`, Farben/Typo nur über `design/tokens.css`.
- **Fachlogik** (Sollwerte, Checkpoints, Shake-Regeln, Bewertung, Bilanzen) als reine, getestete Funktionen in `frontend/src/domain/`, ohne UI-Abhängigkeiten.
- **API:** PHP mit `declare(strict_types=1);`, PSR-12, Composer, PDO mit vorbereiteten Statements, keine String-Konkatenation in SQL.
- **Geheimnisse:** niemals im Repo. Nur `.env.example` ohne echte Werte.
- **Abhängigkeiten:** sparsam, gepflegt, Versionen fixiert. Jede neue Abhängigkeit in `docs/DECISIONS.md` begründen.
- **Design:** Screens unter `design/screens/` sind die Referenz. Abweichungen nur nach Rückfrage.
