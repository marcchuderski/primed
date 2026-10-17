import { ChevronDown, Dumbbell, Moon, Plus, WandSparkles } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { fetchSettings, fetchToday, type Day, type Settings } from '../../api/days.ts';
import { Footer } from '../../components/Footer/Footer.tsx';
import { MacroBar } from '../../components/MacroBar/MacroBar.tsx';
import { checkpointFor, eatenUntil, type Checkpoint } from '../../domain/checkpoint.ts';
import { formatInt } from '../../domain/format.ts';
import { greetingLine } from '../../domain/greeting.ts';
import { fatReference, sumMacros } from '../../domain/targets.ts';
import {
  berlinLogicalDate,
  berlinWallMinute,
  formatClock,
  formatDayTitle,
  toLogicalMinute,
} from '../../domain/time.ts';
import type { EntryMacros } from '../../domain/types.ts';
import { deleteEntry, fetchEntries, updateEntry, type Entry } from '../../api/entries.ts';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx';
import { EntryItem } from '../entries/EntryItem.tsx';
import { entryAmountText } from '../entries/entryText.ts';
import { quantityFoodForEntry } from '../entries/entryQuantity.ts';
import { QuantitySheet } from '../entries/QuantitySheet.tsx';
import { AddFlow } from '../add/AddFlow.tsx';
import { SuggestionsSheet } from '../suggestions/SuggestionsSheet.tsx';
import { DayTypeSheet } from './DayTypeSheet.tsx';
import { useNow } from './useNow.ts';
import styles from './TodayScreen.module.css';

type BarKey = 'kcal' | 'protein' | 'carbs';

const DEFAULT_DAY_BOUNDARY_MIN = 120;

interface TodayData {
  day: Day;
  settings: Settings;
  entries: Entry[];
}

function toEntryMacros(entries: readonly Entry[], dayBoundaryMin: number): EntryMacros[] {
  return entries.map((e) => ({ ...e.nutrients, logicalMinute: toLogicalMinute(e.timeMin, dayBoundaryMin) }));
}

