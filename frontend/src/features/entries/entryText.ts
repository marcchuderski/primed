import type { Entry } from '../../api/entries.ts';
import { formatDecimal } from '../../domain/format.ts';
import { unitLabel } from '../../domain/units.ts';

/** "200 g", "1 Packung", "2 Stück" – the amount as entered. */
export function entryAmountText(entry: Pick<Entry, 'amount' | 'unit'>): string {
  return `${formatDecimal(entry.amount)} ${unitLabel(entry.unit, entry.amount)}`;
}
