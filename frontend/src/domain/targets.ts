import type { Macros, Targets } from './types.ts';

/** Sugar has no real target, only this reference (BRIEFING §3). */
export const SUGAR_REFERENCE_G = 50;

/**
 * Fat reference = remaining calories after protein and carbs, in grams (BRIEFING §3):
 * (kcal − protein × 4 − carbs × 4) / 9, rounded, never negative.
 */
export function fatReference(targets: Pick<Targets, 'kcal' | 'protein' | 'carbs'>): number {
  return Math.max(0, Math.round((targets.kcal - targets.protein * 4 - targets.carbs * 4) / 9));
}

/** Sums the macros of several entries. */
export function sumMacros(items: readonly Macros[]): Macros {
  return items.reduce<Macros>(
    (sum, m) => ({
      kcal: sum.kcal + m.kcal,
      protein: sum.protein + m.protein,
      carbs: sum.carbs + m.carbs,
      fat: sum.fat + m.fat,
      sugar: sum.sugar + m.sugar,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  );
}

/** Still open = target − eaten; negative values mean the target was exceeded. */
export function openValues(targets: Targets, eaten: Macros): Targets {
  return {
    kcal: targets.kcal - eaten.kcal,
    protein: targets.protein - eaten.protein,
    carbs: targets.carbs - eaten.carbs,
    sugar: targets.sugar - eaten.sugar,
  };
}
