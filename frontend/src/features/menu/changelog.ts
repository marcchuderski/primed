/**
 * User-facing release notes (menu › Changelog, D-169). One style for every entry: "Stichwort: kurze Erklärung",
 * plain words, no final period. Newest first; the first entry is the app version.
 */
export interface Release {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  changes: readonly string[];
}

export const RELEASES: readonly Release[] = [
  {
    version: '1.4.0',
    date: '2026-10-29',
    changes: [
      'Tage nicht mitzählen: in der Tagesauswahl auf ⊘ tippen, z. B. bei Krankheit oder Urlaub',
      'Halbe Stück: bis 5 Stück in halben Schritten, z. B. ein halbes Brötchen',
      'Ruhigere Sheets: die Seite dahinter bewegt sich nicht mehr mit',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-10-20',
    changes: [
      'Leichter nachtragen: Datum oben antippen und einen der letzten 7 Tage wählen',
      'Verlauf: Tage antippen, um sie zu öffnen',
      'Wochenansicht: Richtwerte für Fett und Zucker wie auf Heute',
      'Suche: passende Treffer zuerst, z. B. Ei vor Weizenbrötchen',
      'Neuer Startscreen: übersichtlicher, Datum und Tagesart direkt nebeneinander',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-20',
    changes: [
      'Bessere Kategorien: Produkte aus Scan und Online-Suche landen treffsicherer',
      'Proteinpulver und Shakes: Pulver unter Supplements, fertige Shakes unter Milchprodukte',
      'Deine Bibliothek: in die neuen Kategorien einsortiert',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-20',
    changes: [
      'Neue Kategorien: klarer aufgeteilt, z. B. Supplements und Fertigessen',
      'Suche mit Tabs: Bibliothek, Online und Richtwerte mit Trefferzahl',
      'Über 100 Richtwerte: Bäckerei, Obst, Gemüse und Milchprodukte ohne Etikett',
      'Eintragen in Stück: z. B. 1 Brötchen, Gramm gehen weiterhin',
      'Passendere Startmenge: neue Produkte starten mit einer Portion statt 100 g',
      'Zahlen überschreiben: antippen markiert die Zahl, einfach lostippen',
      'Changelog: alle Neuerungen hier im Menü',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-19',
    changes: ['Erste Version: Tagesziele, Einträge, Bibliothek, Gerichte und Verlauf'],
  },
];
