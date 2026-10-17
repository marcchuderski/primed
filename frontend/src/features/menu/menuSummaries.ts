import type { DayType, Settings, TemplateDay } from '../../api/days.ts';
import { formatClock } from '../../domain/time.ts';

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
export const WEEKDAYS_LONG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const;

/** "3 h", "2 h 45 min", "45 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) {
    return `${String(m)} min`;
  }
  return m === 0 ? `${String(h)} h` : `${String(h)} h ${String(m)} min`;
}

/** "Basketball" from "Normal · Basketball". */
function shortName(name: string): string {
  const parts = name.split(' · ');
  return parts.at(-1) ?? name;
}

/** Menu subtitle for the week template, e.g. "Di + Do Basketball 20:00" (screen 16). */
export function weekSummary(template: TemplateDay[], types: DayType[]): string {
  const training = [...template]
    .sort((a, b) => a.weekday - b.weekday)
    .map((d) => ({ day: d, type: types.find((t) => t.id === d.dayTypeId) }))
    .filter((x) => x.type?.isTraining === true);
  if (training.length === 0) {
    return 'Keine Trainingstage';
  }
  const first = training[0];
  const same = training.every(
    (x) => x.type?.id === first?.type?.id && x.day.trainingStart === first?.day.trainingStart,
  );
  if (!same || first?.type === undefined) {
    return `${String(training.length)} Trainingstage`;
  }
  const days = training.map((x) => WEEKDAYS_SHORT[x.day.weekday - 1] ?? '').join(' + ');
  const time = first.day.trainingStart === null ? '' : ` ${formatClock(first.day.trainingStart)}`;
  return `${days} ${shortName(first.type.name)}${time}`;
}

export function checkpointSummary(settings: Settings): string {
  return `Bis ${formatDuration(settings.checkpoint.offsetMin)} vor Training: ${String(settings.checkpoint.pct)} %`;
}

export function shakesSummary(settings: Settings): string {
  const a = settings.shakeAmounts;
  return `Groß ${String(a.bigMl)} ml · Klein ${String(a.smallMl)} ml · ${String(a.powderG)} g Pulver`;
}
