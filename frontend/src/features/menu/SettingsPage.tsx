import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import type { SaveStatus } from './useAutoSave.ts';
import styles from './Settings.module.css';

/** Settings subpage (screen 19 layout): round back button, display title, content. */
export function SettingsPage({
  title,
  onBack,
  status = 'idle',
  error = null,
  children,
}: {
  title: string;
  onBack: () => void;
  status?: SaveStatus;
  error?: string | null;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to the new page so screen readers announce it.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className={styles['page']}>
      <div className={styles['head']}>
        <button type="button" className={styles['back']} aria-label="Zurück" onClick={onBack}>
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <h1 ref={heading} tabIndex={-1} className={styles['title']}>
          {title}
        </h1>
      </div>
      {children}
      <p className={styles['status']} role="status">
        {status === 'saving' && 'Speichert …'}
        {status === 'saved' && 'Gespeichert'}
      </p>
      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** One labelled row with a control on the right (stepper, switch …). */
export function SettingRow({
  label,
  hint,
  accent = false,
  children,
}: {
  label: string;
  hint?: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles['row']}>
      <span className={styles['rowTexts']}>
        <span className={`${styles['rowLabel'] ?? ''} ${accent ? (styles['accent'] ?? '') : ''}`}>
          {label}
        </span>
        {hint !== undefined && <span className={styles['rowHint']}>{hint}</span>}
      </span>
      {children}
    </div>
  );
}
