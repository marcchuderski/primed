import { useEffect, useState } from 'react';
import { fetchHistory } from '../../api/history.ts';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { Loading, SkeletonRows } from '../../components/Skeleton/Skeleton.tsx';
import { formatInt } from '../../domain/format.ts';
import { dayStatus, type HistoryDay } from '../../domain/history.ts';
import { EDIT_WINDOW_DAYS, formatShortDay, windowDates } from '../../domain/pastDay.ts';
import { StatusMark } from '../history/StatusMark.tsx';
import styles from './DayPickerSheet.module.css';

/** Mockup a2b: today and the days of the edit window with kcal and rating; tap opens the day (D-178). */
export function DayPickerSheet({
  today,
  selected,
  tolerancePct,
  onPick,
  onClose,
}: {
  today: string;
  selected: string;
  tolerancePct: number;
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  const [days, setDays] = useState<Map<string, HistoryDay> | null>(null);
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

  return (
    <Sheet open title="Tag wählen" onClose={onClose} tone="bg">
      <p className={styles['hint']}>
        Nachtragen geht bis {EDIT_WINDOW_DAYS} Tage zurück. Ältere Tage öffnest du im Verlauf.
      </p>
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
              <li key={date}>
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
                    {day !== undefined && <span className={styles['meta']}>{day.dayTypeName}</span>}
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
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
