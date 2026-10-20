import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Food, FoodDraft, FoodType } from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { selectOnFocus } from '../../components/selectOnFocus.ts';
import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { formatDecimal } from '../../domain/format.ts';
import type { Basis } from '../../domain/units.ts';
import styles from './ProductSheet.module.css';

type Field = 'kcal' | 'protein' | 'carbs' | 'sugar' | 'fat' | 'packageAmount';

/** Step per value (D-011): kcal ±20, protein/carbs/sugar ±1, fat ±0,5, package ±50. */
const ROWS: { field: Field; label: string; step: number; unit: (basis: Basis) => string; max: number }[] = [
  { field: 'kcal', label: 'Kalorien', step: 20, unit: () => 'kcal', max: 3000 },
  { field: 'protein', label: 'Protein', step: 1, unit: () => 'g', max: 500 },
  { field: 'carbs', label: 'Kohlenhydrate', step: 1, unit: () => 'g', max: 500 },
  { field: 'sugar', label: 'davon Zucker', step: 1, unit: () => 'g', max: 500 },
  { field: 'fat', label: 'Fett', step: 0.5, unit: () => 'g', max: 500 },
  {
    field: 'packageAmount',
    label: 'Packungsgröße',
    step: 50,
    unit: (b) => (b === 'per_100g' ? 'g' : b === 'per_100ml' ? 'ml' : 'Stück'),
    max: 100000,
  },
];

const BASES: { id: Basis; label: string }[] = [
  { id: 'per_100g', label: '100 g' },
  { id: 'per_100ml', label: '100 ml' },
  { id: 'per_unit', label: 'Stück' },
];

const TYPES: { id: FoodType; label: string }[] = [
  { id: 'product', label: 'Markenprodukt' },
  { id: 'reference', label: 'Richtwert' },
  { id: 'ingredient', label: 'Zutat' },
];

