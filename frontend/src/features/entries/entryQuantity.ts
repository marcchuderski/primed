import type { Entry, EntryNutrients } from '../../api/entries.ts';
import { allowedUnits, baseUnit, toQuantity, type Unit } from '../../domain/units.ts';
import type { QuantityFood } from './QuantitySheet.tsx';

/**
 * Editing an existing entry scales its stored snapshot (never recomputes from the food, D-036).
 */
export function quantityFoodForEntry(entry: Entry): QuantityFood {
  const basis = entry.basis;
  const units: Unit[] =
    basis === null
      ? entry.unit === 'portion'
        ? []
        : [entry.unit]
      : allowedUnits(basis, entry.packageAmount, entry.pieceWeight);

  return {
    name: entry.name,
    subtitle:
      basis === null
        ? 'Eintrag bearbeiten'
        : `Eintrag · pro ${basis === 'per_unit' ? 'Stück' : `100 ${baseUnit(basis)}`}`,
    basis: basis ?? 'per_100g',
    packageAmount: entry.packageAmount,
    pieceWeight: entry.pieceWeight,
    units,
    nutrientsFor: (amount: number, unit: Unit): EntryNutrients | null => {
      let quantity: number;
      if (unit === entry.unit) {
        quantity = entry.quantity * (amount / entry.amount);
      } else if (basis !== null) {
        try {
          quantity = toQuantity(basis, unit, amount, entry.packageAmount, entry.pieceWeight);
        } catch {
          return null;
        }
      } else {
        return null;
      }
      const factor = quantity / entry.quantity;
      const scale = (v: number) => Math.round(v * factor * 10) / 10;
      const n = entry.nutrients;
      return {
        kcal: scale(n.kcal),
        protein: scale(n.protein),
        carbs: scale(n.carbs),
        sugar: scale(n.sugar),
        fat: scale(n.fat),
      };
    },
  };
}
