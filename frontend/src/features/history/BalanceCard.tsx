import { formatSigned, type PeriodSummary } from '../../domain/history.ts';
import { formatInt } from '../../domain/format.ts';
import type { ReactNode } from 'react';
import styles from './History.module.css';

/** Balance card (screens 13–15): kcal balance with classification, Ø protein, ok/low/high tiles. */
export function BalanceCard({
  title,
  summary,
  proteinTarget,
  asPercent = false,
  children,
}: {
  title: string;
  summary: PeriodSummary;
  /** Ø protein target of the counted days. */
  proteinTarget: number | null;
  /** Year view: tiles as share of days instead of counts. */
  asPercent?: boolean;
  children?: ReactNode;
}) {
  const tile = (n: number) =>
    asPercent ? `${summary.days === 0 ? '0' : String(Math.round((n / summary.days) * 100))} %` : String(n);

  return (
    <section className={styles['card']} aria-label={title}>
      <h2 className={styles['cardTitle']}>{title}</h2>
      {summary.days === 0 ? (
        <p className={styles['emptyNote']}>Noch keine abgeschlossenen Tage mit Einträgen.</p>
      ) : (
        <>
          <div className={styles['figures']}>
            <div className={styles['figure']}>
              <span className={styles['big']}>
                {formatSigned(summary.balanceKcal)} <small>kcal</small>
              </span>
              <span className={styles['caption']}>{summary.label}</span>
            </div>
            <div className={`${styles['figure'] ?? ''} ${styles['right'] ?? ''}`}>
              <span className={`${styles['big'] ?? ''} ${styles['protein'] ?? ''}`}>
                {formatInt(summary.avgProtein ?? 0)} <small>g</small>
              </span>
              <span className={styles['caption']}>
                Ø Protein{proteinTarget === null ? '' : ` / ${formatInt(proteinTarget)}`}
              </span>
            </div>
          </div>
          {children}
          <div className={styles['tiles']}>
            <div className={`${styles['tile'] ?? ''} ${styles['ok'] ?? ''}`}>
              <strong>{tile(summary.ok)}</strong>
              <span>✓ im Rahmen</span>
            </div>
            <div className={`${styles['tile'] ?? ''} ${styles['low'] ?? ''}`}>
              <strong>{tile(summary.low)}</strong>
              <span>↓ unter Soll</span>
            </div>
            <div className={`${styles['tile'] ?? ''} ${styles['high'] ?? ''}`}>
              <strong>{tile(summary.high)}</strong>
              <span>↑ über Soll</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