function parse(text: string): number | null {
  if (text.trim() === '') {
    return null;
  }
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export interface ProductSheetProps {
  open: boolean;
  /** Existing food (edit) or initial values (create, e.g. from a scan or search term). */
  food?: Food | undefined;
  initial?: Partial<FoodDraft> | undefined;
  submitLabel: string;
  onSubmit: (draft: FoodDraft) => Promise<void>;
  onDelete?: (() => void) | undefined;
  onClose: () => void;
}

/** Screen 07 "Neues Produkt": stepper list, values as on the package (D-011, D-073). */
export function ProductSheet({
  open,
  food,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  onClose,
}: ProductSheetProps) {
  const start: Partial<FoodDraft> = food === undefined ? (initial ?? {}) : { ...food, ...food.nutrients };
  const [name, setName] = useState(start.name ?? '');
  const [type, setType] = useState<FoodType>(start.type ?? 'product');
  const [category, setCategory] = useState<Category>(start.category ?? 'snacks');
  const [basis, setBasis] = useState<Basis>(start.basis ?? 'per_100g');
  const [values, setValues] = useState<Record<Field, string>>({
    kcal: start.kcal === undefined ? '' : formatDecimal(start.kcal),
    protein: start.protein === undefined ? '' : formatDecimal(start.protein),
    carbs: start.carbs === undefined ? '' : formatDecimal(start.carbs),
    sugar: start.sugar === undefined ? '' : formatDecimal(start.sugar),
    fat: start.fat === undefined ? '' : formatDecimal(start.fat),
    packageAmount:
      start.packageAmount === undefined || start.packageAmount === null
        ? ''
        : formatDecimal(start.packageAmount),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function step(row: (typeof ROWS)[number], direction: 1 | -1) {
    const current = parse(values[row.field]) ?? 0;
    const next = Math.min(row.max, Math.max(0, Math.round((current + direction * row.step) * 10) / 10));
    setValues({ ...values, [row.field]: formatDecimal(next) });
  }

  async function submit() {
    const kcal = parse(values.kcal);
    const protein = parse(values.protein);
    const carbs = parse(values.carbs);
    const sugar = parse(values.sugar) ?? 0;
    const fat = parse(values.fat);
    const packageAmount = parse(values.packageAmount);
    if (name.trim() === '') {
      setError('Bitte gib einen Namen ein.');
      return;
    }
    if (kcal === null || protein === null || carbs === null || fat === null) {
      setError('Bitte fülle Kalorien, Protein, Kohlenhydrate und Fett aus.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        type,
        name: name.trim(),
        brand: food?.brand ?? initial?.brand ?? null,
        barcode: food?.barcode ?? initial?.barcode ?? null,
        category,
        basis,
        kcal,
        protein,
        carbs,
        sugar,
        fat,
        packageAmount: packageAmount === null || packageAmount === 0 ? null : packageAmount,
        ...(initial?.source === undefined ? {} : { source: initial.source }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
      setBusy(false);
    }
  }

  const barcode = food?.barcode ?? initial?.barcode ?? null;

  return (
    <Sheet
      open={open}
      title={food === undefined ? 'Neues Produkt' : 'Produkt bearbeiten'}
      onClose={onClose}
      tone="bg"
    >
      <label className={styles['name']}>
        <span>Name</span>
        <input
          value={name}
          maxLength={120}
          autoComplete="off"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </label>
      {barcode !== null && <p className={styles['barcode']}>Barcode {barcode} wird verknüpft.</p>}

      <div className={styles['pills']} role="group" aria-label="Kategorie">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles['pill']}
            aria-pressed={c.id === category}
            onClick={() => {
              setCategory(c.id);
            }}
          >
            {c.short}
          </button>
        ))}
      </div>

      {food !== undefined && (
        <div className={styles['group']}>
          <span className={styles['label']}>Typ</span>
          <div className={`${styles['segment'] ?? ''} ${styles['fit'] ?? ''}`} role="group" aria-label="Typ">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === type}
                onClick={() => {
                  setType(t.id);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles['group']}>
        <span className={styles['label']} id="basis-label">
          Nährwerte angeben pro
        </span>
        <div className={styles['segment']} role="group" aria-labelledby="basis-label">
          {BASES.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={b.id === basis}
              onClick={() => {
                setBasis(b.id);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        <span className={styles['hint']}>So, wie es auf der Packung steht.</span>
      </div>

      <div className={styles['list']}>
        {ROWS.map((row) => (
          <div key={row.field} className={styles['row']}>
            <span
              className={`${styles['rowLabel'] ?? ''} ${row.field === 'protein' ? (styles['protein'] ?? '') : ''}`}
            >
              <strong>{row.label}</strong>
              <span>
                ±{formatDecimal(row.step)} {row.unit(basis)}
              </span>
            </span>
            <span className={styles['stepper']}>
              <button
                type="button"
                className={styles['step']}
                aria-label={`${row.label} verringern`}
                onClick={() => {
                  step(row, -1);
                }}
              >
                <Minus size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <span className={styles['value']}>
                <input
                  inputMode="decimal"
                  onFocus={selectOnFocus}
                  aria-label={`${row.label} in ${row.unit(basis)}`}
                  value={values[row.field]}
                  placeholder="0"
                  onChange={(e) => {
                    setValues({ ...values, [row.field]: e.target.value.replace(/[^\d,.]/g, '').slice(0, 7) });
                  }}
                />
                <span>{row.unit(basis)}</span>
              </span>
              <button
                type="button"
                className={`${styles['step'] ?? ''} ${styles['plus'] ?? ''}`}
                aria-label={`${row.label} erhöhen`}
                onClick={() => {
                  step(row, 1);
                }}
              >
                <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </span>
          </div>
        ))}
      </div>

      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
      <Button size="large" block busy={busy} onClick={() => void submit()}>
        {submitLabel}
      </Button>
      {onDelete !== undefined && (
        <button type="button" className={styles['deleteLink']} onClick={onDelete}>
          Produkt löschen
        </button>
      )}
    </Sheet>
  );
}
