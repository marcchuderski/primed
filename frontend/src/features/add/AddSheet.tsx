import { ChefHat, Plus, ScanBarcode, Search } from 'lucide-react';
import type { Dish } from '../../api/dishes.ts';
import { useEffect, useState } from 'react';
import type { Shake } from '../../api/entries.ts';
import {
  fetchFrequentFoods,
  searchFoods,
  searchOnline,
  type Food,
  type OffProduct,
} from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { defaultAmount, nutrientsFor } from '../../domain/foodAmounts.ts';
import { formatDecimal, formatInt } from '../../domain/format.ts';
import { displayName } from '../../domain/categories.ts';
import { basisLabel, unitLabel } from '../../domain/units.ts';
import styles from './AddSheet.module.css';

const ONLINE_MIN_CHARS = 3;

interface AddSheetProps {
  open: boolean;
  shakes: Shake[];
  onPickFood: (food: Food) => void;
  onPickOnline: (product: OffProduct) => void;
  onShake: (shake: Shake) => void;
  onScan: () => void;
  onCreate: (name: string) => void;
  onClose: () => void;
  error?: string | null;
  dishes?: Dish[];
  onPickDish?: (dish: Dish) => void;
  onCook?: () => void;
}

const LIQUID_SHORT: Record<Shake['liquid'], string> = {
  milk_low: '1,5 %',
  milk_high: '3,5 %',
  water: 'Wasser',
};

