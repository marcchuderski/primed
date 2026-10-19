import type { ReactNode } from 'react';
import styles from './Skeleton.module.css';

const RADIUS = { text: 'radiusText', pill: 'radiusPill', card: 'radiusCard' } as const;

/**
 * Loading placeholders (DESIGN.md §8, D-157): the final layout is shown at once, each value is a flat bar at
 * its real size, and the bars pulse gently (opacity only, static with reduced motion). Nothing moves when the
 * data lands.
 */
export function Bone({
  width = '100%',
  height = 14,
  radius = 'text',
  className,
}: {
  width?: string | number;
  height?: number;
  radius?: 'text' | 'pill' | 'card';
  className?: string | undefined;
}) {
  return (
    <span
      className={[styles['bone'], styles[RADIUS[radius]], className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Wraps placeholders: busy for assistive technology, which hears "Lädt …" instead of empty shapes. */
export function Loading({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <div className={className} aria-busy="true">
      <span className="visually-hidden" role="status">
        Lädt …
      </span>
      {children}
    </div>
  );
}

/** One list row: title line and meta line, at the pitch of the real rows (EntryItem, library and menu rows). */
function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <span className={styles['row']}>
      <span className={styles['line']}>
        <Bone width={title} height={15} />
      </span>
      <span className={styles['metaLine']}>
        <Bone width={meta} height={12} />
      </span>
    </span>
  );
}

// Varying widths read as content, identical bars read as a pattern.
const WIDTHS = [
  ['62%', '44%'],
  ['48%', '36%'],
  ['70%', '40%'],
  ['54%', '30%'],
  ['66%', '42%'],
] as const;

/**
 * Placeholder list. `items`: separate rounded rows (Heute, Hinzufügen, Vorschläge);
 * `card`: one surface card with divided rows (Bibliothek, Gerichte, Menü).
 */
export function SkeletonRows({
  count = 3,
  variant = 'items',
}: {
  count?: number;
  variant?: 'items' | 'card';
}) {
  const rows = Array.from({ length: count }, (_, i) => WIDTHS[i % WIDTHS.length] ?? WIDTHS[0]);
  return (
    <span className={variant === 'card' ? styles['card'] : styles['items']} aria-hidden="true">
      {rows.map(([title, meta], i) => (
        <Row key={i} title={title} meta={meta} />
      ))}
    </span>
  );
}
