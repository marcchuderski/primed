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
  lastAmount?: number | null;
  lastUnit?: Unit | null;
}

/** Nutrients of an amount (same rounding as the API snapshot), or null if the unit does not fit. */
export function nutrientsFor(food: FoodLike, amount: number, unit: Unit): PerBasis | null {
  let quantity: number;
  try {
    quantity = toQuantity(food.basis, unit, amount, food.packageAmount);
  } catch {
    return null;
  }
  const factor = food.basis === 'per_unit' ? quantity : quantity / 100;
  const r = (v: number) => Math.round(v * factor * 10) / 10;
  const n = food.nutrients;
  return { kcal: r(n.kcal), protein: r(n.protein), carbs: r(n.carbs), sugar: r(n.sugar), fat: r(n.fat) };
}

/** Prefill (BRIEFING §5): the last used amount, otherwise 100 g/ml or 1 piece. */
export function defaultAmount(food: FoodLike): { amount: number; unit: Unit } {
  const units = allowedUnits(food.basis, food.packageAmount);
  if (
    food.lastAmount !== undefined &&
    food.lastAmount !== null &&
    food.lastUnit !== undefined &&
    food.lastUnit !== null &&
    units.includes(food.lastUnit)
  ) {
    return { amount: food.lastAmount, unit: food.lastUnit };
  }
  if (food.basis === 'per_unit') {
    return { amount: 1, unit: 'stueck' };
  }
  return { amount: 100, unit: food.basis === 'per_100ml' ? 'ml' : 'g' };
}
