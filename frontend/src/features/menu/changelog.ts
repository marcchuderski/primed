/** User-facing release notes (menu › Changelog, D-169): short, plain words. Newest first; the first entry is the app version. */
export interface Release {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  changes: readonly string[];
}

export const RELEASES: readonly Release[] = [
  {
    version: '1.3.0',
    date: '2026-10-20',
    changes: [
      'Vergangene Tage ansehen und nachtragen, bis 7 Tage zurück',
      'Tage im Verlauf antippen',
      'Neuer Kopf auf Heute',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-20',
    changes: [
      'Treffsicherere Kategorien beim Scannen und in der Online-Suche',
      'Proteinpulver landen in Supplements, fertige Shakes in Milchprodukte',
      'Deine Bibliothek ist in die neuen Kategorien einsortiert',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-20',
    changes: [
      'Neue und verbesserte Kategorienstruktur',
      'Übersichtlichere Suche mit Tabs',
      'Über 100 Richtwerte für Bäckerei, Obst, Gemüse und Milchprodukte',
      'Eintragen in Stück, z. B. 1 Brötchen',
      'Passendere Startmenge bei neuen Produkten',
      'Zahlen lassen sich direkt überschreiben',
      'Changelog im Menü',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-19',
    changes: ['Erste Version.'],
  },
];
