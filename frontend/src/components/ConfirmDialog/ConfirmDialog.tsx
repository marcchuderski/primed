import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from '../Button/Button.tsx';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal confirmation (D-052), e.g. before deleting an entry. Focus starts on "Abbrechen". */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();

  // Layout effect: the dialog is open before children's effects run (e.g. wheels measuring scroll).
  useLayoutEffect(() => {
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
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      {open && (
        <>
          <h2 id={titleId} className={styles['title']}>
            {title}
          </h2>
          <p id={textId} className={styles['text']}>
            {text}
          </p>
          <div className={styles['actions']}>
            <Button variant="tonal" autoFocus onClick={onCancel}>
              Abbrechen
            </Button>
            <Button busy={busy} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
}
