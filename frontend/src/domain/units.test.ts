import cases from './units.cases.json';
import {
  allowedUnits,
  quickAmounts,
  stepFor,
  toQuantity,
  unitLabel,
  type Basis,
  type Unit,
} from './units.ts';

describe('toQuantity (shared cases with the API)', () => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    expect(toQuantity(c.basis as Basis, c.unit as Unit, c.amount, c.packageAmount)).toBeCloseTo(
      c.quantity,
      3,
    );
  });

  it('rejects units that do not fit the basis', () => {
    expect(() => toQuantity('per_100g', 'ml', 1, null)).toThrow(RangeError);
    expect(() => toQuantity('per_unit', 'el', 1, null)).toThrow(RangeError);
    expect(() => toQuantity('per_100g', 'packung', 1, null)).toThrow(RangeError);
  });
});

describe('unit helpers', () => {
  it('offers Packung only with a package size', () => {
    expect(allowedUnits('per_100g', null)).toEqual(['g', 'el', 'tl']);
    expect(allowedUnits('per_100ml', 1000)).toEqual(['ml', 'el', 'tl', 'packung']);
    expect(allowedUnits('per_unit', null)).toEqual(['stueck']);
  });

  it('labels, steps and quick amounts', () => {
    expect(unitLabel('packung', 2)).toBe('Packungen');
    expect(unitLabel('el')).toBe('EL');
    expect(stepFor('g')).toBe(10);
    expect(stepFor('packung')).toBe(0.5);
    expect(quickAmounts('el')).toEqual([1, 2, 3]);
  });
});
