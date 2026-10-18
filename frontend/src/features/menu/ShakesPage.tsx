import { Check, ChevronRight, Plus, ScanBarcode, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateSettings, type Settings, type ShakeLiquids, type Thresholds } from '../../api/days.ts';
import {
  createFood,
  draftFromOff,
  fetchFood,
  lookupBarcode,
  searchFoods,
  type Food,
  type FoodDraft,
} from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { Switch } from '../../components/Switch/Switch.tsx';
import { displayName } from '../../domain/categories.ts';
import { ScannerSheet } from '../add/ScannerSheet.tsx';
import { ProductSheet } from '../foods/ProductSheet.tsx';
import { SettingRow, SettingsPage } from './SettingsPage.tsx';
import { ShakeRulesSection } from './ShakeRulesSection.tsx';
import { useAutoSave, type SaveStatus } from './useAutoSave.ts';
import addStyles from '../add/AddSheet.module.css';
import styles from './Settings.module.css';

const LIQUIDS: { key: keyof ShakeLiquids; label: string }[] = [
  { key: 'milkLow', label: 'Milch 1,5 %' },
  { key: 'milkHigh', label: 'Milch 3,5 %' },
  { key: 'water', label: 'Wasser' },
];

const PER_UNIT_ERROR = 'Proteinpulver braucht Werte pro 100 g oder 100 ml.';

/** Powder picker flow: library search → scan or create a product (both end in the library). */
type Picker = { kind: 'search' } | { kind: 'scan' } | { kind: 'product'; initial: Partial<FoodDraft> } | null;

/** "saving" wins over "error" over "saved", so two independent savers share one status line. */
function combinedStatus(a: SaveStatus, b: SaveStatus): SaveStatus {
  for (const s of ['saving', 'error', 'saved'] as const) {
    if (a === s || b === s) {
      return s;
    }
  }
  return 'idle';
}

/**
 * Shakes (BRIEFING §9/§10, D-139): on/off, protein powder and amount, liquids and the suggestion
 * thresholds; sizes fixed at 400/200 ml.
 */
