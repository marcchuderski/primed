import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import type { EntryNutrients } from '../../api/entries.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { TimeWheel } from '../../components/Wheel/TimeWheel.tsx';
import { formatDecimal, formatInt } from '../../domain/format.ts';
import { formatClock, roundUpToQuarterHour, berlinWallMinute, MINUTES_PER_DAY } from '../../domain/time.ts';
import type { Macros, Targets } from '../../domain/types.ts';
import {
  baseUnit,
  quickAmounts,
  stepFor,
  SWITCHER_UNITS,
  toQuantity,
  unitLabel,
  type Basis,
  type Unit,
} from '../../domain/units.ts';
import styles from './QuantitySheet.module.css';

export interface QuantityFood {
  name: string;
  /** e.g. "Snacks · pro 100 g" */
  subtitle: string;
  basis: Basis;
  packageAmount: number | null;
  /** Units that may be chosen (others are shown disabled). */
  units: Unit[];
  /** Nutrients for an amount in a unit, or null if not computable. */
  nutrientsFor: (amount: number, unit: Unit) => EntryNutrients | null;
}

interface QuantitySheetProps {
  open: boolean;
  mode: 'add' | 'edit';
  food: QuantityFood;
  initial: { amount: number; unit: Unit; timeMin: number };
  targets: Targets;
  /** Eaten today without this entry. */
  eatenBefore: Macros;
  onSubmit: (value: { amount: number; unit: Unit; timeMin: number }) => Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
}

const MAX_AMOUNT = 10000;

function parseAmount(text: string): number | null {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT ? value : null;
}

function nowRounded(): number {
  return roundUpToQuarterHour(berlinWallMinute(new Date())) % MINUTES_PER_DAY;
}

