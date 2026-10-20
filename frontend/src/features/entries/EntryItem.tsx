import { Trash2 } from 'lucide-react';
import { useRef, useState, type PointerEvent } from 'react';
import type { Entry } from '../../api/entries.ts';
import { formatInt } from '../../domain/format.ts';
import { entryAmountText } from './entryText.ts';
import { formatClock } from '../../domain/time.ts';
import styles from './EntryItem.module.css';

const SWIPE_DELETE_PX = 72;
const SWIPE_MAX_PX = 110;

/**
 * List entry (DESIGN.md §6): tap edits, swipe left deletes (after confirmation, D-052). Without handlers it is
 * only shown (days older than the edit window, D-176).
 */
export function EntryItem({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit?: ((entry: Entry) => void) | undefined;
  onDelete?: ((entry: Entry) => void) | undefined;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const [offset, setOffset] = useState(0);

  function down(event: PointerEvent<HTMLButtonElement>) {
    start.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (start.current === null) {
      return;
    }
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (!moved.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (moved.current) {
      setOffset(Math.max(-SWIPE_MAX_PX, Math.min(0, dx)));
    }
  }

  function up() {
    if (moved.current && offset <= -SWIPE_DELETE_PX) {
      onDelete?.(entry);
    }
    start.current = null;
    setOffset(0);
  }

  const n = entry.nutrients;
  const content = (
    <>
      <span className={styles['texts']}>
        <span className={styles['title']}>
          {entry.name} · {entryAmountText(entry)}
        </span>
        <span className={styles['macros']}>
          {formatInt(n.kcal)} kcal · <span className={styles['protein']}>{formatInt(n.protein)} g P</span> ·{' '}
          {formatInt(n.carbs)} g KH · {formatInt(n.fat)} g F
        </span>
      </span>
      <span className={styles['time']}>{formatClock(entry.timeMin)}</span>
    </>
  );

  if (onEdit === undefined || onDelete === undefined) {
    return (
      <li className={styles['wrap']}>
        <div className={styles['item']}>{content}</div>
      </li>
    );
  }

  return (
    <li className={styles['wrap']}>
      <span className={styles['behind']} aria-hidden="true">
        <Trash2 size={16} strokeWidth={2.2} />
        Löschen
      </span>
      <button
        type="button"
        className={`${styles['item'] ?? ''} ${offset !== 0 ? (styles['dragging'] ?? '') : ''}`}
        style={{ transform: `translateX(${String(offset)}px)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null;
          setOffset(0);
        }}
        onClick={() => {
          if (!moved.current) {
            onEdit(entry);
          }
        }}
        aria-label={`${entry.name}, ${entryAmountText(entry)}, ${formatClock(entry.timeMin)} Uhr. Bearbeiten`}
      >
        {content}
      </button>
    </li>
  );
}
