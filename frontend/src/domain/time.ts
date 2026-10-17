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
