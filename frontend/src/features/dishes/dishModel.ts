import type { Dish, DishIngredient } from '../../api/dishes.ts';
import type { Food, FoodType } from '../../api/foods.ts';
import { nutrientsFor, type PerBasis } from '../../domain/foodAmounts.ts';
import type { Basis, Unit } from '../../domain/units.ts';

export type FoodUnit = Exclude<Unit, 'portion'>;

/** One ingredient while editing a dish (screen 12). */
export interface EditorIngredient {
  key: string;
  foodId: number;
  name: string;
  foodType: FoodType;
  basis: Basis;
  /** Values per basis (per 100 g/ml or per piece). */
  perBasis: PerBasis;
  packageAmount: number | null;
  /** g or ml of one piece on a g/ml basis (D-170). */
  pieceWeight: number | null;
  amount: number;
  unit: FoodUnit;
}

let counter = 0;
const nextKey = () => `i${String(++counter)}`;

/** Meal prep default (BRIEFING §8): the whole package, otherwise one piece (also with a piece weight) or 100 g/ml. */
export function ingredientFromFood(food: Food): EditorIngredient {
  const pkg = food.packageAmount !== null && food.packageAmount > 0;
  const pieces = food.basis === 'per_unit' || (food.pieceWeight !== null && food.pieceWeight > 0);
  const unit: FoodUnit = pkg ? 'packung' : pieces ? 'stueck' : food.basis === 'per_100ml' ? 'ml' : 'g';
  return {
    key: nextKey(),
    foodId: food.id,
    name: food.name,
    foodType: food.type,
    basis: food.basis,
    perBasis: food.nutrients,
    packageAmount: food.packageAmount,
    pieceWeight: food.pieceWeight,
    amount: pkg || unit === 'stueck' ? 1 : 100,
    unit,
  };
}

/**
 * Restores an ingredient of a saved dish ("Nochmal kochen", editing). Per-basis values are derived from the snapshot;
 * the package size is only known if the ingredient was entered in packages.
 */
export function ingredientFromDish(i: DishIngredient): EditorIngredient | null {
  if (i.foodId === null || i.quantity <= 0) {
    return null;
  }
  const basis: Basis =
    i.basis ?? (i.unit === 'ml' ? 'per_100ml' : i.unit === 'stueck' ? 'per_unit' : 'per_100g');
  const factor = basis === 'per_unit' ? 1 / i.quantity : 100 / i.quantity;
  const n = i.nutrients;
  return {
    key: nextKey(),
    foodId: i.foodId,
    name: i.name,
    foodType: i.foodType,
    basis,
    perBasis: {
      kcal: n.kcal * factor,
      protein: n.protein * factor,
      carbs: n.carbs * factor,
      sugar: n.sugar * factor,
      fat: n.fat * factor,
    },
    packageAmount: i.unit === 'packung' && i.amount > 0 ? i.quantity / i.amount : null,
    pieceWeight: i.unit === 'stueck' && basis !== 'per_unit' && i.amount > 0 ? i.quantity / i.amount : null,
    amount: i.amount,
    unit: i.unit,
  };
}

export function ingredientNutrients(i: EditorIngredient): PerBasis {
  return (
    nutrientsFor(
      { basis: i.basis, nutrients: i.perBasis, packageAmount: i.packageAmount, pieceWeight: i.pieceWeight },
      i.amount,
      i.unit,
    ) ?? {
      kcal: 0,
      protein: 0,
      carbs: 0,
      sugar: 0,
      fat: 0,
    }
  );
}

export function dishTotals(ingredients: readonly EditorIngredient[]): PerBasis {
  const total = { kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0 };
  for (const i of ingredients) {
    const n = ingredientNutrients(i);
    total.kcal += n.kcal;
    total.protein += n.protein;
    total.carbs += n.carbs;
    total.sugar += n.sugar;
    total.fat += n.fat;
  }
  return total;
}

export function perPortion(total: PerBasis, portions: number): PerBasis {
  const d = portions > 0 ? portions : 1;
  return {
    kcal: total.kcal / d,
    protein: total.protein / d,
    carbs: total.carbs / d,
    sugar: total.sugar / d,
    fat: total.fat / d,
  };
}

const cookedDate = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

/** "gekocht So., 18.10." */
export function cookedText(dish: Pick<Dish, 'cookedOn'>): string {
  return `gekocht ${cookedDate.format(new Date(`${dish.cookedOn}T12:00:00Z`))}`;
}
