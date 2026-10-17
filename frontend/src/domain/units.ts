/**
 * Units and household measures (D-073). Mirrors api/src/Food/Units.php; both use units.cases.json.
 */
export type Basis = 'per_100g' | 'per_100ml' | 'per_unit';
export type Unit = 'g' | 'ml' | 'el' | 'tl' | 'packung' | 'stueck' | 'portion';

export const EL = 15;
export const TL = 5;

/** Order of the unit switcher (screen 06): g · ml · EL · TL · Packung (Stück only for per-piece foods). */
export const SWITCHER_UNITS: readonly Unit[] = ['g', 'ml', 'el', 'tl', 'packung'];

/** Units of foods (portions only exist for dishes). */
const ALLOWED: Record<Basis, readonly Unit[]> = {
  per_100g: ['g', 'el', 'tl', 'packung'],
  per_100ml: ['ml', 'el', 'tl', 'packung'],
  per_unit: ['stueck', 'packung'],
};

export function allowedUnits(basis: Basis, packageAmount: number | null): Unit[] {
  return ALLOWED[basis].filter((u) => u !== 'packung' || (packageAmount !== null && packageAmount > 0));
}

/** Entered amount → basis quantity (g, ml or pieces). */
export function toQuantity(basis: Basis, unit: Unit, amount: number, packageAmount: number | null): number {
  if (!ALLOWED[basis].includes(unit)) {
    throw new RangeError(`Unit ${unit} does not fit ${basis}`);
  }
  switch (unit) {
    case 'el':
      return amount * EL;
    case 'tl':
      return amount * TL;
    case 'packung':
      if (packageAmount === null || packageAmount <= 0) {
        throw new RangeError('No package size');
      }
      return amount * packageAmount;
    default:
      return amount;
  }
}

/** Short label of a unit; "Packung"/"Stück" agree with the amount. */
export function unitLabel(unit: Unit | 'portion', amount = 1): string {
  switch (unit) {
    case 'el':
      return 'EL';
    case 'tl':
      return 'TL';
    case 'packung':
      return amount === 1 ? 'Packung' : 'Packungen';
    case 'stueck':
      return 'Stück';
    case 'portion':
      return amount === 1 ? 'Portion' : 'Portionen';
    default:
      return unit;
  }
}

/** Base unit of a basis: g, ml or Stück. */
export function baseUnit(basis: Basis): 'g' | 'ml' | 'Stück' {
  return basis === 'per_100g' ? 'g' : basis === 'per_100ml' ? 'ml' : 'Stück';
}

/** Step of the −/+ buttons per unit. */
export function stepFor(unit: Unit): number {
  return unit === 'g' || unit === 'ml' ? 10 : unit === 'packung' || unit === 'portion' ? 0.5 : 1;
}

/** Quick-select chips per unit (screen 06). */
export function quickAmounts(unit: Unit): number[] {
  switch (unit) {
    case 'g':
      return [100, 150, 200];
    case 'ml':
      return [100, 200, 400];
    case 'packung':
      return [0.5, 1, 2];
    case 'portion':
      return [0.5, 1, 1.5];
    default:
      return [1, 2, 3];
  }
}

/** "pro 100 g", "pro 100 ml" or "pro Stück". */
export function basisLabel(basis: Basis): string {
  return basis === 'per_unit' ? 'pro Stück' : basis === 'per_100ml' ? 'pro 100 ml' : 'pro 100 g';
}
