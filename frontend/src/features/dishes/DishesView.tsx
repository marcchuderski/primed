import { ChevronRight, ChefHat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { discardDish, fetchDish, fetchDishes, type Dish } from '../../api/dishes.ts';
import { Button } from '../../components/Button/Button.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { formatDecimal, formatInt } from '../../domain/format.ts';
import { cookedText } from './dishModel.ts';
import { DishEditorSheet } from './DishEditorSheet.tsx';
import styles from './DishesView.module.css';

function PortionDots({ dish }: { dish: Dish }) {
  const count = Math.ceil(dish.portionsTotal);
  return (
    <span className={styles['dots']} aria-hidden="true">
      {Array.from({ length: Math.min(count, 12) }, (_, i) => {
        const left = dish.portionsLeft - i;
        const cls = left >= 1 ? '' : left >= 0.5 ? styles['half'] : styles['empty'];
        return <span key={i} className={`${styles['dot'] ?? ''} ${cls ?? ''}`} />;
      })}
    </span>
  );
}

type Editor = { mode: 'new' } | { mode: 'edit' | 'again'; dish: Dish };

/** Screen 10: dishes with portions left, "Neues Gericht kochen", archive with "Nochmal kochen" (D-118). */
export function DishesView() {
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [archive, setArchive] = useState<Dish[] | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [discarding, setDiscarding] = useState<Dish | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchDishes('active'), fetchDishes('archived')])
      .then(([active, archived]) => {
        if (!cancelled) {
          setDishes(active);
          setArchive(archived);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gerichte konnten nicht geladen werden.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  function open(mode: 'edit' | 'again', id: number) {
    fetchDish(id)
      .then((dish) => {
        setArchiveOpen(false);
        setEditor({ mode, dish });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Gericht konnte nicht geladen werden.');
      });
  }

  return (
    <>
      <button
        type="button"
        className={styles['newButton']}
        onClick={() => {
          setEditor({ mode: 'new' });
        }}
      >
        <ChefHat size={18} strokeWidth={2.2} aria-hidden="true" /> Neues Gericht kochen
      </button>

      {error !== null && <p role="alert">{error}</p>}
      {dishes !== null && dishes.length === 0 && (
        <p className={styles['empty']}>Gerade nichts vorgekocht. Leg dein nächstes Gericht an.</p>
      )}
      <ul className={styles['cards']}>
        {(dishes ?? []).map((dish) => (
          <li key={dish.id}>
            <button
              type="button"
              className={styles['card']}
              aria-label={`${dish.name}, ${formatDecimal(dish.portionsLeft)} von ${formatDecimal(dish.portionsTotal)} Portionen übrig. Bearbeiten`}
              onClick={() => {
                open('edit', dish.id);
              }}
            >
              <span className={styles['cardHead']}>
                <span>
                  <span className={styles['cardName']}>{dish.name}</span>
                  <br />
                  <span className={styles['cardMeta']}>{cookedText(dish)} · pro Portion</span>
                </span>
                <span className={styles['count']}>
                  {formatDecimal(dish.portionsLeft)} von {formatDecimal(dish.portionsTotal)}
                  <PortionDots dish={dish} />
                </span>
              </span>
              <span className={styles['macros']}>
                <span className={styles['macro']}>
                  <strong>{formatInt(dish.perPortion.kcal)}</strong>
                  <span>kcal</span>
                </span>
                <span className={`${styles['macro'] ?? ''} ${styles['p'] ?? ''}`}>
                  <strong>{formatInt(dish.perPortion.protein)} g</strong>
                  <span>Protein</span>
                </span>
                <span className={styles['macro']}>
                  <strong>{formatInt(dish.perPortion.carbs)} g</strong>
                  <span>KH</span>
                </span>
                <span className={styles['macro']}>
                  <strong>{formatInt(dish.perPortion.fat)} g</strong>
                  <span>Fett</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles['archiveLink']}
        aria-haspopup="dialog"
        onClick={() => {
          setArchiveOpen(true);
        }}
      >
        Archiv
        <span>
          aufgegessene Gerichte <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </button>

      <Sheet
        open={archiveOpen}
        title="Archiv"
        subtitle="Aufgegessen oder entsorgt · zählt weiter im Verlauf"
        onClose={() => {
          setArchiveOpen(false);
        }}
        tone="bg"
      >
        {archive !== null && archive.length === 0 && (
          <p className={styles['empty']}>Noch nichts im Archiv.</p>
        )}
        {(archive ?? []).map((dish) => (
          <div key={dish.id} className={styles['archiveItem']}>
            <span className={styles['archiveTexts']}>
              <strong>{dish.name}</strong>
              <span className={styles['cardMeta']}>
                {cookedText(dish)} · {formatInt(dish.perPortion.kcal)} kcal ·{' '}
                {formatInt(dish.perPortion.protein)} g P pro Portion
                {dish.status === 'discarded' ? ' · Rest entsorgt' : ''}
              </span>
            </span>
            <Button
              variant="tonal"
              onClick={() => {
                open('again', dish.id);
              }}
            >
              Nochmal kochen
            </Button>
          </div>
        ))}
      </Sheet>

      {editor !== null && (
        <DishEditorSheet
          open
          mode={editor.mode}
          dish={editor.mode === 'new' ? undefined : editor.dish}
          onClose={() => {
            setEditor(null);
          }}
          onSaved={() => {
            setEditor(null);
            setReload((r) => r + 1);
          }}
          onDiscard={
            editor.mode === 'edit'
              ? () => {
                  setDiscarding(editor.dish);
                }
              : undefined
          }
        />
      )}

      <ConfirmDialog
        open={discarding !== null}
        title="Rest entsorgen?"
        text={
          discarding === null
            ? ''
            : `${discarding.name} kommt ins Archiv. Die restlichen ${formatDecimal(discarding.portionsLeft)} Portionen werden nicht eingetragen.`
        }
        confirmLabel="Entsorgen"
        onCancel={() => {
          setDiscarding(null);
        }}
        onConfirm={() => {
          if (discarding === null) {
            return;
          }
          discardDish(discarding.id)
            .then(() => {
              setDiscarding(null);
              setEditor(null);
              setReload((r) => r + 1);
            })
            .catch((e: unknown) => {
              setError(e instanceof Error ? e.message : 'Entsorgen fehlgeschlagen.');
              setDiscarding(null);
            });
        }}
      />
    </>
  );
}
