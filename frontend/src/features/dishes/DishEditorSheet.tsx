import { Minus, Plus, ScanBarcode, Search } from 'lucide-react';
import { useState } from 'react';
import { createDish, updateDish, type Dish } from '../../api/dishes.ts';
import {
  adoptReference,
  createFood,
  draftFromOff,
  lookupBarcode,
  type Food,
  type FoodDraft,
} from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { formatDecimal, formatInt } from '../../domain/format.ts';
import { allowedUnits, basisLabel, toQuantity, unitLabel } from '../../domain/units.ts';
import { ScannerSheet } from '../add/ScannerSheet.tsx';
import { QuantitySheet } from '../entries/QuantitySheet.tsx';
import { ProductSheet } from '../foods/ProductSheet.tsx';
import {
  dishTotals,
  ingredientFromDish,
  ingredientFromFood,
  ingredientNutrients,
  perPortion,
  type EditorIngredient,
  type FoodUnit,
} from './dishModel.ts';
import styles from './DishEditorSheet.module.css';
import { IngredientSearchSheet } from './IngredientSearchSheet.tsx';

type Sub =
  | { kind: 'none' }
  | { kind: 'search' }
  | { kind: 'scan' }
  | { kind: 'product'; initial: Partial<FoodDraft> }
  | { kind: 'amount'; ingredient: EditorIngredient; isNew: boolean };

const ZERO_TARGETS = { kcal: 0, protein: 0, carbs: 0, sugar: 0 };
const ZERO = { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };

function amountText(i: EditorIngredient): string {
  const base = `${formatDecimal(i.amount)} ${unitLabel(i.unit, i.amount)}`;
  if (i.unit === 'g' || i.unit === 'ml' || i.unit === 'stueck') {
    return base;
  }
  try {
    const q = toQuantity(i.basis, i.unit, i.amount, i.packageAmount, i.pieceWeight);
    return `${base} · ${formatDecimal(q)} ${i.basis === 'per_100ml' ? 'ml' : 'g'}`;
  } catch {
    return base;
  }
}

/**
 * Screen 12 "Neues Gericht": name, ingredients (scan, search, reference values; default whole package),
 * live sum, portions (½ steps). Also edits a dish (D-046) and pre-fills "Nochmal kochen" (D-118).
 */
