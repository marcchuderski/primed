import { formatInt } from './format.ts';
import { rateKcal, type KcalRating } from './rating.ts';
import type { Macros, Targets } from './types.ts';

/** One day of the history as delivered by GET /history. */
export interface HistoryDay {
  date: string;
  isToday: boolean;
  dayTypeName: string;
  isTraining: boolean;
  targets: Targets;
  eaten: Macros;
  entryCount: number;
}

/** "/" for days without entries, "läuft" for today (BRIEFING §11). */
export type DayStatus = KcalRating | 'empty' | 'running';

/** Screen-reader and legend texts per status. */
export const STATUS_LABEL: Record<DayStatus, string> = {
  ok: 'im Rahmen',
  low: 'unter Soll',
  high: 'über Soll',
  empty: 'keine Einträge',
  running: 'läuft',
};

export function dayStatus(day: HistoryDay, tolerancePct: number): DayStatus {
  if (day.isToday) {
    return 'running';
  }
  if (day.entryCount === 0) {
    return 'empty';
  }
  return rateKcal(day.eaten.kcal, day.targets.kcal, tolerancePct);
}

/** Only finished days with entries count towards ratings, sums and averages. */
export function counts(day: HistoryDay): boolean {
  return !day.isToday && day.entryCount > 0;
}

export type BalanceLabel =
  'ausgeglichen' | 'leichtes Defizit' | 'Defizit' | 'leichter Überschuss' | 'Überschuss';

/**
 * Balance classification of a period (D-044): within the tolerance balanced, down to −15 % a slight deficit,
 * up to +10 % a slight surplus. The inner band follows the rating tolerance.
 */
export function classifyBalance(deviationPct: number, tolerancePct: number): BalanceLabel {
  if (Math.abs(deviationPct) <= tolerancePct) {
    return 'ausgeglichen';
  }
  if (deviationPct < 0) {
    return deviationPct >= -15 ? 'leichtes Defizit' : 'Defizit';
  }
  return deviationPct <= 10 ? 'leichter Überschuss' : 'Überschuss';
}

export interface PeriodSummary {
  /** Days that count (finished, with entries). */
  days: number;
  eaten: Macros;
  targets: Targets;
  /** kcal eaten − kcal target over the counted days. */
  balanceKcal: number;
  /** Deviation of the kcal sum from the target sum in percent; null without counted days. */
  deviationPct: number | null;
  label: BalanceLabel | null;
  avgProtein: number | null;
  ok: number;
  low: number;
  high: number;
}

const zeroMacros = (): Macros => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });

export function summarize(days: HistoryDay[], tolerancePct: number): PeriodSummary {
  const eaten = zeroMacros();
  const targets: Targets = { kcal: 0, protein: 0, carbs: 0, sugar: 0 };
  const tally = { ok: 0, low: 0, high: 0 };
  let n = 0;
  for (const day of days) {
    if (!counts(day)) {
      continue;
    }
    n++;
    eaten.kcal += day.eaten.kcal;
    eaten.protein += day.eaten.protein;
    eaten.carbs += day.eaten.carbs;
    eaten.fat += day.eaten.fat;
    eaten.sugar += day.eaten.sugar;
    targets.kcal += day.targets.kcal;
    targets.protein += day.targets.protein;
    targets.carbs += day.targets.carbs;
    targets.sugar += day.targets.sugar;
    tally[rateKcal(day.eaten.kcal, day.targets.kcal, tolerancePct)]++;
  }
  const deviationPct =
    n === 0 || targets.kcal <= 0 ? null : ((eaten.kcal - targets.kcal) / targets.kcal) * 100;
  return {
    days: n,
    eaten,
    targets,
    balanceKcal: eaten.kcal - targets.kcal,
    deviationPct,
    label: deviationPct === null ? null : classifyBalance(deviationPct, tolerancePct),
    avgProtein: n === 0 ? null : eaten.protein / n,
    ...tally,
  };
}

