import { formatInt } from '../../domain/format.ts';
import { monthName, type MonthSummary } from '../../domain/history.ts';
import styles from './History.module.css';

/** Year bars (screen 15): monthly deviation above/below the zero line, inside the balance card. */
export function YearBars({
  year,
  months,
  tolerancePct,
}: {
  year: string;
  months: MonthSummary[];
  tolerancePct: number;
}) {
  const byKey = new Map(months.map((m) => [m.month, m.summary]));
  const max = Math.max(10, ...months.map((m) => Math.abs(m.summary.deviationPct ?? 0)));
  return (
    <div className={styles['bars']} role="img" aria-label="Monatsbilanzen als Balken">
      {Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`;
        const s = byKey.get(key);
        const dev = s?.deviationPct ?? null;
        const height = dev === null ? 0 : Math.max(3, Math.round((Math.abs(dev) / max) * 70));
        const tone = dev === null ? '' : Math.abs(dev) <= tolerancePct ? 'ok' : dev < 0 ? 'low' : 'high';
        const bar = <span className={`${styles['bar'] ?? ''} ${styles[tone] ?? ''}`} style={{ height }} />;
        return (
          <div key={key} className={styles['barCol']}>
            <div className={styles['barUp']}>{dev !== null && dev > 0 && bar}</div>
            <div className={styles['zero']} />
            <div className={styles['barDown']}>{dev !== null && dev <= 0 && bar}</div>
            <span className={`${styles['barLabel'] ?? ''} ${dev === null ? (styles['muted'] ?? '') : ''}`}>
              {monthName(`${key}-01`).charAt(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** List of months, newest first: Ø protein and days within the range. */
export function MonthList({ months }: { months: MonthSummary[] }) {
  const rows = [...months].filter((m) => m.summary.days > 0).reverse();
  if (rows.length === 0) {
    return null;
  }
  return (
    <ul className={styles['monthList']}>
      {rows.map(({ month, summary }) => (
        <li key={month}>
          <span className={styles['monthName']}>{monthName(`${month}-01`)}</span>
          <span className={styles['monthMeta']}>
            <span className={styles['protein']}>Ø {formatInt(summary.avgProtein ?? 0)} g P</span> ·{' '}
            {summary.ok} / {summary.days} im Rahmen
          </span>
        </li>
      ))}
    </ul>
  );
}
