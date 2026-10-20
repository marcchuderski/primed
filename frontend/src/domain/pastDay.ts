import { addDays } from './history.ts';
import { toLogicalMinute } from './time.ts';

/** Entries and the day type can be changed for today and this many days back (D-176, enforced by the API). */
export const EDIT_WINDOW_DAYS = 7;

/** Preset time when logging on a past day without entries (D-177). */
export const PAST_DAY_DEFAULT_MIN = 12 * 60;

/** Today and the days of the edit window, newest first (today + 7 = 8 dates). */
export function windowDates(today: string): string[] {
  return Array.from({ length: EDIT_WINDOW_DAYS + 1 }, (_, i) => addDays(today, -i));
}

export function isInWindow(date: string, today: string): boolean {
  return date <= today && date >= addDays(today, -EDIT_WINDOW_DAYS);
}

/**
 * Preset time for logging on a past day (D-177): the time of the day's last entry (in logical order, so an entry
 * after midnight counts as late), otherwise 12:00.
 */
export function pastDayDefaultTime(entries: readonly { timeMin: number }[], dayBoundaryMin: number): number {
  let latest: number | null = null;
  for (const entry of entries) {
    if (
      latest === null ||
      toLogicalMinute(entry.timeMin, dayBoundaryMin) > toLogicalMinute(latest, dayBoundaryMin)
    ) {
      latest = entry.timeMin;
    }
  }
  return latest ?? PAST_DAY_DEFAULT_MIN;
}

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function parts(date: string): { weekday: number; day: string; month: string } {
  const [, month, day] = date.split('-');
  return { weekday: new Date(`${date}T12:00:00Z`).getUTCDay(), day: day ?? '', month: month ?? '' };
}

/** "Mo, 19.10." */
export function formatShortDay(date: string): string {
  const p = parts(date);
  return `${WEEKDAYS_SHORT[p.weekday] ?? ''}, ${p.day}.${p.month}.`;
}

/** "Montag, 19.10." */
export function formatLongDay(date: string): string {
  const p = parts(date);
  return `${WEEKDAYS_LONG[p.weekday] ?? ''}, ${p.day}.${p.month}.`;
}

/** kcal deviation from the target in whole percent (e.g. −2), null without a target. */
export function kcalDeviationPct(eaten: number, target: number): number | null {
  return target > 0 ? Math.round(((eaten - target) / target) * 100) : null;
}
