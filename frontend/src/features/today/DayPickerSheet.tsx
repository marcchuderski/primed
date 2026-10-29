import { CircleSlash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { setStatsExcluded, type Day } from '../../api/days.ts';
import { fetchHistory } from '../../api/history.ts';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { Loading, SkeletonRows } from '../../components/Skeleton/Skeleton.tsx';
import { formatInt } from '../../domain/format.ts';
import { dayStatus, type HistoryDay } from '../../domain/history.ts';
import { EDIT_WINDOW_DAYS, formatShortDay, windowDates } from '../../domain/pastDay.ts';
import { StatusMark } from '../history/StatusMark.tsx';
import styles from './DayPickerSheet.module.css';

/**
 * Mockup a2b: today and the days of the edit window with kcal and rating; tap opens the day (D-178).
 * ⊘ next to each day leaves it out of the statistics or counts it again (D-180).
 */
export function DayPickerSheet({
  today,
  selected,
  tolerancePct,
  onPick,
  onExcludedChange,
  onClose,
}: {
  today: string;
  selected: string;
  tolerancePct: number;
  onPick: (date: string) => void;
  /** The saved day after ⊘ was toggled. */
  onExcludedChange: (day: Day) => void;
  onClose: () => void;
}) {
  const [days, setDays] = useState<Map<string, HistoryDay> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dates = windowDates(today);

  useEffect(() => {
    let cancelled = false;
    const range = windowDates(today);
    fetchHistory(range[range.length - 1] ?? today, today)
      .then((history) => {
        if (!cancelled) {
          setDays(new Map(history.days.map((d) => [d.date, d])));
        }
      })
      .catch(() => {
        // The list still works without kcal and rating.
        if (!cancelled) {
          setDays(new Map());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  function toggleExcluded(day: HistoryDay) {
    setBusy(day.date);
    setError(null);
    setStatsExcluded(day.date, !day.statsExcluded)
      .then((saved) => {
        setDays((current) =>
          current === null
            ? current
            : new Map(current).set(day.date, { ...day, statsExcluded: saved.statsExcluded }),
        );
        onExcludedChange(saved);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
      })
      .finally(() => {
        setBusy(null);
      });
  }

  return (
    <Sheet open title="Tag wählen" onClose={onClose} tone="bg">
      <p className={styles['hint']}>
        Bis zu {EDIT_WINDOW_DAYS} Tage zurück nachtragen oder ganze Tage ausschließen.
        <br />
        Zum Nachtragen den Tag antippen. Mit{' '}
        <CircleSlash2 className={styles['inlineIcon']} size={15} strokeWidth={2.4} aria-hidden="true" />
        <span className="visually-hidden">„nicht mitzählen“</span> zählt er nicht mit, z. B. bei Krankheit
        oder Urlaub.
      </p>
      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
      {days === null ? (
        <Loading>
          <SkeletonRows count={6} />
        </Loading>
      ) : (
        <ul className={styles['list']}>
          {dates.map((date, i) => {
            const day = days.get(date);
            const prefix = i === 0 ? 'Heute · ' : i === 1 ? 'Gestern · ' : '';
            return (
              <li key={date} className={styles['row']}>
                <button
                  type="button"
                  className={styles['day']}
                  aria-current={date === selected ? 'date' : undefined}
                  onClick={() => {
                    onPick(date);
                  }}
                >
                  <span className={styles['texts']}>
                    <span className={styles['name']}>
                      {prefix}
                      {formatShortDay(date)}
                    </span>
                    {day !== undefined && (
                      <span className={styles['meta']}>
                        {day.dayTypeName}
                        {day.statsExcluded && ' · nicht mitgezählt'}
                      </span>
                    )}
                  </span>
                  <span className={`${styles['kcal'] ?? ''} num`}>
                    {day === undefined || day.entryCount === 0 ? '–' : `${formatInt(day.eaten.kcal)} kcal`}
                  </span>
                  <span className={styles['status']}>
                    {day !== undefined && dayStatus(day, tolerancePct) !== 'empty' && !day.isToday && (
                      <StatusMark status={dayStatus(day, tolerancePct)} />
                    )}
                  </span>
                </button>
                {day !== undefined && (
                  <button
                    type="button"
                    className={styles['exclude']}
                    aria-label={`${formatShortDay(date)} nicht mitzählen`}
                    aria-pressed={day.statsExcluded}
                    disabled={busy !== null}
                    onClick={() => {
                      toggleExcluded(day);
                    }}
                  >
                    <CircleSlash2 size={20} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
