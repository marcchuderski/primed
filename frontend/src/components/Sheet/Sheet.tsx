import { ChevronDown, X } from 'lucide-react';
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
  /**
   * Fixed area between title and body, e.g. a search row; stays visible while the body scrolls.
   * Sheets with a header are search sheets: full height from the start (screens 04/05), so content that
   * loads later fills the sheet instead of growing it while it slides in.
   */
  header?: ReactNode;
  /** Fixed area below the body, e.g. actions; stays visible while the body scrolls. */
  footer?: ReactNode;
  /** Full height from the start, for sheets whose content loads (D-157); default: sheets with a header. */
  fullHeight?: boolean;
}

/**
 * Bottom sheet (DESIGN.md §6): handle, title left, close right. Built on the native modal <dialog>,
 * which traps focus, makes the page behind inert and closes on Escape.
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
  fullHeight = header !== undefined,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const moreBelow = useMoreBelow(bodyRef, open);

  // Layout effect: the dialog is open before children's effects run (e.g. wheels measuring scroll).
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal focuses the first control, which is still below the screen while the sheet slides in; iOS then
      // scrolls the dialog to show it. Undo that (older Safari without overflow: clip) and focus the dialog instead.
      dialog.scrollTop = 0;
      dialog.focus({ preventScroll: true });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles['dialog']}
      aria-labelledby={titleId}
      tabIndex={-1}
      onScroll={(event) => {
        event.currentTarget.scrollTop = 0;
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <div className={styles['scrim']} onClick={onClose} aria-hidden="true" />
          <div
            className={[
              styles['sheet'],
              tone === 'bg' ? styles['onBg'] : undefined,
              fullHeight ? styles['tall'] : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
          >
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
            {header !== undefined && <div className={styles['header']}>{header}</div>}
            <div className={styles['bodyWrap']}>
              <div ref={bodyRef} className={styles['body']}>
                {children}
              </div>
              {moreBelow && (
                <button
                  type="button"
                  className={styles['more']}
                  aria-label="Nach unten scrollen"
                  onClick={() => {
                    const body = bodyRef.current;
                    body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
                  }}
                >
                  <ChevronDown size={20} strokeWidth={2.4} aria-hidden="true" />
                </button>
              )}
            </div>
            {footer !== undefined && <div className={styles['footer']}>{footer}</div>}
          </div>
        </>
      )}
    </dialog>
  );
}

/**
 * True while the sheet body has content below the visible area (D-163): a round arrow at the bottom says
 * "there is more", e.g. the main button at the end of the quantity sheet. Re-checked on scroll, on content
 * changes (data arriving) and on resize.
 */
function useMoreBelow(bodyRef: { current: HTMLDivElement | null }, open: boolean): boolean {
  const [more, setMore] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    if (!open || body === null) {
      setMore(false);
      return;
    }
    const check = () => {
      setMore(body.scrollTop + body.clientHeight < body.scrollHeight - 12);
    };
    const frame = window.requestAnimationFrame(check);
    body.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(check);
    observer?.observe(body, { childList: true, subtree: true, characterData: true });
    return () => {
      window.cancelAnimationFrame(frame);
      body.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      observer?.disconnect();
    };
  }, [bodyRef, open]);

  return more;
}
