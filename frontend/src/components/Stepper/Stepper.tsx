import { Minus, Plus } from 'lucide-react';
import styles from './Stepper.module.css';

interface StepperProps {
  /** Accessible name, e.g. "Protein" → "Protein verringern" / "Protein erhöhen". */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Formatted value; defaults to the plain number. */
  format?: (value: number) => string;
  unit?: string;
  disabled?: boolean;
}

/** Minus / value / plus (screen 19). Values are clamped to the server's ranges. */
export function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = String,
  unit,
  disabled = false,
}: StepperProps) {
  return (
    <span className={styles['stepper']} role="group" aria-label={label}>
      <button
        type="button"
        className={styles['minus']}
        aria-label={`${label} verringern`}
        disabled={disabled || value <= min}
        onClick={() => {
          onChange(Math.max(min, value - step));
        }}
      >
        <Minus size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <span className={styles['value']} aria-live="polite">
        {format(value)}
        {unit !== undefined && <span className={styles['unit']}> {unit}</span>}
      </span>
      <button
        type="button"
        className={styles['plus']}
        aria-label={`${label} erhöhen`}
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(Math.min(max, value + step));
        }}
      >
        <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </span>
  );
}
