export type Category = 'snacks' | 'dairy' | 'bread' | 'produce' | 'drinks' | 'basics';

/** Library categories (BRIEFING §6). */
export const CATEGORIES: readonly { id: Category; label: string; short: string }[] = [
  { id: 'snacks', label: 'Snacks & Riegel', short: 'Snacks' },
  { id: 'dairy', label: 'Milchprodukte & Quark', short: 'Milchprodukte' },
  { id: 'bread', label: 'Brot & Backwaren', short: 'Brot' },
  { id: 'produce', label: 'Obst & Gemüse', short: 'Obst & Gemüse' },
  { id: 'drinks', label: 'Getränke & Shakes', short: 'Getränke' },
  { id: 'basics', label: 'Grundnahrungsmittel', short: 'Grundnahrung' },
];

export function categoryLabel(id: string, variant: 'label' | 'short' = 'short'): string {
  const category = CATEGORIES.find((c) => c.id === id);
  return category === undefined ? id : category[variant];
}