/** Screens 04 + 05: quick add (shakes, frequent at this time) and search (library, online, reference values). */
export function AddSheet({
  open,
  shakes,
  onPickFood,
  onPickOnline,
  onShake,
  onScan,
  onCreate,
  onClose,
  error = null,
  dishes = [],
  onPickDish,
  onCook,
}: AddSheetProps) {
  const [query, setQuery] = useState('');
  const [frequent, setFrequent] = useState<Food[]>([]);
  const [library, setLibrary] = useState<Food[] | null>(null);
  const [online, setOnline] = useState<OffProduct[] | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const trimmed = query.trim();

  useEffect(() => {
    let cancelled = false;
    fetchFrequentFoods()
      .then((foods) => {
        if (!cancelled) {
          setFrequent(foods);
        }
      })
      .catch(() => {
        // Optional section; the search still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Library search (debounced).
  useEffect(() => {
    if (trimmed === '') {
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(() => {
      searchFoods({ q: trimmed })
        .then((foods) => {
          if (!cancelled) {
            setLibrary(foods);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLibrary([]);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [trimmed]);

  // Online search (Open Food Facts via the API, debounced, at least 3 characters).
  useEffect(() => {
    if (trimmed.length < ONLINE_MIN_CHARS) {
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(() => {
      searchOnline(trimmed)
        .then((products) => {
          if (!cancelled) {
            setOnline(products);
            setOnlineError(null);
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setOnline([]);
            setOnlineError(e instanceof Error ? e.message : 'Online-Suche nicht möglich.');
          }
        });
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [trimmed]);

  const own = (library ?? []).filter((f) => f.type !== 'reference');
  const references = (library ?? []).filter((f) => f.type === 'reference');

  const sheetHeader = (
    <div className={styles['searchRow']}>
      <label className={styles['search']}>
        <Search size={18} strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          placeholder="Suchen …"
          aria-label="Lebensmittel suchen"
          autoComplete="off"
          maxLength={60}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim() === '') {
              setLibrary(null);
              setOnline(null);
            }
          }}
        />
      </label>
      <button type="button" className={styles['scan']} aria-label="Barcode scannen" onClick={onScan}>
        <ScanBarcode size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
  const sheetFooter = (
    <div className={styles['footer']}>
      <Button variant="tonal" onClick={onCook}>
        <ChefHat size={18} strokeWidth={2.2} aria-hidden="true" /> Gericht zubereiten
      </Button>
      <Button
        variant="tonal"
        onClick={() => {
          onCreate(trimmed);
        }}
      >
        <Plus size={18} strokeWidth={2.2} aria-hidden="true" /> Produkt anlegen
      </Button>
    </div>
  );

  return (
    <Sheet
      open={open}
      title="Hinzufügen"
      onClose={onClose}
      tone="bg"
      header={sheetHeader}
      footer={sheetFooter}
    >
      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}

      {trimmed === '' ? (
        <>
          {dishes.length > 0 && (
            <section className={styles['section']} aria-label="Gerichte">
              <h3 className={styles['sectionTitle']}>Gerichte</h3>
              <div className={styles['dishes']}>
                {dishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    className={styles['dish']}
                    onClick={() => onPickDish?.(dish)}
                  >
                    <span className={styles['itemName']}>{dish.name}</span>
                    <span className={styles['itemMeta']}>
                      {formatInt(dish.perPortion.kcal)} kcal ·{' '}
                      <span className={styles['protein']}>{formatInt(dish.perPortion.protein)} g P</span>
                    </span>
                    <span className={styles['left']}>{formatDecimal(dish.portionsLeft)} übrig</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {shakes.length > 0 && (
            <section className={styles['section']} aria-label="Shakes">
              <h3 className={styles['sectionTitle']}>Shakes</h3>
              <div className={styles['shakes']}>
                {shakes.map((shake) => (
                  <button
                    key={shake.id}
                    type="button"
                    className={styles['shake']}
                    aria-label={`${shake.name} eintragen: ${formatInt(shake.nutrients.kcal)} kcal, ${formatInt(shake.nutrients.protein)} g Protein`}
                    onClick={() => {
                      onShake(shake);
                    }}
                  >
                    <strong>
                      {shake.size === 'big' ? 'Groß' : 'Klein'} · {LIQUID_SHORT[shake.liquid]}
                    </strong>
                    <span>
                      {formatInt(shake.nutrients.kcal)} · {formatInt(shake.nutrients.protein)} g P
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {frequent.length > 0 && (
            <section className={styles['section']} aria-label="Häufig um diese Zeit">
              <h3 className={styles['sectionTitle']}>Häufig um diese Zeit</h3>
              <FoodList foods={frequent} onPick={onPickFood} showAmount />
            </section>
          )}
        </>
      ) : (
        <>
          <section className={styles['section']} aria-label="Deine Bibliothek">
            <h3 className={styles['sectionTitle']}>Deine Bibliothek</h3>
            {library !== null && own.length === 0 ? (
              <p className={styles['empty']}>Noch nichts mit „{trimmed}“ gespeichert.</p>
            ) : (
              <FoodList foods={own} onPick={onPickFood} />
            )}
          </section>
          {trimmed.length >= ONLINE_MIN_CHARS && (
            <section className={styles['section']} aria-label="Online-Treffer">
              <h3 className={styles['sectionTitle']}>
                Online-Treffer <small>Daten: Open Food Facts</small>
              </h3>
              {onlineError !== null && <p className={styles['empty']}>{onlineError}</p>}
              {online === null && onlineError === null && <p className={styles['empty']}>Suche läuft …</p>}
              {online !== null && online.length === 0 && onlineError === null && (
                <p className={styles['empty']}>Keine Online-Treffer.</p>
              )}
              <ul className={styles['list']}>
                {(online ?? []).map((product) => (
                  <li key={product.barcode}>
                    <button
                      type="button"
                      className={styles['item']}
                      onClick={() => {
                        onPickOnline(product);
                      }}
                    >
                      <span className={styles['itemTexts']}>
                        <span className={styles['itemName']}>{displayName(product.name, product.brand)}</span>
                        <span className={styles['itemMeta']}>
                          {formatInt(product.nutrients.kcal)} kcal ·{' '}
                          <span className={styles['protein']}>
                            {formatInt(product.nutrients.protein)} g P
                          </span>{' '}
                          · {basisLabel(product.basis)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {references.length > 0 && (
            <section className={styles['section']} aria-label="Richtwerte">
              <h3 className={styles['sectionTitle']}>
                Richtwerte · unverpackt <small>Quelle: BLS 4.0 (MRI, CC BY 4.0)</small>
              </h3>
              <FoodList foods={references} onPick={onPickFood} />
            </section>
          )}
        </>
      )}
    </Sheet>
  );
}

function FoodList({
  foods,
  onPick,
  showAmount = false,
}: {
  foods: Food[];
  onPick: (food: Food) => void;
  showAmount?: boolean;
}) {
  return (
    <ul className={styles['list']}>
      {foods.map((food) => {
        const { amount, unit } = defaultAmount(food);
        // With an amount shown, the values belong to that amount (screen 04); otherwise per basis.
        const values = showAmount ? (nutrientsFor(food, amount, unit) ?? food.nutrients) : food.nutrients;
        return (
          <li key={food.id}>
            <button
              type="button"
              className={styles['item']}
              onClick={() => {
                onPick(food);
              }}
            >
              <span className={styles['itemTexts']}>
                <span className={styles['itemName']}>{food.name}</span>
                <span className={styles['itemMeta']}>
                  {formatInt(values.kcal)} kcal ·{' '}
                  <span className={styles['protein']}>{formatInt(values.protein)} g P</span> ·{' '}
                  {showAmount
                    ? `${formatDecimal(amount)} ${unitLabel(unit, amount)}`
                    : basisLabel(food.basis)}
                </span>
              </span>
              {food.type === 'reference' && <span className={styles['tag']}>Richtwert</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
