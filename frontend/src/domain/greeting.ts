import type { Checkpoint } from './checkpoint.ts';
import { formatInt, formatRemaining } from './format.ts';
import { rateKcal } from './rating.ts';
import type { Macros, Targets, TrainingInfo } from './types.ts';

/** Short names of the default day types (BRIEFING §4a); other names are used as they are. */
const SHORT_NAMES: Readonly<Record<string, string>> = {
  Ruhetag: 'Ruhetag',
  'Leichtes Training': 'leichtes Training',
  'Normal · Fitness': 'Fitness',
  'Normal · Basketball': 'Basketball',
  'Intensiv / Spiel': 'Spieltag',
};

const DAILY_LINES = [
  'Schön, dass du da bist.',
  'Ein guter Tag zum Dranbleiben.',
  'Schritt für Schritt.',
  'Bleib dran.',
] as const;

const MORNING_END = 11 * 60;
const PROTEIN_ALMOST_DONE_G = 15;

export interface GreetingInput {
  /** Logical day (YYYY-MM-DD); picks the daily line. */
  date: string;
  /** Current time as logical minute (≥ 1440 after midnight). */
  now: number;
  dayBoundaryMin: number;
  dayTypeName: string;
  day: TrainingInfo;
  checkpoint: Checkpoint | null;
  targets: Targets;
  eaten: Macros;
  entryCount: number;
  tolerancePct?: number;
}

export function shortDayTypeName(name: string): string {
  return SHORT_NAMES[name] ?? name;
}

/**
 * The situational sentence after "Hey, [Name]." (BRIEFING §4a, D-101). The first matching rule wins.
 */
export function greetingLine(input: GreetingInput): string {
  const { now, day, checkpoint, targets, eaten, entryCount } = input;
  const proteinOpen = targets.protein - eaten.protein;

  // 1. Morning, nothing logged yet (only 02:00–11:00, not right after midnight).
  if (entryCount === 0 && now >= input.dayBoundaryMin && now < MORNING_END) {
    return `Guten Morgen. Heute ist ${shortDayTypeName(input.dayTypeName)}.`;
  }

  if (day.isTraining && day.trainingStart !== null) {
    const start = day.trainingStart;
    const end = start + (day.durationMin ?? 0);
    // 2. Before the checkpoint.
    if (checkpoint !== null && now < checkpoint.time) {
      const left = checkpoint.time - now;
      return left < 30
        ? 'Gleich ist Zeit für dein Pre-Workout.'
        : `Noch ${formatRemaining(left)} bis zu deinem Pre-Workout.`;
    }
    // 3. Between checkpoint and training start.
    if (now < start) {
      const left = start - now;
      return left < 30
        ? "Gleich geht's los mit der nächsten Einheit."
        : `Noch ${formatRemaining(left)} bis zur nächsten Einheit.`;
    }
    // 4. After the training.
    if (now >= end) {
      return 'Starke Einheit. Jetzt zählt die Regeneration.';
    }
  }

  // 5. Almost there.
  if (proteinOpen > 0 && proteinOpen <= PROTEIN_ALMOST_DONE_G) {
    return `Nur noch ${formatInt(Math.ceil(proteinOpen))} g Protein. Fast geschafft.`;
  }

  const rating = rateKcal(eaten.kcal, targets.kcal, input.tolerancePct);
  // 6. All good.
  if (rating === 'ok' && proteinOpen <= 0) {
    return 'Alles im Rahmen. Stark gemacht.';
  }
  // 7. Over the calorie target.
  if (rating === 'high') {
    return "Kalorien sind durch. Morgen geht's weiter.";
  }

  // 8. Default.
  if (entryCount > 0) {
    return proteinOpen > 0
      ? `Noch ${formatInt(Math.ceil(proteinOpen))} g Protein für heute.`
      : 'Protein-Soll erreicht. Stark gemacht.';
  }
  return dailyLine(input.date);
}

/** Stable per date: the same line all day, a different one on most days. */
export function dailyLine(date: string): string {
  let hash = 0;
  for (const char of date) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return DAILY_LINES[hash % DAILY_LINES.length] ?? DAILY_LINES[0];
}
