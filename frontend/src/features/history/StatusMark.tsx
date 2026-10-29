import { Check, CircleSlash2 } from 'lucide-react';
import { STATUS_LABEL, type DayStatus } from '../../domain/history.ts';
import styles from './History.module.css';

/** Round status mark (screen 13): ✓ / ↓ / ↑, "/" without entries, "läuft" for today, ⊘ not counted (D-180). */
export function StatusMark({ status, size = 28 }: { status: DayStatus; size?: 20 | 28 }) {
  if (status === 'empty') {
    return (
      <span className={styles['muted']} aria-label={STATUS_LABEL.empty} role="img">
        /
      </span>
    );
  }
  if (status === 'running') {
    return <span className={styles['running']}>läuft</span>;
  }
  return (
    <span
      className={`${styles['mark'] ?? ''} ${styles[status] ?? ''} ${size === 20 ? (styles['small'] ?? '') : ''}`}
      role="img"
      aria-label={STATUS_LABEL[status]}
    >
      {status === 'ok' ? (
        <Check size={size === 20 ? 12 : 16} strokeWidth={3} aria-hidden="true" />
      ) : status === 'excluded' ? (
        <CircleSlash2 size={size === 20 ? 14 : 18} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <span aria-hidden="true">{status === 'low' ? '↓' : '↑'}</span>
      )}
    </span>
  );
}

export function Legend({
  tolerancePct,
  training = false,
  excluded = false,
}: {
  tolerancePct: number;
  training?: boolean;
  /** Shown only when a day in view is left out (D-180). */
  excluded?: boolean;
}) {
  return (
    <div className={styles['legend']}>
      <span>
        <StatusMark status="ok" size={20} /> im Rahmen ±{tolerancePct} %
      </span>
      <span>
        <StatusMark status="low" size={20} /> unter Soll
      </span>
      <span>
        <StatusMark status="high" size={20} /> über Soll
      </span>
      {excluded && (
        <span>
          <StatusMark status="excluded" size={20} /> nicht mitgezählt
        </span>
      )}
      {training && (
        <span>
          <span className={styles['trainingDot']} aria-hidden="true" /> Trainingstag
        </span>
      )}
    </div>
  );
}