/** Deviation of one day in percent (for the week table). */
export function dayDeviationPct(day: HistoryDay): number | null {
  return day.targets.kcal > 0 ? ((day.eaten.kcal - day.targets.kcal) / day.targets.kcal) * 100 : null;
}

/** Lower and upper kcal bound "im Rahmen" for a target. */
export function kcalRange(target: number, tolerancePct: number): [number, number] {
  return [Math.round(target * (1 - tolerancePct / 100)), Math.round(target * (1 + tolerancePct / 100))];
}

// ---- Calendar helpers (dates as YYYY-MM-DD, computed in UTC to avoid DST shifts) ----

const toDate = (date: string) => new Date(`${date}T12:00:00Z`);
const toKey = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const d = toDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toKey(d);
}

/** ISO weekday, 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: string): number {
  return ((toDate(date).getUTCDay() + 6) % 7) + 1;
}

/** Monday of the ISO week containing the date. */
export function weekStart(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/** ISO 8601 week number and week-based year. */
export function isoWeek(date: string): { year: number; week: number } {
  const thursday = toDate(addDays(date, 4 - isoWeekday(date)));
  const year = thursday.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1, 12);
  const week = Math.floor((thursday.getTime() - jan1) / 86_400_000 / 7) + 1;
  return { year, week };
}

export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function monthEnd(date: string): string {
  const d = toDate(monthStart(date));
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return toKey(d);
}

export function shiftMonth(date: string, months: number): string {
  const d = toDate(monthStart(date));
  d.setUTCMonth(d.getUTCMonth() + months);
  return toKey(d);
}

/** All dates from `from` to `to` inclusive. */
export function dateRange(from: string, to: string): string[] {
  const result: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    result.push(d);
  }
  return result;
}

/** Days grouped by month ("YYYY-MM"), in order. */
export function byMonth(days: HistoryDay[]): Map<string, HistoryDay[]> {
  const groups = new Map<string, HistoryDay[]>();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    const list = groups.get(key) ?? [];
    list.push(day);
    groups.set(key, list);
  }
  return groups;
}

const TABLE_NAMES: Readonly<Record<string, string>> = {
  Ruhetag: 'Ruhe',
  'Leichtes Training': 'Leicht',
  'Normal · Fitness': 'Fitness',
  'Normal · Basketball': 'Basket.',
  'Intensiv / Spiel': 'Spiel',
};

/** Short day type name for the narrow week table (screen 13): "Basket.", "Ruhe" … */
export function tableDayTypeName(name: string): string {
  const known = TABLE_NAMES[name];
  if (known !== undefined) {
    return known;
  }
  const last = name.split(/ [·/] /).at(-1) ?? name;
  return last.length > 7 ? `${last.slice(0, 6)}.` : last;
}

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export function monthName(date: string): string {
  return MONTHS[Number(date.slice(5, 7)) - 1] ?? '';
}

/** "12.–18. Oktober", "28. September – 4. Oktober", across years with the year. */
export function formatWeekRange(start: string, end: string): string {
  const d1 = Number(start.slice(8, 10));
  const d2 = Number(end.slice(8, 10));
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${String(d1)}.–${String(d2)}. ${monthName(end)}`;
  }
  const y = start.slice(0, 4) === end.slice(0, 4) ? '' : ` ${start.slice(0, 4)}`;
  return `${String(d1)}. ${monthName(start)}${y} – ${String(d2)}. ${monthName(end)}`;
}

/** "+1.250", "−210", "±0" (typographic minus). */
export function formatSigned(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) {
    return '±0';
  }
  return rounded > 0 ? `+${formatInt(rounded)}` : `−${formatInt(-rounded)}`;
}

export interface MonthSummary {
  /** "YYYY-MM" */
  month: string;
  summary: PeriodSummary;
}

export function monthSummaries(days: HistoryDay[], tolerancePct: number): MonthSummary[] {
  return [...byMonth(days).entries()].map(([month, list]) => ({
    month,
    summary: summarize(list, tolerancePct),
  }));
}
