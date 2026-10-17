/** Nutrient amounts in kcal and grams. */
export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
}

/** Day targets as stored with the day (snapshot). Fat has no target, only a derived reference. */
export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
}

export interface TrainingInfo {
  isTraining: boolean;
  /** Minutes since midnight (wall clock), null on rest days. */
  trainingStart: number | null;
  durationMin: number | null;
}

export interface CheckpointRule {
  /** Checkpoint = training start − offset (default 180 min). */
  offsetMin: number;
  /** Share of kcal, protein and carbs to reach by then (default 70). */
  pct: number;
  /** Earliest possible checkpoint (default 06:00 = 360); earlier checkpoints are dropped. */
  earliestMin: number;
}

/** A logged item reduced to what the calculations need. */
export interface EntryMacros extends Macros {
  /** Minutes since the start of the logical day's calendar date (0–1439, ≥ 1440 after midnight). */
  logicalMinute: number;
}
