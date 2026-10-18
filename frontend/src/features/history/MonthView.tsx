import { dayStatus, isoWeekday, STATUS_LABEL, type HistoryDay } from '../../domain/history.ts';
import { Legend, StatusMark } from './StatusMark.tsx';
import styles from './History.module.css';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Screen 14: calendar with status colour per day, training marker and today. */
export function MonthView({
  dates,
  days,
  tolerancePct,
}: {
  dates: string[];
  days: Map<string, HistoryDay>;
  tolerancePct: number;
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
          return (
            <div
              key={date}
              className={`${styles['cell'] ?? ''} ${styles[status] ?? ''}`}
              role="gridcell"
              aria-label={`${String(n)}.: ${day.isToday ? 'heute' : STATUS_LABEL[status]}${training}`}
            >
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
