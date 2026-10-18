import { Plus, ScanBarcode, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createFood,
  deleteFood,
  draftFromOff,
  lookupBarcode,
  searchFoods,
  searchOnline,
  updateFood,
  type Food,
  type FoodDraft,
  type FoodType,
  type OffProduct,
} from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Footer } from '../../components/Footer/Footer.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { CATEGORIES, displayName, type Category } from '../../domain/categories.ts';
import { defaultAmount, nutrientsFor } from '../../domain/foodAmounts.ts';
import { formatDecimal, formatInt } from '../../domain/format.ts';
import { basisLabel, unitLabel } from '../../domain/units.ts';
import { ScannerSheet } from '../add/ScannerSheet.tsx';
import { DishesView } from '../dishes/DishesView.tsx';
import { ProductSheet } from '../foods/ProductSheet.tsx';
import styles from './EssenScreen.module.css';

const TYPES: { id: FoodType; label: string }[] = [
  { id: 'product', label: 'Markenprodukt' },
  { id: 'reference', label: 'Richtwert' },
  { id: 'ingredient', label: 'Zutat' },
];

/** Screens 10/11 "Essen": dishes (meal prep) and the food library with search, category pills and type filter. */
export function EssenScreen() {
  const [segment, setSegment] = useState<'gerichte' | 'bibliothek'>('gerichte');

  return (
    <div className={styles['screen']}>
      <h1 className={styles['title']}>Essen</h1>
      <div className={styles['segment']} role="group" aria-label="Ansicht">
        <button
          type="button"
          aria-pressed={segment === 'gerichte'}
          onClick={() => {
            setSegment('gerichte');
          }}
        >
          Gerichte
        </button>
        <button
          type="button"
          aria-pressed={segment === 'bibliothek'}
          onClick={() => {
            setSegment('bibliothek');
          }}
        >
          Bibliothek
        </button>
      </div>
      {segment === 'gerichte' ? <DishesView /> : <Library />}
      <Footer />
    </div>
  );
}

