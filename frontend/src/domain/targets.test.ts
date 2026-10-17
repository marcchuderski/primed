import { fatReference, openValues, sumMacros } from './targets.ts';

describe('fatReference', () => {
  // Values from docs/DEFAULTS.md.
  it.each([
    [2000, 150, 200, 67],
    [2300, 150, 250, 78],
    [2600, 150, 300, 89],
    [2600, 150, 350, 67],
    [2800, 150, 400, 67],
  ])('%i kcal, %i g P, %i g KH → %i g', (kcal, protein, carbs, expected) => {
    expect(fatReference({ kcal, protein, carbs })).toBe(expected);
  });

  it('never goes negative', () => {
    expect(fatReference({ kcal: 1000, protein: 150, carbs: 200 })).toBe(0);
  });
});

describe('sumMacros / openValues', () => {
  const a = { kcal: 640, protein: 42, carbs: 78, fat: 16, sugar: 9 };
  const b = { kcal: 134, protein: 24.8, carbs: 6.4, fat: 1, sugar: 5.2 };

  it('sums all macros', () => {
    expect(sumMacros([a, b])).toEqual({ kcal: 774, protein: 66.8, carbs: 84.4, fat: 17, sugar: 14.2 });
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });
  });

  it('computes open values, negative when exceeded', () => {
    expect(openValues({ kcal: 700, protein: 150, carbs: 350, sugar: 10 }, sumMacros([a, b]))).toEqual({
      kcal: -74,
      protein: 150 - 66.8,
      carbs: 350 - 84.4,
      sugar: 10 - 14.2,
    });
  });
});