/** Screen 03 "Heute" (DESIGN.md §6, BRIEFING §4/§4a). */
export function TodayScreen({ displayName }: { displayName: string }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [adding, setAdding] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const now = useNow();
  // Reload whenever a new logical day starts while the app is open (day boundary 02:00).
  const dayKey = berlinLogicalDate(now, data?.settings.dayBoundaryMin ?? DEFAULT_DAY_BOUNDARY_MIN);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchToday(), fetchSettings()])
      .then(async ([day, settings]) => ({ day, settings, entries: await fetchEntries(day.date) }))
      .then((loaded) => {
        if (!cancelled) {
          setData(loaded);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Es ist ein Fehler aufgetreten.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dayKey]);

  function replaceEntries(entries: Entry[]) {
    setData((current) => (current === null ? current : { ...current, entries }));
  }

  const minuteNow = data === null ? 0 : toLogicalMinute(berlinWallMinute(now), data.settings.dayBoundaryMin);

  if (data === null) {
    return error === null ? (
      <p className={styles['status']} aria-busy="true">
        Lädt …
      </p>
    ) : (
      <p role="alert">{error}</p>
    );
  }

  const { day, settings } = data;
  const entries = toEntryMacros(data.entries, settings.dayBoundaryMin);
  const eaten = sumMacros(entries);
  const checkpoint = checkpointFor(day, day.targets, settings.checkpoint);
  const greeting = greetingLine({
    date: day.date,
    now: minuteNow,
    dayBoundaryMin: settings.dayBoundaryMin,
    dayTypeName: day.dayTypeName,
    day,
    checkpoint,
    targets: day.targets,
    eaten,
    entryCount: entries.length,
  });
  const ChipIcon = day.isTraining ? Dumbbell : Moon;
  const chipText =
    day.isTraining && day.trainingStart !== null
      ? `${day.dayTypeName} · ${formatClock(day.trainingStart)}`
      : day.dayTypeName;

  return (
    <div className={styles['screen']}>
      <div className={styles['intro']}>
        <p className={styles['greeting']}>
          <strong>Hey, {displayName}.</strong> {greeting}
        </p>
        <h1 className={styles['title']}>{formatDayTitle(day.date)}</h1>
      </div>

      <button
        type="button"
        className={styles['chip']}
        aria-haspopup="dialog"
        aria-label={`Tagesart: ${chipText}. Ändern`}
        onClick={() => {
          setPickerOpen(true);
        }}
      >
        <ChipIcon size={16} strokeWidth={2.4} className={styles['chipIcon']} aria-hidden="true" />
        {chipText}
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>

      <MacroCard day={day} checkpoint={checkpoint} entries={entries} eaten={eaten} />

      <section className={styles['section']} aria-labelledby="today-entries">
        <div className={styles['sectionHead']}>
          <h2 id="today-entries" className={styles['sectionTitle']}>
            Heute
          </h2>
          <div className={styles['actions']}>
            <button
              type="button"
              className={styles['iconButton']}
              aria-label="Vorschläge"
              aria-haspopup="dialog"
              onClick={() => {
                setSuggesting(true);
              }}
            >
              <WandSparkles size={20} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles['iconButton'] ?? ''} ${styles['add'] ?? ''}`}
              aria-label="Hinzufügen"
              aria-haspopup="dialog"
              onClick={() => {
                setAdding(true);
              }}
            >
              <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        </div>
        {data.entries.length === 0 ? (
          <p className={styles['empty']}>Noch nichts eingetragen.</p>
        ) : (
          <ul className={styles['list']}>
            {[...data.entries].reverse().map((entry) => (
              <EntryItem key={entry.id} entry={entry} onEdit={setEditing} onDelete={setDeleting} />
            ))}
          </ul>
        )}
      </section>

      <Footer />

      {suggesting && (
        <SuggestionsSheet
          day={day}
          settings={settings}
          now={minuteNow}
          checkpoint={checkpoint}
          eaten={eaten}
          eatenUntilCheckpoint={checkpoint === null ? null : eatenUntil(entries, checkpoint.time)}
          onClose={() => {
            setSuggesting(false);
          }}
          onAdded={() => {
            fetchEntries(day.date)
              .then(replaceEntries)
              .catch(() => {
                // The list refreshes on the next load.
              });
          }}
        />
      )}

      {adding && (
        <AddFlow
          day={day}
          eatenBefore={eaten}
          onClose={() => {
            setAdding(false);
          }}
          onAdded={(entry) => {
            setAdding(false);
            if (entry.date === day.date) {
              fetchEntries(day.date)
                .then(replaceEntries)
                .catch(() => {
                  replaceEntries([...data.entries, entry]);
                });
            }
          }}
        />
      )}

      {editing !== null && (
        <QuantitySheet
          open
          mode="edit"
          food={quantityFoodForEntry(editing)}
          initial={{
            amount: editing.amount,
            unit: editing.unit,
            timeMin: editing.timeMin,
          }}
          targets={day.targets}
          eatenBefore={sumMacros(
            toEntryMacros(
              data.entries.filter((e) => e.id !== editing.id),
              settings.dayBoundaryMin,
            ),
          )}
          onClose={() => {
            setEditing(null);
          }}
          onDelete={() => {
            setDeleting(editing);
          }}
          onSubmit={async ({ amount, unit, timeMin }) => {
            const saved = await updateEntry(editing.id, { amount, unit, timeMin });
            setEditing(null);
            replaceEntries(data.entries.map((e) => (e.id === saved.id ? saved : e)));
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Eintrag löschen?"
        text={
          deleting === null
            ? ''
            : `${deleting.name} · ${entryAmountText(deleting)} wird aus diesem Tag entfernt.`
        }
        confirmLabel="Löschen"
        busy={deleteBusy}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting === null) {
            return;
          }
          setDeleteBusy(true);
          deleteEntry(deleting.id)
            .then(() => {
              replaceEntries(data.entries.filter((e) => e.id !== deleting.id));
              setEditing(null);
              setDeleting(null);
            })
            .catch((e: unknown) => {
              setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.');
              setDeleting(null);
            })
            .finally(() => {
              setDeleteBusy(false);
            });
        }}
      />

      {pickerOpen && (
        <DayTypeSheet
          open
          day={day}
          settings={settings}
          onClose={() => {
            setPickerOpen(false);
          }}
          onSaved={(saved) => {
            setData({ ...data, day: saved });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MacroCard({
  day,
  checkpoint,
  entries,
  eaten,
}: {
  day: Day;
  checkpoint: Checkpoint | null;
  entries: EntryMacros[];
  eaten: ReturnType<typeof sumMacros>;
}) {
  const [open, setOpen] = useState<BarKey | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (open === null) {
      return;
    }
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') {
        return;
      }
      if (event instanceof PointerEvent && (event.target as Element | null)?.closest('[data-macro-bar]')) {
        return;
      }
      setOpen(null);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  const until = checkpoint === null ? null : eatenUntil(entries, checkpoint.time);
  const markerPct = checkpoint?.pct ?? null;
  const fatRef = fatReference(day.targets);

  const bars: {
    key: BarKey;
    label: string;
    unit: string;
    target: number;
    eaten: number;
    variant: 'main' | 'protein';
  }[] = [
    {
      key: 'kcal',
      label: 'Kalorien',
      unit: '',
      target: day.targets.kcal,
      eaten: eaten.kcal,
      variant: 'main',
    },
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      target: day.targets.protein,
      eaten: eaten.protein,
      variant: 'protein',
    },
    {
      key: 'carbs',
      label: 'Kohlenhydrate',
      unit: 'g',
      target: day.targets.carbs,
      eaten: eaten.carbs,
      variant: 'main',
    },
  ];

  return (
    <div className={styles['card']}>
      {bars.map((bar) => (
        <div key={bar.key} className={styles['barWrap']} data-macro-bar>
          <MacroBar
            label={bar.label}
            eaten={bar.eaten}
            target={bar.target}
            unit={bar.unit}
            variant={bar.variant}
            markerPct={markerPct}
            expanded={open === bar.key}
            controls={popoverId}
            onToggle={() => {
              setOpen((current) => (current === bar.key ? null : bar.key));
            }}
          />
          {open === bar.key && (
            <div id={popoverId} className={styles['popover']} role="status">
              <BarDetails bar={bar} checkpoint={checkpoint} until={until} />
            </div>
          )}
        </div>
      ))}

      <div className={styles['smallBars']}>
        <MacroBar label="Fett" eaten={eaten.fat} target={fatRef} unit="g" variant="small" approximate />
        <MacroBar
          label="Zucker"
          eaten={eaten.sugar}
          target={day.targets.sugar}
          unit="g"
          variant="small"
          approximate
        />
      </div>

      {checkpoint !== null && (
        <p className={styles['legend']}>
          <span className={styles['legendMark']} aria-hidden="true" />
          Ziel bis Training · Balken antippen für Details
        </p>
      )}
    </div>
  );
}

function BarDetails({
  bar,
  checkpoint,
  until,
}: {
  bar: { key: BarKey; unit: string; target: number; eaten: number };
  checkpoint: Checkpoint | null;
  until: ReturnType<typeof sumMacros> | null;
}) {
  const unit = bar.unit === '' ? 'kcal' : bar.unit;
  if (checkpoint === null || until === null) {
    const open = bar.target - bar.eaten;
    return (
      <>
        <span className={styles['popTitle']}>Heute</span>
        <span className={`${styles['popMain'] ?? ''} num`}>
          {formatInt(bar.eaten)} von {formatInt(bar.target)} {unit} ·{' '}
          <strong>{open >= 0 ? `noch ${formatInt(open)}` : `${formatInt(-open)} drüber`}</strong>
        </span>
      </>
    );
  }
  const goal = checkpoint[bar.key];
  const eatenUntilCp = until[bar.key];
  const open = goal - eatenUntilCp;
  return (
    <>
      <span className={styles['popTitle']}>Bis {formatClock(checkpoint.time)} · Pre-Workout</span>
      <span className={`${styles['popMain'] ?? ''} num`}>
        {formatInt(eatenUntilCp)} von {formatInt(goal)} {unit} ·{' '}
        <strong>{open > 0 ? `noch ${formatInt(open)}` : 'erreicht'}</strong>
      </span>
      <span className={`${styles['popSub'] ?? ''} num`}>
        Gesamt heute: {formatInt(bar.target)} {unit}
      </span>
    </>
  );
}
