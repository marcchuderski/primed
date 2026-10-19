import { useCallback, useEffect, useState } from 'react';
import type { Day } from '../../api/days.ts';
import { createEntry, createShakeEntry, fetchShakes, type Entry, type Shake } from '../../api/entries.ts';
import { fetchDishes, logDishPortion, type Dish } from '../../api/dishes.ts';
import {
  createFood,
  draftFromOff,
  lookupBarcode,
  type Food,
  type FoodDraft,
  type OffProduct,
} from '../../api/foods.ts';
import { categoryLabel, displayName } from '../../domain/categories.ts';
import { formatDecimal } from '../../domain/format.ts';
import { recentDays } from '../../domain/dates.ts';
import { defaultAmount, nutrientsFor } from '../../domain/foodAmounts.ts';
import { berlinWallMinute, MINUTES_PER_DAY, roundUpToQuarterHour } from '../../domain/time.ts';
import type { Macros } from '../../domain/types.ts';
import { allowedUnits, basisLabel } from '../../domain/units.ts';
import { cookedText } from '../dishes/dishModel.ts';
import { DishEditorSheet } from '../dishes/DishEditorSheet.tsx';
import { QuantitySheet, type QuantityFood } from '../entries/QuantitySheet.tsx';
import { ProductSheet } from '../foods/ProductSheet.tsx';
import { AddSheet } from './AddSheet.tsx';
import { ScannerSheet } from './ScannerSheet.tsx';

type View =
  | { kind: 'search' }
  | { kind: 'scan' }
  | { kind: 'quantity'; item: { source: 'library'; food: Food } | { source: 'off'; product: OffProduct } }
  | { kind: 'product'; initial: Partial<FoodDraft>; notice: string | null }
  | { kind: 'dish'; dish: Dish }
  | { kind: 'cook' };

function nowMinute(): number {
  return roundUpToQuarterHour(berlinWallMinute(new Date())) % MINUTES_PER_DAY;
}

function quantityFood(
  item: { source: 'library'; food: Food } | { source: 'off'; product: OffProduct },
): QuantityFood {
  const f = item.source === 'library' ? item.food : item.product;
  const isNew = item.source === 'off';
  return {
    name: item.source === 'off' ? displayName(item.product.name, item.product.brand) : f.name,
    subtitle: `${categoryLabel(f.category)} · ${isNew ? 'Neu · wird gespeichert' : basisLabel(f.basis)}`,
    basis: f.basis,
    packageAmount: f.packageAmount,
    units: allowedUnits(f.basis, f.packageAmount),
    nutrientsFor: (amount, unit) => nutrientsFor(f, amount, unit),
  };
}

/**
 * The "+" flow (BRIEFING §7): search/quick add → amount; scan → amount or "Produkt anlegen".
 * Online products are saved to the library when they are logged for the first time (BRIEFING §6).
 */
