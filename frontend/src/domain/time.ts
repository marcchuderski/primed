/** Length of the time grid used for entries and training times, in minutes. */
export const QUARTER_HOUR = 15;
export const MINUTES_PER_DAY = 24 * 60;

/**
 * Rounds a wall-clock time (minutes since midnight) up to the next quarter hour.
 * Exact quarter hours stay unchanged. May return MINUTES_PER_DAY (24:00) for times after 23:45;
 * callers decide how to map that onto the logical day.
 */
export function roundUpToQuarterHour(minutesOfDay: number): number {
  if (!Number.isInteger(minutesOfDay) || minutesOfDay < 0 || minutesOfDay >= MINUTES_PER_DAY) {
    throw new RangeError(`minutesOfDay out of range: ${String(minutesOfDay)}`);
  }
  return Math.ceil(minutesOfDay / QUARTER_HOUR) * QUARTER_HOUR;
}

/**
 * Maps a wall-clock time onto the logical day, which ends at the day boundary (default 02:00, D-048):
 * times before the boundary belong to the previous day and are placed after midnight (≥ 1440).
 */
export function toLogicalMinute(wallMinute: number, dayBoundaryMin: number): number {
  return wallMinute < dayBoundaryMin ? wallMinute + MINUTES_PER_DAY : wallMinute;
}

/** "HH:MM" for minutes since midnight (values ≥ 24:00 wrap around). */
export function formatClock(minutes: number): string {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
