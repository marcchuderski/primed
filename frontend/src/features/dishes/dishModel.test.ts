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
  pieceWeight: null,
  usageCount: 0,
  lastAmount: null,
  lastUnit: null,
};

describe('dishModel', () => {
  it('defaults to the whole package, otherwise 100 g', () => {
    expect(ingredientFromFood(rice)).toMatchObject({ amount: 100, unit: 'g' });
    expect(ingredientFromFood({ ...rice, packageAmount: 500 })).toMatchObject({ amount: 1, unit: 'packung' });
  });

  it('counts foods with a piece weight in pieces and restores the weight from a saved dish (D-170)', () => {
    const potato = {
      ...rice,
      name: 'Kartoffel',
      nutrients: { ...rice.nutrients, kcal: 70 },
      pieceWeight: 150,
    };
    const fresh = ingredientFromFood(potato);
    expect(fresh).toMatchObject({ amount: 1, unit: 'stueck', pieceWeight: 150 });
    expect(dishTotals([{ ...fresh, amount: 4 }]).kcal).toBeCloseTo(420, 1);

    const restored = ingredientFromDish({
      foodId: 1,
      name: 'Kartoffel',
      foodType: 'reference',
      amount: 4,
      unit: 'stueck',
      quantity: 600,
      basis: 'per_100g',
      nutrients: { kcal: 420, protein: 0, carbs: 0, sugar: 0, fat: 0 },
    });
    expect(restored).toMatchObject({ basis: 'per_100g', pieceWeight: 150, unit: 'stueck' });
    expect(restored === null ? null : dishTotals([{ ...restored, amount: 2 }]).kcal).toBeCloseTo(210, 1);
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