export function AddFlow({
  day,
  eatenBefore,
  onClose,
  onAdded,
}: {
  day: Day;
  eatenBefore: Macros;
  onClose: () => void;
  onAdded: (entry: Entry) => void;
}) {
  const [view, setView] = useState<View>({ kind: 'search' });
  const [shakes, setShakes] = useState<Shake[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  // The quick view fills in one go once shakes and dishes are settled (D-157), instead of section by section.
  const [quickReady, setQuickReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const shakesLoaded = fetchShakes()
      .then((list) => {
        if (!cancelled) {
          setShakes(list);
        }
      })
      .catch(() => {
        // Shakes are optional (e.g. protein powder deleted).
      });
    const dishesLoaded = fetchDishes('active')
      .then((list) => {
        if (!cancelled) {
          setDishes(list);
        }
      })
      .catch(() => {
        // Optional section.
      });
    void Promise.all([shakesLoaded, dishesLoaded]).then(() => {
      if (!cancelled) {
        setQuickReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onDetected = useCallback((ean: string) => {
    lookupBarcode(ean)
      .then((result) => {
        if (result === null) {
          setView({
            kind: 'product',
            initial: { barcode: ean },
            notice: 'Dieses Produkt kennen wir noch nicht. Leg es einmal an, danach findest du es per Scan.',
          });
        } else if (result.source === 'library') {
          setView({ kind: 'quantity', item: { source: 'library', food: result.food } });
        } else {
          setView({ kind: 'quantity', item: { source: 'off', product: result.product } });
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Barcode konnte nicht geprüft werden.');
        setView({ kind: 'search' });
      });
  }, []);

  async function logShake(shake: Shake) {
    try {
      onAdded(await createShakeEntry({ date: day.date, timeMin: nowMinute(), shake: shake.id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Shake konnte nicht eingetragen werden.');
    }
  }

  return (
    <>
      {view.kind === 'search' && (
        <AddSheet
          open
          shakes={shakes}
          dishes={dishes}
          loading={!quickReady}
          onPickDish={(dish) => {
            setView({ kind: 'dish', dish });
          }}
          onCook={() => {
            setView({ kind: 'cook' });
          }}
          error={error}
          onClose={onClose}
          onPickFood={(food) => {
            setView({ kind: 'quantity', item: { source: 'library', food } });
          }}
          onPickOnline={(product) => {
            setView({ kind: 'quantity', item: { source: 'off', product } });
          }}
          onShake={(shake) => void logShake(shake)}
          onScan={() => {
            setView({ kind: 'scan' });
          }}
          onCreate={(name) => {
            setView({ kind: 'product', initial: name === '' ? {} : { name }, notice: null });
          }}
        />
      )}

      {view.kind === 'scan' && (
        <ScannerSheet
          open
          onDetected={onDetected}
          onClose={() => {
            setView({ kind: 'search' });
          }}
        />
      )}

      {view.kind === 'product' && (
        <ProductSheet
          open
          initial={view.initial}
          submitLabel="Speichern & Menge wählen"
          onClose={() => {
            setView({ kind: 'search' });
          }}
          onSubmit={async (draft) => {
            const food = await createFood(draft);
            setView({ kind: 'quantity', item: { source: 'library', food } });
          }}
        />
      )}

      {view.kind === 'cook' && (
        <DishEditorSheet
          open
          mode="new"
          onClose={() => {
            setView({ kind: 'search' });
          }}
          onSaved={(dish) => {
            setDishes((list) => [dish, ...list]);
            setView({ kind: 'dish', dish });
          }}
        />
      )}

      {view.kind === 'dish' && (
        <QuantitySheet
          open
          mode="add"
          food={{
            name: view.dish.name,
            subtitle: `${cookedText(view.dish)} · ${formatDecimal(view.dish.portionsLeft)} von ${formatDecimal(view.dish.portionsTotal)} übrig`,
            basis: 'per_unit',
            packageAmount: null,
            units: ['portion'],
            switcher: ['portion'],
            nutrientsFor: (amount) => {
              const t = view.dish.totals;
              const f = amount / view.dish.portionsTotal;
              const r = (v: number) => Math.round(v * f * 10) / 10;
              return {
                kcal: r(t.kcal),
                protein: r(t.protein),
                carbs: r(t.carbs),
                sugar: r(t.sugar),
                fat: r(t.fat),
              };
            },
          }}
          initial={{ amount: Math.min(1, view.dish.portionsLeft), unit: 'portion', timeMin: nowMinute() }}
          dates={recentDays(day.date)}
          targets={day.targets}
          eatenBefore={eatenBefore}
          onClose={() => {
            setView({ kind: 'search' });
          }}
          onSubmit={async ({ amount, timeMin, date }) => {
            onAdded(
              await logDishPortion({
                date: date ?? day.date,
                timeMin,
                dishId: view.dish.id,
                portions: amount,
              }),
            );
          }}
        />
      )}

      {view.kind === 'quantity' && (
        <QuantitySheet
          open
          mode="add"
          food={quantityFood(view.item)}
          initial={{
            ...defaultAmount(view.item.source === 'library' ? view.item.food : view.item.product),
            timeMin: nowMinute(),
          }}
          dates={recentDays(day.date)}
          targets={day.targets}
          eatenBefore={eatenBefore}
          onClose={() => {
            setView({ kind: 'search' });
          }}
          onSubmit={async ({ amount, unit, timeMin, date }) => {
            const item = view.item;
            const food = item.source === 'library' ? item.food : await createFood(draftFromOff(item.product));
            const entry = await createEntry({
              date: date ?? day.date,
              timeMin,
              foodId: food.id,
              amount,
              unit,
            });
            onAdded(entry);
          }}
        />
      )}
    </>
  );
}
