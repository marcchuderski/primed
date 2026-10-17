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
import { useNow } from './useNow.ts';
import styles from './TodayScreen.module.css';

type BarKey = 'kcal' | 'protein' | 'carbs';

const DEFAULT_DAY_BOUNDARY_MIN = 120;

interface TodayData {
  day: Day;
  settings: Settings;
  /** Entries arrive with roadmap 2.5. */
  entries: EntryMacros[];
}

/** Screen 03 "Heute" (DESIGN.md §6, BRIEFING §4/§4a). */
export function TodayScreen({
  displayName,
  onOpenDayType,
}: {
  displayName: string;
  onOpenDayType?: (day: Day) => void;
}) {
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();
  // Reload whenever a new logical day starts while the app is open (day boundary 02:00).
  const dayKey = berlinLogicalDate(now, data?.settings.dayBoundaryMin ?? DEFAULT_DAY_BOUNDARY_MIN);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchToday(), fetchSettings()])
      .then(([day, settings]) => {
        if (!cancelled) {
          setData({ day, settings, entries: [] });
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

  const { day, settings, entries } = data;
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
        onClick={() => onOpenDayType?.(day)}
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
            <button type="button" className={styles['iconButton']} aria-label="Vorschläge" disabled>
              <WandSparkles size={20} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles['iconButton'] ?? ''} ${styles['add'] ?? ''}`}
              aria-label="Hinzufügen"
              disabled
            >
              <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        </div>
        {entries.length === 0 && <p className={styles['empty']}>Noch nichts eingetragen.</p>}
      </section>

      <Footer />
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
