import { dayStatus, isoWeekday, STATUS_LABEL, type HistoryDay } from '../../domain/history.ts';
import { isInWindow } from '../../domain/pastDay.ts';
import { Legend, StatusMark } from './StatusMark.tsx';
import styles from './History.module.css';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Screen 14: calendar with status colour per day, training marker and today. */
export function MonthView({
  dates,
  days,
  tolerancePct,
  today,
  onOpenDay,
}: {
  dates: string[];
  days: Map<string, HistoryDay>;
  tolerancePct: number;
  today: string;
  /** A day with data opens on the "Heute" tab (D-178). */
  onOpenDay: (date: string, isToday: boolean) => void;
}) {
  const first = dates[0];
  const blanks = first === undefined ? 0 : isoWeekday(first) - 1;

  return (
    <>
      <div className={styles['calendar']} role="grid" aria-label="Kalender">
        {WEEKDAYS.map((w) => (
          <span key={w} className={styles['weekday']} role="columnheader">
            {w}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b${String(i)}`} aria-hidden="true" />
        ))}
        {dates.map((date) => {
          const day = days.get(date);
          const n = Number(date.slice(8, 10));
          if (day === undefined) {
            return (
              <div key={date} className={`${styles['cell'] ?? ''} ${styles['future'] ?? ''}`} role="gridcell">
                <span className={styles['num']}>{n}</span>
              </div>
            );
          }
          const status = dayStatus(day, tolerancePct);
          const training = day.isTraining ? ', Trainingstag' : '';
          const action = isInWindow(date, today) ? 'öffnen' : 'ansehen';
          return (
            <div key={date} className={`${styles['cell'] ?? ''} ${styles[status] ?? ''}`} role="gridcell">
              <button
                type="button"
                className={styles['cellButton']}
                aria-label={`${String(n)}.: ${day.isToday ? 'heute' : STATUS_LABEL[status]}${training}. ${action}`}
                onClick={() => {
                  onOpenDay(date, day.isToday);
                }}
              />
              {day.isTraining && <span className={styles['trainingDot']} aria-hidden="true" />}
              <span className={styles['num']} aria-hidden="true">
                {n}
              </span>
              <span className={styles['cellMark']} aria-hidden="true">
                {status === 'running' ? (
                  'heute'
                ) : status === 'empty' ? (
                  '/'
                ) : (
                  <StatusMark status={status} size={20} />
                )}
              </span>
            </div>
          );
        })}
      </div>
      <Legend tolerancePct={tolerancePct} training />
    </>
  );
}
