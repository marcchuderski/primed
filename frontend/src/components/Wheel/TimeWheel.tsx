import { useEffect, useRef, type KeyboardEvent } from 'react';
import styles from './Wheel.module.css';

const ITEM_HEIGHT = 32;

interface ColumnProps {
  label: string;
  values: readonly number[];
  value: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/** One scroll-snapping column (iOS alarm style), operable by touch, click and arrow keys. */
function WheelColumn({ label, values, value, format, onChange }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  const index = Math.max(0, values.indexOf(value));

  const positioned = useRef(false);

  // Keep the scroll position in sync with the selected value. The first position is set instantly:
  // with the CSS smooth scrolling the wheel would visibly spin from 00 while its sheet slides in (jank on iOS).
  // A plain effect, not a layout effect: the parent sheet's <dialog> only opens in its own layout effect.
  useEffect(() => {
    const column = ref.current;
    if (column === null || Math.round(column.scrollTop / ITEM_HEIGHT) === index) {
      positioned.current = column !== null;
      return;
    }
    if (positioned.current) {
      column.scrollTop = index * ITEM_HEIGHT;
      return;
    }
    column.style.scrollBehavior = 'auto';
    column.scrollTop = index * ITEM_HEIGHT;
    column.style.scrollBehavior = '';
    positioned.current = true;
  }, [index]);

  function handleScroll() {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const column = ref.current;
      if (column === null) {
        return;
      }
      const next =
        values[Math.min(values.length - 1, Math.max(0, Math.round(column.scrollTop / ITEM_HEIGHT)))];
      if (next !== undefined && next !== value) {
        onChange(next);
      }
    }, 120);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const next = values[Math.min(values.length - 1, Math.max(0, index + step))];
    if (next !== undefined) {
      onChange(next);
    }
  }

  return (
    <div
      ref={ref}
      className={styles['column']}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      aria-activedescendant={`${label}-${String(value)}`}
      onScroll={handleScroll}
      onKeyDown={handleKey}
    >
      {values.map((v) => (
        <div
          key={v}
          id={`${label}-${String(v)}`}
          role="option"
          aria-selected={v === value}
          className={styles['option']}
          onClick={() => {
            onChange(v);
          }}
        >
          {format(v)}
        </div>
      ))}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

interface TimeWheelProps {
  /** Minutes since midnight, on the 15-minute grid. */
  value: number;
  onChange: (minutes: number) => void;
  minMinutes?: number;
  maxMinutes?: number;
  label?: string;
  /** 'bg' (default, on surface cards) or 'surface' (on sheets with --bg background, screen 06). */
  tone?: 'bg' | 'surface';
}

/** Hour and minute wheels in 15-minute steps (D-012). */
export function TimeWheel({
  value,
  onChange,
  minMinutes = 0,
  maxMinutes = 23 * 60 + 45,
  label = 'Uhrzeit',
  tone = 'bg',
}: TimeWheelProps) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  const hours: number[] = [];
  for (let h = Math.floor(minMinutes / 60); h <= Math.floor(maxMinutes / 60); h++) {
    hours.push(h);
  }
  const minutes = [0, 15, 30, 45];
  const clamp = (minutesOfDay: number) => Math.min(maxMinutes, Math.max(minMinutes, minutesOfDay));

  return (
    <div
      className={`${styles['wheel'] ?? ''} ${tone === 'surface' ? (styles['onBg'] ?? '') : ''}`}
      role="group"
      aria-label={label}
    >
      <span className={styles['highlight']} aria-hidden="true" />
      <WheelColumn
        label={`${label} Stunde`}
        values={hours}
        value={hour}
        format={pad}
        onChange={(h) => {
          onChange(clamp(h * 60 + minute));
        }}
      />
      <span className={styles['separator']} aria-hidden="true">
        :
      </span>
      <WheelColumn
        label={`${label} Minute`}
        values={minutes}
        value={minute}
        format={pad}
        onChange={(m) => {
          onChange(clamp(hour * 60 + m));
        }}
      />
    </div>
  );
}
