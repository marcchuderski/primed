import type { Basis, Unit } from './units.ts';
import { allowedUnits, toQuantity } from './units.ts';

export interface PerBasis {
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
}

export interface FoodLike {
  basis: Basis;
  nutrients: PerBasis;
  packageAmount: number | null;
  pieceWeight?: number | null;
  lastAmount?: number | null;
  lastUnit?: Unit | null;
  servingAmount?: number | null;
}

/** Up to this package size, a new product starts with "1 Packung" (single packs, D-168). */
export const SINGLE_PACK_MAX = 250;

/** Nutrients of an amount (same rounding as the API snapshot), or null if the unit does not fit. */
export function nutrientsFor(food: FoodLike, amount: number, unit: Unit): PerBasis | null {
  let quantity: number;
  try {
    quantity = toQuantity(food.basis, unit, amount, food.packageAmount, food.pieceWeight ?? null);
  } catch {
    return null;
  }
  const factor = food.basis === 'per_unit' ? quantity : quantity / 100;
  const r = (v: number) => Math.round(v * factor * 10) / 10;
  const n = food.nutrients;
  return { kcal: r(n.kcal), protein: r(n.protein), carbs: r(n.carbs), sugar: r(n.sugar), fat: r(n.fat) };
}

/**
 * Prefill (BRIEFING §5, D-168, D-170): the last used amount; otherwise 1 piece (also with a piece weight),
 * one serving (Open Food Facts), 1 Packung for small packs, else 100 g/ml.
 */
export function defaultAmount(food: FoodLike): { amount: number; unit: Unit } {
  const units = allowedUnits(food.basis, food.packageAmount, food.pieceWeight ?? null);
  if (
    food.lastAmount !== undefined &&
    food.lastAmount !== null &&
    food.lastUnit !== undefined &&
    food.lastUnit !== null &&
    units.includes(food.lastUnit)
  ) {
    return { amount: food.lastAmount, unit: food.lastUnit };
  }
  if (food.basis === 'per_unit' || units.includes('stueck')) {
    return { amount: 1, unit: 'stueck' };
  }
  const base: Unit = food.basis === 'per_100ml' ? 'ml' : 'g';
  if (food.servingAmount !== undefined && food.servingAmount !== null && food.servingAmount > 0) {
    return { amount: food.servingAmount, unit: base };
  }
  if (food.packageAmount !== null && food.packageAmount <= SINGLE_PACK_MAX && units.includes('packung')) {
    return { amount: 1, unit: 'packung' };
  }
  return { amount: 100, unit: base };
}
