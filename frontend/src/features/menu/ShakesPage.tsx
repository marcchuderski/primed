import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateSettings, type Settings } from '../../api/days.ts';
import { fetchFood, searchFoods, type Food } from '../../api/foods.ts';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { displayName } from '../../domain/categories.ts';
import { SettingRow, SettingsPage } from './SettingsPage.tsx';
import { useAutoSave } from './useAutoSave.ts';
import addStyles from '../add/AddSheet.module.css';
import styles from './Settings.module.css';

type Slot = 'proteinPowder' | 'milkLow' | 'milkHigh';

const SLOTS: {
  id: Slot;
  label: string;
  field: 'proteinPowderFoodId' | 'milkLowFoodId' | 'milkHighFoodId';
}[] = [
  { id: 'proteinPowder', label: 'Aktuelles Proteinpulver', field: 'proteinPowderFoodId' },
  { id: 'milkLow', label: 'Milch für 1,5 %', field: 'milkLowFoodId' },
  { id: 'milkHigh', label: 'Milch für 3,5 %', field: 'milkHighFoodId' },
];

/** Shakes (BRIEFING §9): protein powder, the two milks and the amounts. */
export function ShakesPage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [foods, setFoods] = useState(settings.shakeFoods);
  const [names, setNames] = useState<Partial<Record<Slot, string>>>({});
  const [amounts, setAmounts] = useState(settings.shakeAmounts);
  const [picking, setPicking] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saver = useAutoSave(async (value: Settings['shakeAmounts']) => {
    await updateSettings({ shake: value });
  });

  useEffect(() => {
    for (const slot of SLOTS) {
      const id = settings.shakeFoods[slot.id];
      if (id !== null) {
        fetchFood(id)
          .then((food) => {
            setNames((n) => ({ ...n, [slot.id]: displayName(food.name, food.brand) }));
          })
          .catch(() => undefined);
      }
    }
  }, [settings.shakeFoods]);

  async function choose(slot: Slot, food: Food | null) {
    const field = SLOTS.find((s) => s.id === slot)?.field;
    if (field === undefined) {
      return;
    }
    setError(null);
    try {
      const saved = await updateSettings({ shake: { [field]: food?.id ?? null } });
      setFoods(saved.shakeFoods);
      setNames((n) => ({ ...n, [slot]: food === null ? undefined : displayName(food.name, food.brand) }));
      setPicking(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    }
  }

  const change = (patch: Partial<Settings['shakeAmounts']>) => {
    const next = { ...amounts, ...patch };
    setAmounts(next);
    saver.schedule(next);
  };

  return (
    <SettingsPage title="Shakes" onBack={onBack} status={saver.status} error={saver.error ?? error}>
      <section className={styles['section']} aria-labelledby="shake-foods">
        <h2 id="shake-foods" className={styles['sectionLabel']}>
          Zutaten aus deiner Bibliothek
        </h2>
        <div className={styles['card']}>
          {SLOTS.map((slot) => (
            <button
              key={slot.id}
              type="button"
              className={styles['link']}
              aria-haspopup="dialog"
              onClick={() => {
                setPicking(slot.id);
              }}
            >
              <span className={styles['linkTexts']}>
                <span className={styles['linkName']}>{slot.label}</span>
                <span className={styles['linkMeta']}>
                  {foods[slot.id] === null ? 'Nicht gewählt' : (names[slot.id] ?? '…')}
                </span>
              </span>
              <ChevronRight size={20} strokeWidth={2.2} className={styles['chevron']} aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className={styles['hint']}>
          Proteinpulver und Shake-Milch tauchen in den Vorschlägen nie einzeln auf, nur als Shake.
        </p>
      </section>

      <section className={styles['section']} aria-labelledby="shake-amounts">
        <h2 id="shake-amounts" className={styles['sectionLabel']}>
          Mengen
        </h2>
        <div className={styles['card']}>
          <SettingRow label="Milch, großer Shake">
            <Stepper
              label="Milch groß"
              value={amounts.bigMl}
              min={100}
              max={1000}
              step={50}
              unit="ml"
              onChange={(bigMl) => {
                change({ bigMl });
              }}
            />
          </SettingRow>
          <SettingRow label="Milch, kleiner Shake">
            <Stepper
              label="Milch klein"
              value={amounts.smallMl}
              min={50}
              max={600}
              step={50}
              unit="ml"
              onChange={(smallMl) => {
                change({ smallMl });
              }}
            />
          </SettingRow>
          <SettingRow label="Proteinpulver" hint="pro Shake">
            <Stepper
              label="Proteinpulver"
              value={amounts.powderG}
              min={10}
              max={80}
              step={5}
              unit="g"
              onChange={(powderG) => {
                change({ powderG });
              }}
            />
          </SettingRow>
        </div>
      </section>

      {picking !== null && (
        <FoodPickerSheet
          title={SLOTS.find((s) => s.id === picking)?.label ?? ''}
          onPick={(food) => void choose(picking, food)}
          onClose={() => {
            setPicking(null);
          }}
        />
      )}
    </SettingsPage>
  );
}

/** Library search limited to foods with values per 100 g / 100 ml (the server rejects per piece). */
function FoodPickerSheet({
  title,
  onPick,
  onClose,
}: {
  title: string;
  onPick: (food: Food | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      searchFoods({ q: trimmed })
        .then((list) => {
          if (!cancelled) {
            setFoods(list.filter((f) => f.basis !== 'per_unit'));
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

  return (
    <Sheet open title={title} subtitle="aus deiner Bibliothek" onClose={onClose} tone="bg">
      <div className={addStyles['searchRow']}>
        <label className={addStyles['search']}>
          <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          <input
            type="search"
            placeholder="Suchen …"
            aria-label="Bibliothek durchsuchen"
            autoComplete="off"
            maxLength={60}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </label>
      </div>
      <ul className={addStyles['list']}>
        <li>
          <button
            type="button"
            className={addStyles['item']}
            onClick={() => {
              onPick(null);
            }}
          >
            <span className={addStyles['itemTexts']}>
              <span className={addStyles['itemName']}>Keins</span>
            </span>
          </button>
        </li>
        {foods.map((food) => (
          <li key={food.id}>
            <button
              type="button"
              className={addStyles['item']}
              onClick={() => {
                onPick(food);
              }}
            >
              <span className={addStyles['itemTexts']}>
                <span className={addStyles['itemName']}>{displayName(food.name, food.brand)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
