import {
  Check,
  ChevronDown,
  CircleSlash2,
  Dumbbell,
  History,
  Lock,
  Moon,
  Plus,
  WandSparkles,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { fetchDay, fetchSettings, fetchToday, type Day, type Settings } from '../../api/days.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Footer } from '../../components/Footer/Footer.tsx';
import { MacroBar } from '../../components/MacroBar/MacroBar.tsx';
import { Bone, Loading, SkeletonRows } from '../../components/Skeleton/Skeleton.tsx';
import { checkpointFor, eatenUntil, type Checkpoint } from '../../domain/checkpoint.ts';
import { formatInt } from '../../domain/format.ts';
import { greetingLine } from '../../domain/greeting.ts';
import {
  EDIT_WINDOW_DAYS,
  formatLongDay,
  formatShortDay,
  kcalDeviationPct,
  pastDayDefaultTime,
} from '../../domain/pastDay.ts';
import { rateKcal, type KcalRating } from '../../domain/rating.ts';
import { fatReference, sumMacros } from '../../domain/targets.ts';
import { berlinLogicalDate, berlinWallMinute, formatClock, toLogicalMinute } from '../../domain/time.ts';
import type { EntryMacros } from '../../domain/types.ts';
import { deleteEntry, fetchEntries, updateEntry, type Entry } from '../../api/entries.ts';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx';
import { EntryItem } from '../entries/EntryItem.tsx';
import { entryAmountText } from '../entries/entryText.ts';
import { quantityFoodForEntry } from '../entries/entryQuantity.ts';
import { QuantitySheet } from '../entries/QuantitySheet.tsx';
import { AddFlow } from '../add/AddFlow.tsx';
import { SuggestionsSheet } from '../suggestions/SuggestionsSheet.tsx';
import { DayPickerSheet } from './DayPickerSheet.tsx';
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

const RATING_LABEL: Record<KcalRating, string> = { ok: 'im Rahmen', low: 'unter Soll', high: 'über Soll' };

/**
 * Screen 03 "Heute" (DESIGN.md §6, BRIEFING §4/§4a) for today or a past day (D-178): `date` null shows today.
 * Past days inside the edit window can be changed; older days are read only (D-176).
 */
export function TodayScreen({
  displayName,
  date = null,
  onDateChange = () => undefined,
}: {
  displayName: string;
  date?: string | null;
  onDateChange?: (date: string | null) => void;
}) {
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
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
    Promise.all([date === null ? fetchToday() : fetchDay(date), fetchSettings()])
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
  }, [dayKey, date]);

  function replaceEntries(entries: Entry[]) {
    setData((current) => (current === null ? current : { ...current, entries }));
  }

  const minuteNow = data === null ? 0 : toLogicalMinute(berlinWallMinute(now), data.settings.dayBoundaryMin);

  if (data === null) {
    return error === null ? <TodaySkeleton /> : <p role="alert">{error}</p>;
  }

  const { day, settings } = data;
  const isToday = day.isToday;
  const editable = day.editable;
  const entries = toEntryMacros(data.entries, settings.dayBoundaryMin);
  const eaten = sumMacros(entries);
  // Checkpoints and suggestions only make sense for the running day (D-178).
  const checkpoint = isToday ? checkpointFor(day, day.targets, settings.checkpoint) : null;
  const rating =
    isToday || data.entries.length === 0
      ? null
      : {
          status: rateKcal(eaten.kcal, day.targets.kcal, settings.tolerancePct),
          deviation: kcalDeviationPct(eaten.kcal, day.targets.kcal),
        };
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
    tolerancePct: settings.tolerancePct,
  });
  const ChipIcon = day.isTraining ? Dumbbell : Moon;
  const chipText =
    day.isTraining && day.trainingStart !== null
      ? `${day.dayTypeName} · ${formatClock(day.trainingStart)}`
      : day.dayTypeName;

  const dayTypeChip = (
    <button
      type="button"
      className={styles['chip']}
      aria-haspopup="dialog"
      aria-label={editable ? `Tagesart: ${chipText}. Ändern` : `Tagesart: ${chipText}`}
      disabled={!editable}
      onClick={() => {
        setPickerOpen(true);
      }}
    >
      <ChipIcon size={16} strokeWidth={2.4} className={styles['chipIcon']} aria-hidden="true" />
      <span className={styles['chipText']}>{chipText}</span>
      {editable && <ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />}
    </button>
  );

  // Date and day type look the same on every day; only the banner marks a past day (D-178).
  const chipRow = (
    <div className={styles['chips']}>
      <button
        type="button"
        className={`${styles['chip'] ?? ''} ${styles['dateChip'] ?? ''}`}
        aria-haspopup="dialog"
        aria-label={`${formatLongDay(day.date)}, anderen Tag wählen`}
        onClick={() => {
          setDayPickerOpen(true);
        }}
      >
        {formatShortDay(day.date)}
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      {dayTypeChip}
    </div>
  );

  return (
    <div className={styles['screen']}>
      {isToday ? (
        <>
          <div className={styles['intro']}>
            <h1 className={styles['hello']}>Hey, {displayName}.</h1>
            <p className={styles['greeting']}>{greeting}</p>
          </div>
          {chipRow}
        </>
      ) : (
        <>
          <div
            className={`${styles['banner'] ?? ''} ${editable ? '' : (styles['readOnly'] ?? '')}`}
            role="status"
          >
            {editable ? (
              <History size={20} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Lock size={18} strokeWidth={2.2} aria-hidden="true" />
            )}
            <span className={styles['bannerText']}>
              {editable ? (
                <strong>Du bearbeitest {formatShortDay(day.date)}</strong>
              ) : (
                <>
                  <strong>Nur ansehen</strong>
                  <span>Nachtragen geht bis {EDIT_WINDOW_DAYS} Tage zurück.</span>
                </>
              )}
            </span>
            <button
              type="button"
              className={styles['bannerButton']}
              onClick={() => {
                onDateChange(null);
              }}
            >
              Zu heute
            </button>
          </div>
          {chipRow}
        </>
      )}

      <MacroCard day={day} checkpoint={checkpoint} entries={entries} eaten={eaten} rating={rating} />

      <section className={styles['section']} aria-labelledby="today-entries">
        <h2 id="today-entries" className={styles['sectionTitle']}>
          Einträge
        </h2>
        {data.entries.length === 0 ? (
          <p className={styles['empty']}>Noch nichts eingetragen.</p>
        ) : (
          <ul className={styles['list']}>
            {[...data.entries].reverse().map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                onEdit={editable ? setEditing : undefined}
                onDelete={editable ? setDeleting : undefined}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Main actions within thumb reach, like the fixed bar in the Essen tab (D-183). */}
      {editable && (
        <div className={styles['actionBar']}>
          {isToday && (
            <Button
              variant="tonal"
              aria-haspopup="dialog"
              onClick={() => {
                setSuggesting(true);
              }}
            >
              <WandSparkles size={20} strokeWidth={2} aria-hidden="true" />
              Vorschläge
            </Button>
          )}
          <Button
            className={styles['addButton']}
            aria-haspopup="dialog"
            onClick={() => {
              setAdding(true);
            }}
          >
            <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
            {isToday ? 'Hinzufügen' : `Für ${formatShortDay(day.date)} hinzufügen`}
          </Button>
        </div>
      )}

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
          pastDay={
            isToday
              ? undefined
              : {
                  defaultTime: pastDayDefaultTime(data.entries, settings.dayBoundaryMin),
                  short: formatShortDay(day.date),
                  long: formatLongDay(day.date),
                }
          }
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

      {dayPickerOpen && (
        <DayPickerSheet
          today={dayKey}
          selected={day.date}
          tolerancePct={settings.tolerancePct}
          onClose={() => {
            setDayPickerOpen(false);
          }}
          onPick={(picked) => {
            setDayPickerOpen(false);
            onDateChange(picked === dayKey ? null : picked);
          }}
          onExcludedChange={(saved) => {
            setData((current) => (current?.day.date === saved.date ? { ...current, day: saved } : current));
          }}
        />
      )}

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
  rating,
}: {
  day: Day;
  checkpoint: Checkpoint | null;
  entries: EntryMacros[];
  eaten: ReturnType<typeof sumMacros>;
  /** Past days: the rating as in the history (kcal ±tolerance), shown in the head of the card. */
  rating: { status: KcalRating; deviation: number | null } | null;
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
      {day.statsExcluded ? (
        // Left out of the statistics (D-180), also on the running day; replaces the rating.
        <div className={styles['ratingHead']}>
          <span className={styles['ratingLabel']}>Tagesbilanz</span>
          <span className={`${styles['rating'] ?? ''} ${styles['excluded'] ?? ''}`}>
            <CircleSlash2 size={14} strokeWidth={2.6} aria-hidden="true" />
            nicht mitgezählt
          </span>
        </div>
      ) : (
        rating !== null && (
          <div className={styles['ratingHead']}>
            <span className={styles['ratingLabel']}>Tagesbilanz</span>
            <span className={`${styles['rating'] ?? ''} ${styles[rating.status] ?? ''}`}>
              {rating.status === 'ok' ? (
                <Check size={14} strokeWidth={3} aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{rating.status === 'low' ? '↓' : '↑'}</span>
              )}
              {RATING_LABEL[rating.status]}
              {rating.deviation !== null && (
                <span className={styles['ratingPct']}>
                  {rating.deviation > 0 ? '+' : rating.deviation < 0 ? '−' : '±'}
                  {Math.abs(rating.deviation)} %
                </span>
              )}
            </span>
          </div>
        )
      )}
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
              <BarDetails
                bar={bar}
                checkpoint={checkpoint}
                until={until}
                title={day.isToday ? 'Heute' : formatShortDay(day.date)}
              />
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
  title,
}: {
  bar: { key: BarKey; unit: string; target: number; eaten: number };
  checkpoint: Checkpoint | null;
  until: ReturnType<typeof sumMacros> | null;
  title: string;
}) {
  const unit = bar.unit === '' ? 'kcal' : bar.unit;
  if (checkpoint === null || until === null) {
    const open = bar.target - bar.eaten;
    return (
      <>
        <span className={styles['popTitle']}>{title}</span>
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

/** Loading state in the final layout (D-157): bones at the size of the values, headings shown at once. */
function TodaySkeleton() {
  return (
    <Loading className={styles['screen']}>
      <div className={styles['intro']}>
        <Bone width="58%" height={34} />
        <span className={styles['boneLine']}>
          <Bone width="86%" height={15} />
        </span>
      </div>
      <div className={styles['chips']}>
        <Bone width={96} height={36} radius="pill" />
        <Bone width={168} height={36} radius="pill" />
      </div>
      <div className={styles['card']}>
        {['34%', '28%', '46%'].map((label) => (
          <span key={label} className={styles['boneBar']}>
            <span className={styles['boneHead']}>
              <Bone width={label} height={15} />
              <Bone width="22%" height={15} />
            </span>
            <Bone height={12} radius="pill" />
          </span>
        ))}
        <span className={styles['boneSmall']}>
          <Bone height={6} radius="pill" />
          <Bone height={6} radius="pill" />
        </span>
      </div>
      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>Einträge</h2>
        <SkeletonRows count={3} />
      </section>
      <div className={styles['actionBar']}>
        <Bone width={140} height={52} />
        <Bone height={52} />
      </div>
    </Loading>
  );
}
