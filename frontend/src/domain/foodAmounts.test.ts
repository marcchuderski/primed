import { defaultAmount, nutrientsFor } from './foodAmounts.ts';

const quark = {
  basis: 'per_100g' as const,
  nutrients: { kcal: 67, protein: 12.4, carbs: 3.2, sugar: 2.6, fat: 0.5 },
  packageAmount: 200,
};

describe('nutrientsFor', () => {
  it('scales per-100 g values and supports packages and spoons', () => {
    expect(nutrientsFor(quark, 1, 'packung')).toEqual({
      kcal: 134,
      protein: 24.8,
      carbs: 6.4,
      sugar: 5.2,
      fat: 1,
    });
    expect(nutrientsFor(quark, 2, 'el')?.kcal).toBe(20.1);
    expect(nutrientsFor(quark, 1, 'ml')).toBeNull();
  });

  it('multiplies per-piece values', () => {
    const bar = {
      basis: 'per_unit' as const,
      nutrients: { kcal: 163, protein: 23, carbs: 12, sugar: 1.2, fat: 4.6 },
      packageAmount: null,
    };
    expect(nutrientsFor(bar, 2, 'stueck')?.protein).toBe(46);
  });
});

describe('defaultAmount', () => {
  it('prefills the last amount if its unit still fits', () => {
    expect(defaultAmount({ ...quark, lastAmount: 1, lastUnit: 'packung' })).toEqual({
      amount: 1,
      unit: 'packung',
    });
    expect(defaultAmount({ ...quark, packageAmount: null, lastAmount: 1, lastUnit: 'packung' })).toEqual({
      amount: 100,
      unit: 'g',
    });
  });

  it('falls back to 100 g/ml or one piece', () => {
    expect(defaultAmount({ ...quark, basis: 'per_100ml' })).toEqual({ amount: 100, unit: 'ml' });
    expect(defaultAmount({ ...quark, basis: 'per_unit' })).toEqual({ amount: 1, unit: 'stueck' });
  });
});

import { displayName } from './categories.ts';

describe('displayName', () => {
  it('prefixes the brand only when the name does not contain it', () => {
    expect(displayName('Skyr Natur', 'Milram')).toBe('Milram Skyr Natur');
    expect(displayName('Skyr Mocca', 'Skyr')).toBe('Skyr Mocca');
    expect(displayName('Skyr', null)).toBe('Skyr');
  });
});
