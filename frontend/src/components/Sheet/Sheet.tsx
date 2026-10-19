import { X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  title: string;
  subtitle?: string | undefined;
  onClose: () => void;
  children: ReactNode;
  /** 'surface' (default) or 'bg' for sheets that contain their own surface cards (screen 06). */
  tone?: 'surface' | 'bg';
  /** Fixed area between title and body, e.g. a search row; stays visible while the body scrolls. */
  header?: ReactNode;
  /** Fixed area below the body, e.g. actions; stays visible while the body scrolls. */
  footer?: ReactNode;
}

/** Exit animation length (Sheet.module.css); the fallback timer closes the dialog even if no animationend arrives. */
const EXIT_MS = 220;

/** No exit animation where motion is reduced or the environment cannot tell (e.g. tests). */
function animateExit(): boolean {
  return (
    typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface Content {
  title: string;
  subtitle: string | undefined;
  tone: 'surface' | 'bg';
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * Bottom sheet (DESIGN.md §6, §8): handle, title left, close right. Built on the native modal <dialog>,
 * which traps focus, makes the page behind inert and closes on Escape. Slides in, and slides out before the
 * dialog closes; while sliding out it keeps showing the last content (callers often clear it on close).
 */
export function Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
  tone = 'surface',
  header,
  footer,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState<Content | null>(null);

  // Remember the content of the last open render (React pattern "storing information from previous renders").
  if (
    open &&
    (shown === null ||
      shown.children !== children ||
      shown.header !== header ||
      shown.footer !== footer ||
      shown.title !== title ||
      shown.subtitle !== subtitle ||
      shown.tone !== tone)
  ) {
    setShown({ title, subtitle, tone, header, footer, children });
  }
  // Closed by the parent: start the exit animation (or close at once without motion).
  if (!open && shown !== null && !closing) {
    if (animateExit()) {
      setClosing(true);
    } else {
      setShown(null);
    }
  }
  if (open && closing) {
    setClosing(false);
  }

  // Layout effect: the dialog is open before children's effects run (e.g. wheels measuring scroll).
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && !closing && dialog.open) {
      // After an exit animation another sheet may already be open; closing must not pull focus back from it.
      const active = document.activeElement;
      dialog.close();
      if (active instanceof HTMLElement && !dialog.contains(active) && document.activeElement !== active) {
        active.focus();
      }
    }
  }, [open, closing]);

  // End of the exit animation closes the dialog; native listener (jsdom has no AnimationEvent for React's
  // onAnimationEnd). The timer is a fallback in case no animationend arrives (tab in background, interrupted).
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!closing || sheet === null) {
      return;
    }
    const finish = () => {
      setClosing(false);
      setShown(null);
    };
    const onEnd = (event: Event) => {
      if (event.target === sheet) {
        finish();
      }
    };
    sheet.addEventListener('animationend', onEnd);
    const id = window.setTimeout(finish, EXIT_MS + 80);
    return () => {
      sheet.removeEventListener('animationend', onEnd);
      window.clearTimeout(id);
    };
  }, [closing]);

  const content = open ? { title, subtitle, tone, header, footer, children } : shown;

  return (
    <dialog
      ref={ref}
      className={`${styles['dialog'] ?? ''} ${closing ? (styles['closing'] ?? '') : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (open) {
          onClose();
        }
      }}
    >
      {content !== null && (
        <>
          <div className={styles['scrim']} onClick={open ? onClose : undefined} aria-hidden="true" />
          <div
            className={`${styles['sheet'] ?? ''} ${content.tone === 'bg' ? (styles['onBg'] ?? '') : ''}`}
            ref={sheetRef}
          >
            <span className={styles['handle']} aria-hidden="true" />
            <div className={styles['head']}>
              <div className={styles['titles']}>
                <h2 id={titleId} className={styles['title']}>
                  {content.title}
                </h2>
                {content.subtitle !== undefined && (
                  <span className={styles['subtitle']}>{content.subtitle}</span>
                )}
              </div>
              <button
                type="button"
                className={styles['close']}
                aria-label="Schließen"
                onClick={open ? onClose : undefined}
              >
                <X size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            {content.header !== undefined && <div className={styles['header']}>{content.header}</div>}
            <div className={styles['body']}>{content.children}</div>
            {content.footer !== undefined && <div className={styles['footer']}>{content.footer}</div>}
          </div>
        </>
      )}
    </dialog>
  );
}
