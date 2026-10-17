import type { Dish } from '../../api/dishes.ts';
import type { Food } from '../../api/foods.ts';
import { nutrientsFor } from '../../domain/foodAmounts.ts';
import { formatDecimal } from '../../domain/format.ts';
import type { Candidate } from '../../domain/suggestions.ts';
import { unitLabel } from '../../domain/units.ts';

/**
 * Realistic one-tap suggestions only (D-122): dishes with at least one portion left, and foods the user has
 * actually logged before, in the amount they last used. Never ingredients, and never the foods that make up the
 * shakes (protein powder, milk) – those are suggested as shakes.
 */
export function buildCandidates(
  foods: readonly Food[],
  dishes: readonly Dish[],
  excludedFoodIds: readonly number[],
): Candidate[] {
  const excluded = new Set(excludedFoodIds);
  const foodCandidates = foods.flatMap((food): Candidate[] => {
    if (
      excluded.has(food.id) ||
      food.type === 'ingredient' ||
      food.lastAmount === null ||
      food.lastUnit === null ||
      food.usageCount === 0
    ) {
      return [];
    }
    const n = nutrientsFor(food, food.lastAmount, food.lastUnit);
    return n === null
      ? []
      : [
          {
            kind: 'food',
            id: food.id,
            name: food.name,
            amount: food.lastAmount,
            unit: food.lastUnit,
            amountText: `${formatDecimal(food.lastAmount)} ${unitLabel(food.lastUnit, food.lastAmount)}`,
            nutrients: n,
          },
        ];
  });
  const dishCandidates = dishes
    .filter((d) => d.portionsLeft >= 1)
    .map((d): Candidate => ({
      kind: 'dish',
      id: d.id,
      name: d.name,
      amount: 1,
      unit: 'portion',
      amountText: '1 Portion',
      nutrients: d.perPortion,
    }));
  return [...dishCandidates, ...foodCandidates];
}