/** Screen 06 "Menge": unit switch, amount stepper, quick chips, time wheel, "Danach offen". */
export function QuantitySheet({
  open,
  mode,
  food,
  initial,
  targets,
  eatenBefore,
  onSubmit,
  onDelete,
  onClose,
}: QuantitySheetProps) {
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [text, setText] = useState(formatDecimal(initial.amount));
  const [timeMin, setTimeMin] = useState(initial.timeMin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(text);
  const nutrients = amount === null ? null : food.nutrientsFor(amount, unit);
  const switcher = food.basis === 'per_unit' ? (['stueck', 'packung'] as Unit[]) : SWITCHER_UNITS;
  const base = baseUnit(food.basis);

  function setAmount(value: number) {
    const clamped = Math.min(MAX_AMOUNT, Math.max(stepFor(unit), Math.round(value * 100) / 100));
    setText(formatDecimal(clamped));
  }

  function changeUnit(next: Unit) {
    setUnit(next);
    setText(formatDecimal(quickAmounts(next)[0] ?? 1));
  }

  async function submit() {
    if (amount === null) {
      setError('Bitte gib eine Menge größer 0 ein.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ amount, unit, timeMin });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
      setBusy(false);
    }
  }

  let conversion: string | null = null;
  if (amount !== null && unit !== 'g' && unit !== 'ml' && unit !== 'stueck') {
    try {
      const quantity = toQuantity(food.basis, unit, amount, food.packageAmount);
      const one = toQuantity(food.basis, unit, 1, food.packageAmount);
      conversion = `= ${formatDecimal(quantity)} ${base} · 1 ${unitLabel(unit)} = ${formatDecimal(one)} ${base}`;
    } catch {
      conversion = null;
    }
  }

  const afterKcal = targets.kcal - eatenBefore.kcal - (nutrients?.kcal ?? 0);
  const afterProtein = targets.protein - eatenBefore.protein - (nutrients?.protein ?? 0);
  const pct = (value: number, target: number) =>
    target > 0 ? Math.max(0, Math.min(100, (value / target) * 100)) : 0;

  return (
    <Sheet open={open} title={food.name} subtitle={food.subtitle} onClose={onClose} tone="bg">
      <div className={styles['card']}>
        <div className={styles['segment']} role="group" aria-label="Einheit">
          {switcher.map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={u === unit}
              disabled={!food.units.includes(u)}
              onClick={() => {
                changeUnit(u);
              }}
            >
              {u === 'packung' ? 'Packung' : unitLabel(u)}
            </button>
          ))}
        </div>

        <div className={styles['stepper']}>
          <button
            type="button"
            className={styles['round']}
            aria-label="Weniger"
            onClick={() => {
              setAmount((amount ?? 0) - stepFor(unit));
            }}
          >
            <Minus size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <div className={styles['amountBox']}>
            <span className={styles['amountLine']}>
              <input
                className={styles['amount']}
                style={{ width: `${String(Math.max(1, text.length) + 0.4)}ch` }}
                inputMode="decimal"
                aria-label={`Menge in ${unitLabel(unit, 2)}`}
                value={text}
                onChange={(e) => {
                  setText(e.target.value.replace(/[^\d,.]/g, '').slice(0, 7));
                }}
              />
              <span className={styles['unit']}>{unitLabel(unit, amount ?? 1)}</span>
            </span>
            {conversion !== null && <span className={styles['conversion']}>{conversion}</span>}
          </div>
          <button
            type="button"
            className={`${styles['round'] ?? ''} ${styles['plus'] ?? ''}`}
            aria-label="Mehr"
            onClick={() => {
              setAmount((amount ?? 0) + stepFor(unit));
            }}
          >
            <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <div className={styles['chips']} role="group" aria-label="Schnellwahl">
          {quickAmounts(unit).map((q) => (
            <button
              key={q}
              type="button"
              className={styles['chip']}
              aria-pressed={amount === q}
              onClick={() => {
                setAmount(q);
              }}
            >
              {formatDecimal(q)} {unitLabel(unit, q)}
            </button>
          ))}
        </div>

        <div className={styles['nutrients']}>
          <span className={styles['nutrient']}>
            <strong>{nutrients === null ? '–' : formatInt(nutrients.kcal)}</strong>
            <span>kcal</span>
          </span>
          <span className={`${styles['nutrient'] ?? ''} ${styles['protein'] ?? ''}`}>
            <strong>{nutrients === null ? '–' : `${formatInt(nutrients.protein)} g`}</strong>
            <span>Protein</span>
          </span>
          <span className={styles['nutrient']}>
            <strong>{nutrients === null ? '–' : `${formatInt(nutrients.carbs)} g`}</strong>
            <span>KH</span>
          </span>
          <span className={styles['nutrient']}>
            <strong>{nutrients === null ? '–' : `${formatInt(nutrients.fat)} g`}</strong>
            <span>Fett</span>
          </span>
        </div>
      </div>

      <div className={styles['group']}>
        <div className={styles['groupHead']}>
          <span className={styles['label']}>Uhrzeit</span>
          <button
            type="button"
            className={styles['now']}
            onClick={() => {
              setTimeMin(nowRounded());
            }}
          >
            Jetzt
          </button>
        </div>
        <TimeWheel value={timeMin} onChange={setTimeMin} label="Uhrzeit" tone="surface" />
      </div>

      <div className={styles['after']}>
        <div className={styles['afterHead']}>
          <span className={styles['label']}>Danach offen</span>
          <span className={styles['legend']}>
            <span className={styles['legendSwatch']} aria-hidden="true" />
            dieser Eintrag
          </span>
        </div>
        <div className={styles['afterRow']}>
          <span className={styles['afterValues']}>
            <span>Kalorien</span>
            <span>
              <strong>{formatInt(afterKcal)}</strong> <span className={styles['muted']}>kcal</span>
            </span>
          </span>
          <span className={styles['miniBar']} aria-hidden="true">
            <span
              className={styles['miniEaten']}
              style={{ width: `${String(pct(eatenBefore.kcal, targets.kcal))}%` }}
            />
            <span
              className={styles['miniThis']}
              style={{ width: `${String(pct(nutrients?.kcal ?? 0, targets.kcal))}%` }}
            />
          </span>
        </div>
        <div className={styles['afterRow']}>
          <span className={styles['afterValues']}>
            <span>Protein</span>
            <span>
              <strong className={styles['afterProtein']}>{formatInt(afterProtein)}</strong>{' '}
              <span className={styles['muted']}>g</span>
            </span>
          </span>
          <span className={styles['miniBar']} aria-hidden="true">
            <span
              className={styles['miniEaten']}
              style={{ width: `${String(pct(eatenBefore.protein, targets.protein))}%` }}
            />
            <span
              className={styles['miniThis']}
              style={{ width: `${String(pct(nutrients?.protein ?? 0, targets.protein))}%` }}
            />
          </span>
        </div>
      </div>

      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
      <Button size="large" block busy={busy} disabled={amount === null} onClick={() => void submit()}>
        {mode === 'add' ? 'Hinzufügen' : 'Speichern'} · {formatClock(timeMin)}
      </Button>
      {mode === 'edit' && onDelete !== undefined && (
        <button type="button" className={styles['deleteLink']} onClick={onDelete}>
          Eintrag löschen
        </button>
      )}
    </Sheet>
  );
}
