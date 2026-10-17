import type { Settings } from '../../api/days.ts';
import { DEFAULT_THRESHOLDS, type SuggestionThresholds } from '../../domain/suggestions.ts';

/** Settings (menu "Vorschläge") → domain thresholds; the remaining values stay fixed. */
export function thresholdsFromSettings(settings: Settings): SuggestionThresholds {
  const t = settings.thresholds;
  return {
    ...DEFAULT_THRESHOLDS,
    minProteinGapForShake: t.minProteinGap,
    bigShakeProtein: t.bigShakeProtein,
    bigShakeKcal: t.bigShakeKcal,
    lightMealKcal: t.lightMealKcal,
    restDayShakeFrom: t.restShakeFrom,
    restDayRichMilkKcal: t.richMilkKcal,
    overKcalShakeProtein: t.overKcalProtein,
  };
}
