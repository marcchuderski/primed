import { formatInt } from '../../domain/format.ts';
import styles from './MacroBar.module.css';

interface MacroBarProps {
  label: string;
  eaten: number;
  target: number;
  unit?: string;
  variant?: 'main' | 'protein' | 'small';
  /** Target is only a reference ("~67 g"). */
  approximate?: boolean;
  /** Position of the training marker in percent of the target, if any. */
  markerPct?: number | null;
  expanded?: boolean;
  controls?: string;
  onToggle?: () => void;
}

/** Macro bar (DESIGN.md §6): empty, eaten, exceeded (full width + "+180"), optional training marker. */
export function MacroBar({
  label,
  eaten,
  target,
  unit = '',
  variant = 'main',
  approximate = false,
  markerPct = null,
  expanded,
  controls,
  onToggle,
}: MacroBarProps) {
  const over = target > 0 && eaten > target;
  const width = target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const suffix = unit === '' ? '' : ` ${unit}`;
  const targetText = `${approximate ? '~' : ''}${formatInt(target)}${suffix}`;
  const classes = [
    styles['row'],
    variant === 'protein' ? styles['protein'] : undefined,
    variant === 'small' ? styles['small'] : undefined,
    over ? styles['over'] : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={styles['head']}>
        <span className={styles['label']}>{label}</span>
        <span className="num">
          {variant === 'small' ? (
            `${formatInt(eaten)} / ${targetText}`
          ) : (
            <span className={styles['value']}>
              <strong>{formatInt(eaten)}</strong> <span className={styles['target']}>/ {targetText}</span>
            </span>
          )}
          {over && <span className={styles['overLabel']}>+{formatInt(eaten - target)}</span>}
        </span>
      </span>
      <span className={styles['track']} aria-hidden="true">
        <span className={styles['fill']} style={{ width: `${String(width)}%`, display: 'block' }} />
        {markerPct !== null && (
          <span className={styles['marker']} style={{ left: `${String(markerPct)}%` }} />
        )}
      </span>
    </>
  );

  if (onToggle === undefined) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={classes}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${label}: ${formatInt(eaten)} von ${targetText}. Details anzeigen`}
      onClick={onToggle}
    >
      {content}
    </button>
  );
}
