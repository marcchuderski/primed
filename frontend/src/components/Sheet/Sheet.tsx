import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  title: string;
  subtitle?: string | undefined;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet (DESIGN.md §6): handle, title left, close right. Built on the native modal <dialog>,
 * which traps focus, makes the page behind inert and closes on Escape.
 */
export function Sheet({ open, title, subtitle, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles['dialog']}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <div className={styles['scrim']} onClick={onClose} aria-hidden="true" />
          <div className={styles['sheet']}>
            <span className={styles['handle']} aria-hidden="true" />
            <div className={styles['head']}>
              <div className={styles['titles']}>
                <h2 id={titleId} className={styles['title']}>
                  {title}
                </h2>
                {subtitle !== undefined && <span className={styles['subtitle']}>{subtitle}</span>}
              </div>
              <button type="button" className={styles['close']} aria-label="Schließen" onClick={onClose}>
                <X size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <div className={styles['body']}>{children}</div>
          </div>
        </>
      )}
    </dialog>
  );
}
