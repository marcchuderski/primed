export type Category =
  | 'meat'
  | 'dairy'
  | 'grains'
  | 'produce'
  | 'sauces'
  | 'snacks'
  | 'drinks'
  | 'meals'
  | 'supplements'
  | 'other';

/** Library categories in pill order (BRIEFING §6, D-172). */
export const CATEGORIES: readonly { id: Category; label: string; short: string }[] = [
  { id: 'meat', label: 'Fleisch, Fisch, Eier & pflanzliches Eiweiß', short: 'Eiweiß & Fleisch' },
  { id: 'dairy', label: 'Milchprodukte & Quark', short: 'Milchprodukte' },
  { id: 'grains', label: 'Getreide, Brot & Beilagen', short: 'Getreide & Beilagen' },
  { id: 'produce', label: 'Obst & Gemüse', short: 'Obst & Gemüse' },
  { id: 'sauces', label: 'Öle, Fette & Saucen', short: 'Öle & Saucen' },
  { id: 'snacks', label: 'Snacks & Riegel', short: 'Snacks' },
  { id: 'drinks', label: 'Getränke & Shakes', short: 'Getränke' },
  { id: 'meals', label: 'Fertigessen', short: 'Fertigessen' },
  { id: 'supplements', label: 'Supplements', short: 'Supplements' },
  { id: 'other', label: 'Sonstiges', short: 'Sonstiges' },
];

export function categoryLabel(id: string, variant: 'label' | 'short' = 'short'): string {
  const category = CATEGORIES.find((c) => c.id === id);
  return category === undefined ? id : category[variant];
}

/** "Milram Skyr Natur", but not "Skyr Skyr Mocca": the brand is only prefixed if the name lacks it. */
export function displayName(name: string, brand: string | null): string {
  if (brand === null || brand.trim() === '' || name.toLowerCase().includes(brand.trim().toLowerCase())) {
    return name;
  }
  return `${brand.trim()} ${name}`;
}
