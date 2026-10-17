import type { Dish } from '../../api/dishes.ts';
import type { Food } from '../../api/foods.ts';
import { buildCandidates } from './candidates.ts';

const food = (over: Partial<Food>): Food => ({
  id: 1,
  type: 'product',
  name: 'X',
  brand: null,
  barcode: null,
  category: 'snacks',
  basis: 'per_100g',
  nutrients: { kcal: 100, protein: 10, carbs: 10, sugar: 1, fat: 1 },
  packageAmount: null,
  usageCount: 2,
  lastAmount: 150,
  lastUnit: 'g',
  ...over,
});

describe('buildCandidates (D-122)', () => {
  it('uses only foods logged before, in their last amount', () => {
    const list = buildCandidates(
      [
        food({ id: 1, name: 'Skyr' }),
        food({ id: 2, name: 'Reis, roh', usageCount: 0, lastAmount: null, lastUnit: null }),
      ],
      [],
      [],
    );
    expect(list.map((c) => [c.name, c.amountText, c.nutrients.kcal])).toEqual([['Skyr', '150 g', 150]]);
  });

  it('never suggests protein powder or milk on their own, nor ingredients', () => {
    const list = buildCandidates(
      [
        food({ id: 5, name: 'ESN Whey' }),
        food({ id: 6, name: 'Milch 1,5 %' }),
        food({ id: 7, type: 'ingredient' }),
      ],
      [],
      [5, 6],
    );
    expect(list).toEqual([]);
  });

  it('offers dishes with at least one portion left', () => {
    const dish = (id: number, left: number) =>
      ({
        id,
        name: `D${String(id)}`,
        portionsLeft: left,
        perPortion: { kcal: 600, protein: 40, carbs: 60, sugar: 3, fat: 12 },
      }) as Dish;
    expect(buildCandidates([], [dish(1, 2), dish(2, 0.5)], []).map((c) => c.name)).toEqual(['D1']);
  });
});
