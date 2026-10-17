import styles from './Logo.module.css';

interface LogoMarkProps {
  size?: number;
  /** Plays the one-time loading animation (ring fills to ¾). */
  animated?: boolean;
  /** Accessible name; without it the mark is decorative. */
  label?: string;
}

/** The Primed mark: a "P" whose bowl is a ¾ progress ring (DESIGN.md §2). */
export function LogoMark({ size = 40, animated = false, label }: LogoMarkProps) {
  const a11y = label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={animated ? styles['animated'] : undefined}
      focusable="false"
      {...a11y}
    >
      <circle className={styles['track']} cx="66" cy="48" r="26" fill="none" strokeWidth="18" />
      <circle
        className={styles['arc']}
        cx="66"
        cy="48"
        r="26"
        fill="none"
        strokeWidth="18"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100 100"
        strokeDashoffset={28}
        transform="rotate(-90 66 48)"
      />
      <rect className={styles['stem']} x="26" y="20" width="18" height="84" rx="9" />
    </svg>
  );
}

interface LogoLockupProps {
  /** Font size of "rimed" in px; the mark scales with it (screen 18). */
  size?: number;
  /** Plays the one-time loading animation of the ring. */
  animated?: boolean;
  className?: string | undefined;
}

/**
 * Brand lockup: the mark is the "p", followed by "rimed" on the same baseline (screen 18).
 * Read by assistive technology as "Primed".
 */
export function LogoLockup({ size = 28, animated = false, className }: LogoLockupProps) {
  const markHeight = Math.round(size * 0.81);
  const markWidth = Math.round(markHeight * (75 / 90));

  return (
    <span
      role="img"
      aria-label="Primed"
      className={[styles['lockup'], animated ? styles['animated'] : undefined, className]
        .filter(Boolean)
        .join(' ')}
      style={{ fontSize: size, gap: Math.max(2, Math.round(size * 0.058)) }}
    >
      <svg width={markWidth} height={markHeight} viewBox="26 13 75 90" aria-hidden="true" focusable="false">
        <circle className={styles['track']} cx="66" cy="48" r="26" fill="none" strokeWidth="18" />
        <circle
          className={styles['arc']}
          cx="66"
          cy="48"
          r="26"
          fill="none"
          strokeWidth="18"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={28}
          transform="rotate(-90 66 48)"
        />
        <rect className={styles['stem']} x="26" y="20" width="18" height="83" rx="9" />
      </svg>
      <span className={styles['rimed']} aria-hidden="true">
        rimed
      </span>
    </span>
  );
}
