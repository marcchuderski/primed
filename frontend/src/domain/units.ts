/**
 * Units and household measures (D-073). Mirrors api/src/Food/Units.php; both use units.cases.json.
 */
export type Basis = 'per_100g' | 'per_100ml' | 'per_unit';
export type Unit = 'g' | 'ml' | 'el' | 'tl' | 'packung' | 'stueck' | 'portion';

export const EL = 15;
export const TL = 5;

/** Order of the unit switcher (screen 06): g · ml · EL · TL · Packung (Stück only for per-piece foods). */
export const SWITCHER_UNITS: readonly Unit[] = ['g', 'ml', 'el', 'tl', 'packung'];

/** Switcher for a food: per piece Stück · Packung; with a piece weight base unit · Stück · EL · TL · Packung (D-170). */
export function switcherUnits(basis: Basis, pieceWeight: number | null): Unit[] {
  if (basis === 'per_unit') {
    return ['stueck', 'packung'];
  }
  if (pieceWeight !== null && pieceWeight > 0) {
    return [basis === 'per_100ml' ? 'ml' : 'g', 'stueck', 'el', 'tl', 'packung'];
  }
  return [...SWITCHER_UNITS];
}

/** Units of foods (portions only exist for dishes). */
const ALLOWED: Record<Basis, readonly Unit[]> = {
  per_100g: ['g', 'el', 'tl', 'packung'],
  per_100ml: ['ml', 'el', 'tl', 'packung'],
  per_unit: ['stueck', 'packung'],
};

/** Stück on a g/ml basis needs a piece weight (D-170). */
function hasPieces(basis: Basis, pieceWeight: number | null): pieceWeight is number {
  return basis !== 'per_unit' && pieceWeight !== null && pieceWeight > 0;
}

export function allowedUnits(
  basis: Basis,
  packageAmount: number | null,
  pieceWeight: number | null = null,
): Unit[] {
  const units = ALLOWED[basis].filter(
    (u) => u !== 'packung' || (packageAmount !== null && packageAmount > 0),
  );
  return hasPieces(basis, pieceWeight) ? [units[0] ?? 'g', 'stueck', ...units.slice(1)] : units;
}

/** Entered amount → basis quantity (g, ml or pieces). */
export function toQuantity(
  basis: Basis,
  unit: Unit,
  amount: number,
  packageAmount: number | null,
  pieceWeight: number | null = null,
): number {
  if (unit === 'stueck' && hasPieces(basis, pieceWeight)) {
    return amount * pieceWeight;
  }
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

/** Pieces go in halves up to this amount (half a roll, a slice of cake), whole pieces above. */
export const HALF_PIECES_UP_TO = 5;

/** Smallest amount the −/+ buttons reach. */
export function minAmount(unit: Unit): number {
  return unit === 'stueck' ? 0.5 : stepFor(unit);
}

/**
 * Next amount of the −/+ buttons (direction +1/−1). Pieces snap to halves up to 5 and to whole pieces above
 * (4,5 → 5 → 6 and back 6 → 5 → 4,5); other units move by their fixed step. Not clamped.
 */
export function stepAmount(unit: Unit, amount: number, direction: 1 | -1): number {
  if (unit !== 'stueck') {
    return amount + direction * stepFor(unit);
  }
  if (direction === 1) {
    return amount < HALF_PIECES_UP_TO ? Math.floor(amount * 2) / 2 + 0.5 : Math.floor(amount) + 1;
  }
  return amount <= HALF_PIECES_UP_TO ? Math.ceil(amount * 2) / 2 - 0.5 : Math.ceil(amount) - 1;
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
    case 'stueck':
      return [0.5, 1, 2];
    default:
      return [1, 2, 3];
  }
}

/** "pro 100 g", "pro 100 ml" or "pro Stück". */
export function basisLabel(basis: Basis): string {
  return basis === 'per_unit' ? 'pro Stück' : basis === 'per_100ml' ? 'pro 100 ml' : 'pro 100 g';
}