export function DishEditorSheet({
  open,
  dish,
  mode,
  onSaved,
  onDiscard,
  onClose,
}: {
  open: boolean;
  /** Existing dish (edit) or template (cook again). */
  dish?: Dish | undefined;
  mode: 'new' | 'edit' | 'again';
  onSaved: (dish: Dish) => void;
  onDiscard?: (() => void) | undefined;
  onClose: () => void;
}) {
  const [name, setName] = useState(dish?.name ?? '');
  const [portions, setPortions] = useState(dish?.portionsTotal ?? 4);
  const [ingredients, setIngredients] = useState<EditorIngredient[]>(() =>
    (dish?.ingredients ?? []).map(ingredientFromDish).filter((i): i is EditorIngredient => i !== null),
  );
  const [sub, setSub] = useState<Sub>({ kind: 'none' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = dishTotals(ingredients);
  const portion = perPortion(totals, portions);
  const eaten = dish === undefined || mode !== 'edit' ? 0 : dish.portionsTotal - dish.portionsLeft;

  function addFood(food: Food) {
    setSub({ kind: 'amount', ingredient: ingredientFromFood(food), isNew: true });
  }

  function onBarcode(ean: string) {
    lookupBarcode(ean)
      .then(async (result) => {
        if (result === null) {
          // Scanned in the meal prep editor → created as "Zutat" (D-053).
          setSub({ kind: 'product', initial: { barcode: ean, type: 'ingredient' } });
        } else if (result.source === 'library') {
          addFood(result.food);
        } else {
          addFood(await createFood({ ...draftFromOff(result.product), type: 'ingredient' }));
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Barcode konnte nicht geprüft werden.');
        setSub({ kind: 'none' });
      });
  }

  async function save() {
    if (name.trim() === '') {
      setError('Bitte gib dem Gericht einen Namen.');
      return;
    }
    if (ingredients.length === 0) {
      setError('Füge mindestens eine Zutat hinzu.');
      return;
    }
    setBusy(true);
    setError(null);
    const draft = {
      name: name.trim(),
      portions,
      ingredients: ingredients.map((i) => ({ foodId: i.foodId, amount: i.amount, unit: i.unit })),
    };
    try {
      const saved =
        mode === 'edit' && dish !== undefined
          ? await updateDish(dish.id, draft)
          : await createDish({ ...draft, basedOnDishId: mode === 'again' ? (dish?.id ?? null) : null });
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
      setBusy(false);
    }
  }

  const title = mode === 'edit' ? 'Gericht bearbeiten' : 'Neues Gericht';
  const portionsText = formatDecimal(portions);

  return (
    <>
      <Sheet
        open={open}
        title={title}
        subtitle={mode === 'again' ? 'Nochmal kochen · Werte anpassen' : undefined}
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

        <div className={styles['head']}>
          <span className={styles['label']}>Zutaten · {ingredients.length}</span>
          <span className={styles['headButtons']}>
            <button
              type="button"
              className={styles['small']}
              onClick={() => {
                setSub({ kind: 'scan' });
              }}
            >
              <ScanBarcode size={16} strokeWidth={2.2} aria-hidden="true" /> Scannen
            </button>
            <button
              type="button"
              className={styles['small']}
              onClick={() => {
                setSub({ kind: 'search' });
              }}
            >
              <Search size={16} strokeWidth={2.2} aria-hidden="true" /> Suchen
            </button>
          </span>
        </div>

        <ul className={styles['list']}>
          {ingredients.length === 0 && (
            <li className={styles['empty']}>
              Noch keine Zutaten. Suche sie in deiner Bibliothek oder scanne die Packung.
            </li>
          )}
          {ingredients.map((i) => {
            const n = ingredientNutrients(i);
            return (
              <li key={i.key}>
                <button
                  type="button"
                  className={styles['row']}
                  aria-label={`${i.name}, ${amountText(i)}. Menge ändern`}
                  onClick={() => {
                    setSub({ kind: 'amount', ingredient: i, isNew: false });
                  }}
                >
                  <span className={styles['rowTexts']}>
                    <span className={styles['rowName']}>{i.name}</span>
                    <span className={styles['rowMeta']}>
                      {amountText(i)}
                      {i.foodType === 'reference' ? ' · Richtwert' : ''}
                    </span>
                  </span>
                  <span className={styles['rowValues']}>
                    <span>{formatInt(n.kcal)} kcal</span>
                    <span className={styles['protein']}>{formatInt(n.protein)} g P</span>
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className={styles['addRow']}
              onClick={() => {
                setSub({ kind: 'search' });
              }}
            >
              <Plus size={18} strokeWidth={2.2} aria-hidden="true" /> Zutat hinzufügen
            </button>
          </li>
        </ul>

        <div className={styles['summary']}>
          <div className={styles['total']}>
            <span>Gesamt</span>
            <span>
              {formatInt(totals.kcal)} kcal · {formatInt(totals.protein)} g P · {formatInt(totals.carbs)} g KH
              · {formatInt(totals.fat)} g F
            </span>
          </div>
          <div className={styles['portionRow']}>
            <span className={styles['portionKcal']}>
              <span>Pro Portion</span>
              <strong>
                {formatInt(portion.kcal)} <small>kcal</small>
              </strong>
            </span>
            <span className={styles['stepper']}>
              <button
                type="button"
                className={styles['step']}
                aria-label="Weniger Portionen"
                disabled={portions <= Math.max(0.5, eaten)}
                onClick={() => {
                  setPortions((p) => Math.max(0.5, eaten, p - 0.5));
                }}
              >
                <Minus size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <span aria-live="polite">{portionsText} Port.</span>
              <button
                type="button"
                className={styles['step']}
                aria-label="Mehr Portionen"
                onClick={() => {
                  setPortions((p) => Math.min(50, p + 0.5));
                }}
              >
                <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </span>
          </div>
          <div className={styles['macros']}>
            <span className={`${styles['macro'] ?? ''} ${styles['p'] ?? ''}`}>
              <strong>{formatInt(portion.protein)} g</strong>
              <span>Protein</span>
            </span>
            <span className={styles['macro']}>
              <strong>{formatInt(portion.carbs)} g</strong>
              <span>KH</span>
            </span>
            <span className={styles['macro']}>
              <strong>{formatInt(portion.fat)} g</strong>
              <span>Fett</span>
            </span>
          </div>
        </div>

        {error !== null && (
          <p className={styles['error']} role="alert">
            {error}
          </p>
        )}
        <Button size="large" block busy={busy} onClick={() => void save()}>
          {mode === 'edit' ? 'Speichern' : 'Zu den Gerichten'} · {portionsText} Portionen
        </Button>
        {mode === 'edit' && onDiscard !== undefined && dish?.status === 'active' && (
          <button type="button" className={styles['link']} onClick={onDiscard}>
            Rest entsorgen
          </button>
        )}
      </Sheet>

      {sub.kind === 'search' && (
        <IngredientSearchSheet
          open
          dishName={name}
          onClose={() => {
            setSub({ kind: 'none' });
          }}
          onPickFood={addFood}
          onPickReference={(reference) => {
            adoptReference(reference.id)
              .then(addFood)
              .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : 'Richtwert konnte nicht geladen werden.');
                setSub({ kind: 'none' });
              });
          }}
          onPickOnline={(product) => {
            createFood({ ...draftFromOff(product), type: 'ingredient' })
              .then(addFood)
              .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : 'Produkt konnte nicht gespeichert werden.');
                setSub({ kind: 'none' });
              });
          }}
          onScan={() => {
            setSub({ kind: 'scan' });
          }}
          onCreate={(query) => {
            setSub({
              kind: 'product',
              initial: { type: 'ingredient', ...(query === '' ? {} : { name: query }) },
            });
          }}
        />
      )}

      {sub.kind === 'scan' && (
        <ScannerSheet
          open
          onDetected={onBarcode}
          onClose={() => {
            setSub({ kind: 'none' });
          }}
        />
      )}

      {sub.kind === 'product' && (
        <ProductSheet
          open
          initial={sub.initial}
          submitLabel="Speichern & Menge wählen"
          onClose={() => {
            setSub({ kind: 'none' });
          }}
          onSubmit={async (draft) => {
            addFood(await createFood({ ...draft, type: sub.initial.type ?? draft.type }));
          }}
        />
      )}

      {sub.kind === 'amount' && (
        <QuantitySheet
          open
          mode="ingredient"
          food={{
            name: sub.ingredient.name,
            subtitle: `Zutat für ${name === '' ? 'dein Gericht' : name} · ${basisLabel(sub.ingredient.basis)}`,
            basis: sub.ingredient.basis,
            packageAmount: sub.ingredient.packageAmount,
            pieceWeight: sub.ingredient.pieceWeight,
            units: allowedUnits(
              sub.ingredient.basis,
              sub.ingredient.packageAmount,
              sub.ingredient.pieceWeight,
            ),
            nutrientsFor: (amount, unit) =>
              unit === 'portion' ? null : ingredientNutrients({ ...sub.ingredient, amount, unit }),
          }}
          initial={{ amount: sub.ingredient.amount, unit: sub.ingredient.unit, timeMin: 0 }}
          targets={ZERO_TARGETS}
          eatenBefore={ZERO}
          onClose={() => {
            setSub({ kind: 'none' });
          }}
          {...(sub.isNew
            ? {}
            : {
                onDelete: () => {
                  setIngredients((list) => list.filter((x) => x.key !== sub.ingredient.key));
                  setSub({ kind: 'none' });
                },
              })}
          onSubmit={({ amount, unit }) => {
            if (unit === 'portion') {
              return Promise.resolve();
            }
            const updated: EditorIngredient = { ...sub.ingredient, amount, unit: unit satisfies FoodUnit };
            setIngredients((list) =>
              sub.isNew ? [...list, updated] : list.map((x) => (x.key === updated.key ? updated : x)),
            );
            setSub({ kind: 'none' });
            return Promise.resolve();
          }}
        />
      )}
    </>
  );
}
