import { describe, expect, it } from 'vitest';
import { draftFromOff, type OffProduct } from './foods.ts';

const banana: OffProduct = {
  barcode: '2000000000001',
  name: 'Banane',
  brand: null,
  category: 'produce',
  basis: 'per_100g',
  nutrients: { kcal: 95, protein: 1, carbs: 21, sugar: 17, fat: 0.2 },
  packageAmount: null,
};

describe('draftFromOff', () => {
  it('keeps a barcode with a valid check digit', () => {
    expect(draftFromOff({ ...banana, barcode: '4006381333931' }).barcode).toBe('4006381333931');
  });

  it('drops store-internal codes with an invalid check digit (server would reject them)', () => {
    const draft = draftFromOff(banana);
    expect(draft.barcode).toBeNull();
    expect(draft.name).toBe('Banane');
    expect(draft.source).toBe('off');
  });
});
