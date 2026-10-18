import { Fragment, type ReactNode } from 'react';
import { formatInt } from '../../domain/format.ts';
import {
  dayDeviationPct,
  dayStatus,
  formatSigned,
  tableDayTypeName,
  type HistoryDay,
  type PeriodSummary,
} from '../../domain/history.ts';
import { rateKcal } from '../../domain/rating.ts';
import { Legend, StatusMark } from './StatusMark.tsx';
import styles from './History.module.css';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Screen 13: days as columns, last column Σ week (counted days only). */
export function WeekView({
  dates,
  days,
  summary,
  tolerancePct,
}: {
  dates: string[];
  days: Map<string, HistoryDay>;
  summary: PeriodSummary;
  tolerancePct: number;
}) {
  const cols = dates.map((date) => ({ date, day: days.get(date) }));
  const pct = (v: number | null) => (v === null ? '' : `${formatSigned(v)} %`);

  const cell = (day: HistoryDay | undefined, render: (d: HistoryDay) => ReactNode) => {
    if (day === undefined) {
      return <td className={styles['none']} />;
    }
    if (day.entryCount === 0 && !day.isToday) {
      return (
        <td>
          <span className={styles['muted']}>/</span>
        </td>
      );
    }
    return <td>{render(day)}</td>;
  };

  const sumStatus =
    summary.days === 0 ? null : rateKcal(summary.eaten.kcal, summary.targets.kcal, tolerancePct);

  return (
    <>
      <Legend tolerancePct={tolerancePct} />
      <div className={styles['tableWrap']} tabIndex={0} role="region" aria-label="Wochentabelle">
        <table className={styles['table']}>
          <thead>
            <tr>
              <th scope="col">
                <span className={styles['srOnly']}>Wert</span>
              </th>
              {cols.map(({ date }, i) => (
                <th key={date} scope="col">
                  {WEEKDAYS[i]} {Number(date.slice(8, 10))}.
                </th>
              ))}
              <th scope="col" className={styles['sum']}>
                Σ Woche
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Tagesart</th>
              {cols.map(({ date, day }) => (
                <td key={date}>
                  {day !== undefined && (
                    <span className={styles['muted']}>{tableDayTypeName(day.dayTypeName)}</span>
                  )}
                </td>
              ))}
              <td className={styles['sum']}>
                <span className={styles['muted']}>
                  {summary.days} {summary.days === 1 ? 'Tag' : 'Tage'}
                </span>
              </td>
            </tr>
            <tr>
              <th scope="row">kcal-Rahmen</th>
              {cols.map(({ date, day }) => (
                <td key={date}>
                  {day !== undefined && <StatusMark status={dayStatus(day, tolerancePct)} />}
                </td>
              ))}
              <td className={styles['sum']}>{sumStatus !== null && <StatusMark status={sumStatus} />}</td>
            </tr>
            <tr>
              <th scope="row">kcal</th>
              {cols.map(({ date, day }) => (
                <Fragment key={date}>
                  {cell(day, (d) => (
                    <>
                      {formatInt(d.eaten.kcal)}
                      <small>{d.isToday ? `/ ${formatInt(d.targets.kcal)}` : pct(dayDeviationPct(d))}</small>
                    </>
                  ))}
                </Fragment>
              ))}
              <td className={styles['sum']}>
                {summary.days > 0 && (
                  <>
                    {formatInt(summary.eaten.kcal)}
                    <small>
                      / {formatInt(summary.targets.kcal)} · {pct(summary.deviationPct)}
                    </small>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">Protein</th>
              {cols.map(({ date, day }) => (
                <Fragment key={date}>
                  {cell(day, (d) => (
                    <>
                      <span className={styles['protein']}>{formatInt(d.eaten.protein)}</span>
                      <small>/ {formatInt(d.targets.protein)}</small>
                    </>
                  ))}
                </Fragment>
              ))}
              <td className={styles['sum']}>
                {summary.days > 0 && (
                  <>
                    <span className={styles['protein']}>{formatInt(summary.eaten.protein)}</span>
                    <small>/ {formatInt(summary.targets.protein)}</small>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">KH</th>
              {cols.map(({ date, day }) => (
                <Fragment key={date}>
                  {cell(day, (d) => (
                    <>
                      {formatInt(d.eaten.carbs)}
                      <small>/ {formatInt(d.targets.carbs)}</small>
                    </>
                  ))}
                </Fragment>
              ))}
              <td className={styles['sum']}>
                {summary.days > 0 && (
                  <>
                    {formatInt(summary.eaten.carbs)}
                    <small>/ {formatInt(summary.targets.carbs)}</small>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">Fett</th>
              {cols.map(({ date, day }) => (
                <Fragment key={date}>
                  {cell(day, (d) => (
                    <span className={styles['muted']}>{formatInt(d.eaten.fat)}</span>
                  ))}
                </Fragment>
              ))}
              <td className={styles['sum']}>{summary.days > 0 && formatInt(summary.eaten.fat)}</td>
            </tr>
            <tr>
              <th scope="row">Zucker</th>
              {cols.map(({ date, day }) => (
                <Fragment key={date}>
                  {cell(day, (d) => (
                    <span className={styles['muted']}>{formatInt(d.eaten.sugar)}</span>
                  ))}
                </Fragment>
              ))}
              <td className={styles['sum']}>{summary.days > 0 && formatInt(summary.eaten.sugar)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
