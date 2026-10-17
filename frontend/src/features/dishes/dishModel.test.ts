import type { Food } from '../../api/foods.ts';
import { dishTotals, ingredientFromDish, ingredientFromFood, perPortion } from './dishModel.ts';

const rice: Food = {
  id: 1,
  type: 'reference',
  name: 'Reis, roh',
  brand: null,
  barcode: null,
  category: 'basics',
  basis: 'per_100g',
  nutrients: { kcal: 351, protein: 7.9, carbs: 77.1, sugar: 0.3, fat: 0.6 },
  packageAmount: null,
  usageCount: 0,
  lastAmount: null,
  lastUnit: null,
};

describe('dishModel', () => {
  it('defaults to the whole package, otherwise 100 g', () => {
    expect(ingredientFromFood(rice)).toMatchObject({ amount: 100, unit: 'g' });
    expect(ingredientFromFood({ ...rice, packageAmount: 500 })).toMatchObject({ amount: 1, unit: 'packung' });
  });

  it('sums ingredients and splits portions evenly', () => {
    const a = { ...ingredientFromFood(rice), amount: 400 };
    const oil = {
      ...ingredientFromFood({
        ...rice,
        name: 'Olivenöl',
        nutrients: { kcal: 899, protein: 0, carbs: 0, sugar: 0, fat: 99.9 },
      }),
      amount: 2,
      unit: 'el' as const,
    };
    const total = dishTotals([a, oil]);
    expect(total.kcal).toBeCloseTo(1404 + 269.7, 1);
    expect(perPortion(total, 4).kcal).toBeCloseTo(418.4, 1);
  });

  it('restores saved ingredients from their snapshot, keeping package sizes', () => {
    const restored = ingredientFromDish({
      foodId: 5,
      name: 'Passierte Tomaten',
      foodType: 'ingredient',
      amount: 1,
      unit: 'packung',
      quantity: 500,
      basis: 'per_100g',
      nutrients: { kcal: 180, protein: 7, carbs: 30, sugar: 25, fat: 1 },
    });
    expect(restored).toMatchObject({ packageAmount: 500, perBasis: { kcal: 36 } });
    expect(
      ingredientFromDish({
        foodId: null,
        name: 'Gelöscht',
        foodType: 'product',
        amount: 1,
        unit: 'g',
        quantity: 1,
        basis: null,
        nutrients: { kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0 },
      }),
    ).toBeNull();
  });
});
