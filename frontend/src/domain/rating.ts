/** Day rating: only kcal vs. target, tolerance ±5 % (D-009). */
export type KcalRating = 'ok' | 'low' | 'high';

export const DEFAULT_TOLERANCE_PCT = 5;

/** Boundaries are inclusive: exactly ±5 % still counts as "im Rahmen". */
export function rateKcal(actual: number, target: number, tolerancePct = DEFAULT_TOLERANCE_PCT): KcalRating {
  if (target <= 0) {
    return actual > 0 ? 'high' : 'ok';
  }
  const deviation = ((actual - target) / target) * 100;
  if (deviation > tolerancePct) {
    return 'high';
  }
  if (deviation < -tolerancePct) {
    return 'low';
  }
  return 'ok';
}
