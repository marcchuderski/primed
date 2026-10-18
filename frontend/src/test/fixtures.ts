import { DEFAULT_SETTINGS_THRESHOLDS, type Settings } from '../api/days.ts';

/** Settings as a new account gets them (docs/DEFAULTS.md). */
export const testSettings: Settings = {
  theme: 'system',
  proteinDefault: 150,
  defaultDurationMin: 90,
  earliestTrainingMin: 540,
  checkpoint: { offsetMin: 180, pct: 70, earliestMin: 360 },
  dayBoundaryMin: 120,
  shakeFoods: { proteinPowder: null },
  shakePowderG: 30,
  shakeLiquids: { milkLow: true, milkHigh: true, water: true },
  tolerancePct: 5,
  thresholds: DEFAULT_SETTINGS_THRESHOLDS,
  shakesEnabled: true,
};
