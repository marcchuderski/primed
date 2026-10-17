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

interface WordmarkProps {
  size?: number;
  className?: string | undefined;
}

/** "primed" in lowercase, the "p" in the accent color. */
export function Wordmark({ size = 28, className }: WordmarkProps) {
  return (
    <span className={[styles['wordmark'], className].filter(Boolean).join(' ')} style={{ fontSize: size }}>
      <span className={styles['p']}>p</span>rimed
    </span>
  );
}
