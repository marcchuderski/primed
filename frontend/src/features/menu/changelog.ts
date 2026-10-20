/** User-facing release notes (menu › Changelog, D-169). Newest first; the first entry is the app version. */
export interface Release {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  changes: readonly string[];
}

export const RELEASES: readonly Release[] = [
  {
    version: '1.1.0',
    date: '2026-10-20',
    changes: [
      'Neue Kategorien „Supplements“ und „Fertigessen“. Dein Standard-Proteinpulver liegt jetzt in Supplements.',
      'Suche bei „Hinzufügen“ mit Tabs: Bibliothek, Online und Richtwerte, jeweils mit Trefferzahl.',
      'Neue Produkte aus Barcode-Scan und Online-Suche starten mit einer Portion bzw. einer kleinen Packung statt 100 g.',
      'Tippst du auf eine Zahl, wird sie markiert und du kannst direkt überschreiben.',
      'Changelog im Menü.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-19',
    changes: ['Erste Version.'],
  },
];
