import { sumMacros } from './targets.ts';
import type { CheckpointRule, EntryMacros, Macros, Targets, TrainingInfo } from './types.ts';

export interface Checkpoint {
  /** Wall-clock minutes since midnight. */
  time: number;
  pct: number;
  /** Partial targets to reach by the checkpoint (rounded). */
  kcal: number;
  protein: number;
  carbs: number;
}

/**
 * Checkpoint of a training day (BRIEFING §4): training start − offset, pct of kcal/protein/carbs.
 * None on rest days, and none if it would fall before the earliest checkpoint (D-054).
 */
export function checkpointFor(day: TrainingInfo, targets: Targets, rule: CheckpointRule): Checkpoint | null {
  if (!day.isTraining || day.trainingStart === null) {
    return null;
  }
  const time = day.trainingStart - rule.offsetMin;
  if (time < rule.earliestMin) {
    return null;
  }
  const share = rule.pct / 100;
  return {
    time,
    pct: rule.pct,
    kcal: Math.round(targets.kcal * share),
    protein: Math.round(targets.protein * share),
    carbs: Math.round(targets.carbs * share),
  };
}

/** What was eaten up to and including the checkpoint time (entry times are inclusive). */
export function eatenUntil(entries: readonly EntryMacros[], wallMinute: number): Macros {
  return sumMacros(entries.filter((e) => e.logicalMinute <= wallMinute));
}

/** Training end in wall-clock minutes, or null on rest days. */
export function trainingEnd(day: TrainingInfo): number | null {
  if (!day.isTraining || day.trainingStart === null) {
    return null;
  }
  return day.trainingStart + (day.durationMin ?? 0);
}
