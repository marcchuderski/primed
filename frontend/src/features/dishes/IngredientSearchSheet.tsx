import { Plus, ScanBarcode, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { searchFoods, searchOnline, type Food, type OffProduct } from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { displayName } from '../../domain/categories.ts';
import { formatInt } from '../../domain/format.ts';
import { basisLabel } from '../../domain/units.ts';
import styles from '../add/AddSheet.module.css';

/** Search for a dish ingredient: library incl. ingredients and reference values, plus Open Food Facts. */
export function IngredientSearchSheet({
  open,
  dishName,
  onPickFood,
  onPickOnline,
  onScan,
  onCreate,
  onClose,
}: {
  open: boolean;
  dishName: string;
  onPickFood: (food: Food) => void;
  onPickOnline: (product: OffProduct) => void;
  onScan: () => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [online, setOnline] = useState<OffProduct[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      searchFoods({ q: trimmed, mealPrep: true })
        .then((list) => {
          if (!cancelled) {
            setFoods(list);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFoods([]);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [trimmed]);

  useEffect(() => {
    if (trimmed.length < 3) {
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(() => {
      searchOnline(trimmed)
        .then((list) => {
          if (!cancelled) {
            setOnline(list);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOnline([]);
          }
        });
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [trimmed]);

  return (
    <Sheet
      open={open}
      title="Zutat suchen"
      subtitle={`für ${dishName === '' ? 'dein Gericht' : dishName}`}
      onClose={onClose}
      tone="bg"
    >
      <div className={styles['searchRow']}>
        <label className={styles['search']}>
          <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          <input
            type="search"
            placeholder="Zutat suchen …"
            aria-label="Zutat suchen"
            autoComplete="off"
            maxLength={60}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 3) {
                setOnline([]);
              }
            }}
          />
        </label>
        <button type="button" className={styles['scan']} aria-label="Barcode scannen" onClick={onScan}>
          <ScanBarcode size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <section className={styles['section']} aria-label="Deine Bibliothek">
        <h3 className={styles['sectionTitle']}>Deine Bibliothek</h3>
        {foods.length === 0 && <p className={styles['empty']}>Nichts gefunden.</p>}
        <ul className={styles['list']}>
          {foods.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                className={styles['item']}
                onClick={() => {
                  onPickFood(food);
                }}
              >
                <span className={styles['itemTexts']}>
                  <span className={styles['itemName']}>{food.name}</span>
                  <span className={styles['itemMeta']}>
                    {formatInt(food.nutrients.kcal)} kcal ·{' '}
                    <span className={styles['protein']}>{formatInt(food.nutrients.protein)} g P</span> ·{' '}
                    {basisLabel(food.basis)}
                  </span>
                </span>
                {food.type !== 'product' && (
                  <span className={styles['tag']}>{food.type === 'reference' ? 'Richtwert' : 'Zutat'}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {online.length > 0 && (
        <section className={styles['section']} aria-label="Online-Treffer">
          <h3 className={styles['sectionTitle']}>
            Online-Treffer <small>Daten: Open Food Facts</small>
          </h3>
          <ul className={styles['list']}>
            {online.map((product) => (
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
                      <span className={styles['protein']}>{formatInt(product.nutrients.protein)} g P</span> ·{' '}
                      {basisLabel(product.basis)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles['footer']}>
        <Button variant="tonal" onClick={onScan}>
          <ScanBarcode size={18} strokeWidth={2.2} aria-hidden="true" /> Scannen
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
    </Sheet>
  );
}