function Library() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [types, setTypes] = useState<FoodType[]>(['product', 'reference', 'ingredient']);
  const [foods, setFoods] = useState<Food[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [deleting, setDeleting] = useState<Food | null>(null);
  const [scanning, setScanning] = useState(false);
  /** New product: empty, prefilled from a scan, or with the search term as name. */
  const [creating, setCreating] = useState<Partial<FoodDraft> | null>(null);
  const [reload, setReload] = useState(0);
  const [online, setOnline] = useState<OffProduct[]>([]);
  const trimmed = query.trim();

  // Online hits as in "Zutat suchen": from 3 characters, a bit slower than the library search.
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

  // Scan: known products open for editing, online hits and unknown codes open "Neues Produkt" to check first.
  function onDetected(ean: string) {
    setScanning(false);
    lookupBarcode(ean)
      .then((result) => {
        if (result === null) {
          setCreating({ barcode: ean });
        } else if (result.source === 'library') {
          setEditing(result.food);
        } else {
          setCreating(draftFromOff(result.product));
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Barcode konnte nicht geprüft werden.');
      });
  }

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      searchFoods({ q: query, category, mealPrep: true })
        .then((list) => {
          if (!cancelled) {
            setFoods(list);
            setError(null);
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Bibliothek konnte nicht geladen werden.');
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query, category, reload]);

  const visible = (foods ?? []).filter((f) => types.includes(f.type));
  const filtered = types.length < TYPES.length;

  return (
    <>
      <div className={styles['searchRow']}>
        <label className={styles['search']}>
          <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          <input
            type="search"
            placeholder="In Bibliothek suchen …"
            aria-label="In Bibliothek suchen"
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
        <button
          type="button"
          className={styles['filter']}
          aria-label={filtered ? 'Filter nach Typ (aktiv)' : 'Filter nach Typ'}
          aria-haspopup="dialog"
          onClick={() => {
            setFilterOpen(true);
          }}
        >
          <SlidersHorizontal size={20} strokeWidth={2.2} aria-hidden="true" />
          {filtered && <span className={styles['dot']} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={styles['scan']}
          aria-label="Barcode scannen"
          aria-haspopup="dialog"
          onClick={() => {
            setScanning(true);
          }}
        >
          <ScanBarcode size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className={styles['pills']} role="group" aria-label="Kategorie">
        <button
          type="button"
          className={styles['pill']}
          aria-pressed={category === null}
          onClick={() => {
            setCategory(null);
          }}
        >
          Alle
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles['pill']}
            aria-pressed={category === c.id}
            onClick={() => {
              setCategory(c.id);
            }}
          >
            {c.short}
          </button>
        ))}
      </div>

      <div className={styles['listHead']}>
        <h2 className={styles['listTitle']}>Nach Häufigkeit</h2>
        <span>
          Typ:{' '}
          {types.length === 0
            ? 'keiner'
            : TYPES.filter((t) => types.includes(t.id))
                .map((t) => t.label)
                .join(', ')}
        </span>
      </div>

      {error !== null && <p role="alert">{error}</p>}
      {foods !== null && visible.length === 0 && <p className={styles['empty']}>Keine Einträge gefunden.</p>}
      {visible.length > 0 && (
        <ul className={styles['list']}>
          {visible.map((food) => {
            const { amount, unit } = defaultAmount(food);
            const hasLast = food.lastAmount !== null;
            const n = hasLast ? (nutrientsFor(food, amount, unit) ?? food.nutrients) : food.nutrients;
            return (
              <li key={food.id}>
                <button
                  type="button"
                  className={styles['item']}
                  onClick={() => {
                    setEditing(food);
                  }}
                >
                  <span className={styles['itemTexts']}>
                    <span className={styles['itemName']}>{food.name}</span>
                    <span className={styles['itemMeta']}>
                      {formatInt(n.kcal)} kcal ·{' '}
                      <span className={styles['protein']}>{formatInt(n.protein)} g P</span> ·{' '}
                      {hasLast
                        ? `${formatDecimal(amount)} ${unitLabel(unit, amount)}`
                        : basisLabel(food.basis)}
                    </span>
                  </span>
                  {food.type !== 'product' && (
                    <span className={styles['tag']}>{food.type === 'reference' ? 'Richtwert' : 'Zutat'}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {online.length > 0 && (
        <section className={styles['online']} aria-label="Online-Treffer">
          <h3 className={styles['onlineTitle']}>
            Online-Treffer <small>Daten: Open Food Facts</small>
          </h3>
          <ul className={styles['list']}>
            {online.map((product) => (
              <li key={product.barcode}>
                <button
                  type="button"
                  className={styles['onlineItem']}
                  onClick={() => {
                    setCreating(draftFromOff(product));
                  }}
                >
                  <span className={styles['onlineName']}>{displayName(product.name, product.brand)}</span>
                  <span className={styles['onlineMeta']}>
                    {formatInt(product.nutrients.kcal)} kcal ·{' '}
                    <span className={styles['protein']}>{formatInt(product.nutrients.protein)} g P</span> ·{' '}
                    {basisLabel(product.basis)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles['actions']}>
        <Button
          variant="tonal"
          onClick={() => {
            setScanning(true);
          }}
        >
          <ScanBarcode size={18} strokeWidth={2.2} aria-hidden="true" /> Scannen
        </Button>
        <Button
          variant="tonal"
          onClick={() => {
            const name = query.trim();
            setCreating(name === '' ? {} : { name });
          }}
        >
          <Plus size={18} strokeWidth={2.2} aria-hidden="true" /> Produkt anlegen
        </Button>
      </div>

      <p className={styles['note']}>
        Richtwerte: Max Rubner-Institut (2025), Bundeslebensmittelschlüssel 4.0, CC BY 4.0, DOI
        10.25826/Data20251217-134202-0; Werte gerundet. Online-Produkte: Open Food Facts (ODbL).
      </p>

      <Sheet
        open={filterOpen}
        title="Typ"
        onClose={() => {
          setFilterOpen(false);
        }}
      >
        {TYPES.map((t) => (
          <label key={t.id} className={styles['typeOption']}>
            {t.label}
            <input
              type="checkbox"
              checked={types.includes(t.id)}
              onChange={(e) => {
                setTypes(e.target.checked ? [...types, t.id] : types.filter((x) => x !== t.id));
              }}
            />
          </label>
        ))}
        <Button
          size="large"
          block
          onClick={() => {
            setFilterOpen(false);
          }}
        >
          Fertig
        </Button>
      </Sheet>

      {scanning && (
        <ScannerSheet
          open
          onDetected={onDetected}
          onClose={() => {
            setScanning(false);
          }}
        />
      )}

      {creating !== null && (
        <ProductSheet
          open
          initial={creating}
          submitLabel="In Bibliothek speichern"
          onClose={() => {
            setCreating(null);
          }}
          onSubmit={async (draft) => {
            await createFood(draft);
            setCreating(null);
            setReload((r) => r + 1);
          }}
        />
      )}

      {editing !== null && (
        <ProductSheet
          open
          food={editing}
          submitLabel="Speichern"
          onClose={() => {
            setEditing(null);
          }}
          onDelete={() => {
            setDeleting(editing);
          }}
          onSubmit={async (draft) => {
            await updateFood(editing.id, draft);
            setEditing(null);
            setReload((r) => r + 1);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Produkt löschen?"
        text={
          deleting === null
            ? ''
            : `${deleting.name} verschwindet aus Bibliothek und Suche. Bisherige Einträge bleiben unverändert.`
        }
        confirmLabel="Löschen"
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting === null) {
            return;
          }
          deleteFood(deleting.id)
            .then(() => {
              setDeleting(null);
              setEditing(null);
              setReload((r) => r + 1);
            })
            .catch((e: unknown) => {
              setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.');
              setDeleting(null);
            });
        }}
      />
    </>
  );
}