export function ShakesPage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [enabled, setEnabled] = useState(settings.shakesEnabled);
  const [powderId, setPowderId] = useState(settings.shakeFoods.proteinPowder);
  const [powderName, setPowderName] = useState<string | null>(null);
  const [grams, setGrams] = useState(settings.shakePowderG);
  const [liquids, setLiquids] = useState(settings.shakeLiquids);
  const [thresholds, setThresholds] = useState(settings.thresholds);
  const [picker, setPicker] = useState<Picker>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const powderSaver = useAutoSave(async (powderG: number) => {
    await updateSettings({ shake: { powderG } });
  });
  const rulesSaver = useAutoSave(async (value: Thresholds) => {
    await updateSettings({ thresholds: value });
  });

  useEffect(() => {
    if (settings.shakeFoods.proteinPowder === null) {
      return;
    }
    fetchFood(settings.shakeFoods.proteinPowder)
      .then((food) => {
        setPowderName(displayName(food.name, food.brand));
      })
      .catch(() => undefined);
  }, [settings.shakeFoods.proteinPowder]);

  /** Saves immediately and rolls back on failure. */
  async function save(patch: Parameters<typeof updateSettings>[0], rollback: () => void) {
    setBusy(true);
    setError(null);
    try {
      await updateSettings(patch);
    } catch (e) {
      rollback();
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  function toggleShakes(next: boolean) {
    setEnabled(next);
    void save({ shakesEnabled: next }, () => {
      setEnabled(!next);
    });
  }

  function toggleLiquid(key: keyof ShakeLiquids) {
    const previous = liquids;
    const next = !liquids[key];
    setLiquids({ ...liquids, [key]: next });
    void save({ shake: { liquids: { [key]: next } } }, () => {
      setLiquids(previous);
    });
  }

  async function choosePowder(food: Food | null) {
    setPicker(null);
    const previous = { id: powderId, name: powderName };
    setPowderId(food?.id ?? null);
    setPowderName(food === null ? null : displayName(food.name, food.brand));
    await save({ shake: { proteinPowderFoodId: food?.id ?? null } }, () => {
      setPowderId(previous.id);
      setPowderName(previous.name);
    });
  }

  /** Library hit → choose it; online hit or unknown → product sheet to review and save. */
  function onDetected(ean: string) {
    lookupBarcode(ean)
      .then((result) => {
        if (result === null) {
          setPicker({ kind: 'product', initial: { barcode: ean, category: 'drinks' } });
        } else if (result.source === 'library') {
          if (result.food.basis === 'per_unit') {
            setError(PER_UNIT_ERROR);
            setPicker(null);
          } else {
            void choosePowder(result.food);
          }
        } else {
          setPicker({ kind: 'product', initial: draftFromOff(result.product) });
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Barcode konnte nicht geprüft werden.');
        setPicker({ kind: 'search' });
      });
  }

  const selectedCount = LIQUIDS.filter((l) => liquids[l.key]).length;

  return (
    <SettingsPage
      title="Shakes"
      onBack={onBack}
      status={combinedStatus(powderSaver.status, rulesSaver.status)}
      error={powderSaver.error ?? rulesSaver.error ?? error}
    >
      <p className={styles['hint']}>
        Shakes sind Schnell-Einträge aus deinem Proteinpulver und Milch oder Wasser: ein Tipp im „+“, fertig.
        Der Zauberstab schlägt sie gezielt vor, wenn dir abends oder nach dem Training noch Protein fehlt –
        mit wenig Kalorien und ohne Kochen. Trinkst du keine Shakes, schalte sie aus: Dann verschwinden sie
        aus „+“ und den Vorschlägen, und der Zauberstab schlägt stattdessen proteinreiches Essen vor.
      </p>
      <div className={styles['card']}>
        <SettingRow label="Shakes verwenden" hint={enabled ? 'an' : 'aus'}>
          <Switch label="Shakes verwenden" checked={enabled} disabled={busy} onChange={toggleShakes} />
        </SettingRow>
      </div>

      {enabled && (
        <>
          <section className={styles['section']} aria-labelledby="shake-powder">
            <h2 id="shake-powder" className={styles['sectionLabel']}>
              Proteinpulver
            </h2>
            <div className={styles['card']}>
              <button
                type="button"
                className={styles['link']}
                aria-haspopup="dialog"
                onClick={() => {
                  setPicker({ kind: 'search' });
                }}
              >
                <span className={styles['linkTexts']}>
                  <span className={styles['linkName']}>Aktuelles Proteinpulver</span>
                  <span className={styles['linkMeta']}>
                    {powderId === null
                      ? 'Nicht gewählt – ohne Pulver gibt es keine Shakes'
                      : (powderName ?? '…')}
                  </span>
                </span>
                <ChevronRight size={20} strokeWidth={2.2} className={styles['chevron']} aria-hidden="true" />
              </button>
              <SettingRow label="Menge pro Shake">
                <Stepper
                  label="Proteinpulver"
                  value={grams}
                  min={10}
                  max={80}
                  step={5}
                  unit="g"
                  onChange={(value) => {
                    setGrams(value);
                    powderSaver.schedule(value);
                  }}
                />
              </SettingRow>
            </div>
          </section>

          <section className={styles['section']} aria-labelledby="shake-liquids">
            <h2 id="shake-liquids" className={styles['sectionLabel']}>
              Flüssigkeit
            </h2>
            <div className={styles['pills']} role="group" aria-labelledby="shake-liquids">
              {LIQUIDS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  className={styles['pill']}
                  aria-pressed={liquids[l.key]}
                  disabled={busy || (liquids[l.key] && selectedCount === 1)}
                  onClick={() => {
                    toggleLiquid(l.key);
                  }}
                >
                  {liquids[l.key] && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  {l.label}
                </button>
              ))}
            </div>
            <p className={styles['hint']}>
              Jede gewählte Flüssigkeit gibt es als Groß (400 ml) und Klein (200 ml), mindestens eine bleibt
              gewählt. 400 ml: Milch 1,5 % ≈ 188 kcal, Milch 3,5 % ≈ 256 kcal, Wasser 0 kcal. Der Zauberstab
              nimmt die leichteste, wenn die Kalorien knapp sind, und die reichhaltigste, wenn noch viel offen
              ist.
            </p>
          </section>

          <ShakeRulesSection
            values={thresholds}
            onChange={(next) => {
              setThresholds(next);
              rulesSaver.schedule(next);
            }}
          />
        </>
      )}

      {picker?.kind === 'search' && (
        <FoodPickerSheet
          title="Aktuelles Proteinpulver"
          onPick={(food) => void choosePowder(food)}
          onScan={() => {
            setPicker({ kind: 'scan' });
          }}
          onCreate={(name) => {
            setPicker({
              kind: 'product',
              initial: { category: 'drinks', ...(name === '' ? {} : { name }) },
            });
          }}
          onClose={() => {
            setPicker(null);
          }}
        />
      )}

      {picker?.kind === 'scan' && (
        <ScannerSheet
          open
          onDetected={onDetected}
          onClose={() => {
            setPicker({ kind: 'search' });
          }}
        />
      )}

      {picker?.kind === 'product' && (
        <ProductSheet
          open
          initial={picker.initial}
          submitLabel="Speichern & verwenden"
          onClose={() => {
            setPicker({ kind: 'search' });
          }}
          onSubmit={async (draft) => {
            if (draft.basis === 'per_unit') {
              throw new Error(PER_UNIT_ERROR);
            }
            await choosePowder(await createFood(draft));
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
  onScan,
  onCreate,
  onClose,
}: {
  title: string;
  onPick: (food: Food | null) => void;
  onScan: () => void;
  onCreate: (name: string) => void;
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

  const sheetHeader = (
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
      <button type="button" className={addStyles['scan']} aria-label="Barcode scannen" onClick={onScan}>
        <ScanBarcode size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
  const sheetFooter = (
    <div className={addStyles['footer']}>
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
  );

  return (
    <Sheet
      open
      title={title}
      subtitle="aus deiner Bibliothek"
      onClose={onClose}
      tone="bg"
      header={sheetHeader}
      footer={sheetFooter}
    >
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
