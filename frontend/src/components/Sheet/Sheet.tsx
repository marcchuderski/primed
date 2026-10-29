import { ChevronDown, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog.tsx';
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
  /** Unsaved input: swiping the sheet away asks before discarding it (D-185). */
  dirty?: boolean;
}

/**
 * Bottom sheet (DESIGN.md §6): handle, title left, close right. Built on the native modal <dialog>,
 * which traps focus, makes the page behind inert and closes on Escape. Dragging handle or title row down
 * closes it (D-185).
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
  dirty = false,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const moreBelow = useMoreBelow(bodyRef, open);
  const [askDiscard, setAskDiscard] = useState(false);
  const swipe = useSwipeDown(sheetRef, () => {
    if (dirty) {
      setAskDiscard(true);
    } else {
      onClose();
    }
  });
  useScrollLock(open);

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
          <div
            className={`${styles['scrim'] ?? ''} ${swipe.moved ? (styles['moved'] ?? '') : ''}`}
            style={swipe.moved ? { opacity: SCRIM_OPACITY * (1 - swipe.progress) } : undefined}
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            className={[
              styles['sheet'],
              tone === 'bg' ? styles['onBg'] : undefined,
              fullHeight ? styles['tall'] : undefined,
              swipe.moved ? styles['moved'] : undefined,
              swipe.dragging ? styles['dragging'] : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
            style={swipe.moved ? { transform: `translateY(${String(swipe.offset)}px)` } : undefined}
          >
            {/* Grab area: handle and title row. The content stays free for scrolling, wheels and lists. */}
            <div className={styles['grab']} {...swipe.handlers}>
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
          <ConfirmDialog
            open={askDiscard}
            title="Änderungen verwerfen?"
            text="Was du hier eingegeben hast, wird nicht gespeichert."
            confirmLabel="Verwerfen"
            onCancel={() => {
              setAskDiscard(false);
            }}
            onConfirm={() => {
              setAskDiscard(false);
              onClose();
            }}
          />
        </>
      )}
    </dialog>
  );
}

const SCRIM_OPACITY = 0.85;
/** Movement before a press on the grab area counts as a drag (taps on "Schließen" stay taps). */
const DRAG_START_PX = 8;
/** Released below this share of the sheet height, or flicked down faster, the sheet closes. */
const CLOSE_SHARE = 0.3;
const CLOSE_VELOCITY_PX_PER_MS = 0.5;

interface Swipe {
  /** Current downward offset in px. */
  offset: number;
  /** offset / sheet height, 0..1, for the scrim. */
  progress: number;
  /** The sheet follows the finger right now (no transition). */
  dragging: boolean;
  /** The sheet was dragged at least once: the slide-in animation no longer owns its transform. */
  moved: boolean;
  handlers: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: () => void;
    onClickCapture: (event: { preventDefault: () => void; stopPropagation: () => void }) => void;
  };
}

/**
 * Swipe down to dismiss (sheets.md, D-185): the sheet follows the finger; past 30 % of its height or on a quick
 * flick it calls `onDismiss` at once (no close animation, D-155), otherwise it springs back.
 */
function useSwipeDown(sheetRef: RefObject<HTMLDivElement | null>, onDismiss: () => void): Swipe {
  const start = useRef<{ x: number; y: number } | null>(null);
  const last = useRef<{ y: number; t: number; v: number }>({ y: 0, t: 0, v: 0 });
  const dragged = useRef(false);
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [moved, setMoved] = useState(false);

  function settle() {
    setDragging(false);
    setOffset(0);
    setProgress(0);
  }

  function reset() {
    start.current = null;
    settle();
  }

  return {
    offset,
    progress,
    dragging,
    moved,
    handlers: {
      onPointerDown: (event) => {
        if (event.button !== 0) {
          return;
        }
        start.current = { x: event.clientX, y: event.clientY };
        last.current = { y: event.clientY, t: event.timeStamp, v: 0 };
        dragged.current = false;
      },
      onPointerMove: (event) => {
        const from = start.current;
        if (from === null) {
          return;
        }
        const dy = event.clientY - from.y;
        if (!dragged.current) {
          if (dy > DRAG_START_PX && dy > Math.abs(event.clientX - from.x)) {
            dragged.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            setMoved(true);
          } else if (Math.abs(dy) > DRAG_START_PX || Math.abs(event.clientX - from.x) > DRAG_START_PX) {
            start.current = null;
          }
          return;
        }
        const dt = event.timeStamp - last.current.t;
        last.current = {
          y: event.clientY,
          t: event.timeStamp,
          v: dt > 0 ? (event.clientY - last.current.y) / dt : last.current.v,
        };
        const total = sheetRef.current?.offsetHeight ?? 0;
        setOffset(Math.max(0, dy));
        setProgress(total > 0 ? Math.min(1, Math.max(0, dy) / total) : 0);
      },
      onPointerUp: (event) => {
        if (start.current === null || !dragged.current) {
          start.current = null;
          return;
        }
        const dy = Math.max(0, event.clientY - start.current.y);
        const total = sheetRef.current?.offsetHeight ?? 0;
        if (dy >= total * CLOSE_SHARE || last.current.v >= CLOSE_VELOCITY_PX_PER_MS) {
          start.current = null;
          onDismiss();
          // Springs back if the sheet stays open (asking first, or the caller keeps it).
          settle();
          return;
        }
        reset();
      },
      onPointerCancel: reset,
      // A drag that started on "Schließen" must not also count as a tap on it.
      onClickCapture: (event) => {
        if (dragged.current) {
          dragged.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      },
    },
  };
}

/** Number of open sheets; stacked sheets (e.g. Hinzufügen → Menge) share one lock. */
let openSheets = 0;

/**
 * Keeps the page behind still while a sheet is open: iOS scrolled it on drags over scrim, handle and title,
 * which overscroll-behavior on the body does not cover. A class on <html> instead of a fixed body, so the
 * scroll position and sticky elements stay where they are.
 */
function useScrollLock(open: boolean): void {
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    openSheets += 1;
    document.documentElement.classList.add('scroll-locked');
    return () => {
      openSheets -= 1;
      if (openSheets === 0) {
        document.documentElement.classList.remove('scroll-locked');
      }
    };
  }, [open]);
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
