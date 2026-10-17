import type { Checkpoint } from './checkpoint.ts';
import { formatInt, formatRemaining } from './format.ts';
import { formatClock } from './time.ts';
import type { Macros, Targets, TrainingInfo } from './types.ts';

/** Thresholds (docs/DEFAULTS.md); most are editable in the menu under „Vorschläge“ (7.1). */
export interface SuggestionThresholds {
  minProteinGapForShake: number;
  bigShakeProtein: number;
  bigShakeKcal: number;
  lightMealKcal: number;
  lightMealCarbs: number;
  restDayShakeFrom: number;
  restDayRichMilkKcal: number;
  overKcalShakeProtein: number;
  /** Largest realistic single meal (BRIEFING §10). */
  maxMealKcal: number;
}

export const DEFAULT_THRESHOLDS: SuggestionThresholds = {
  minProteinGapForShake: 25,
  bigShakeProtein: 35,
  bigShakeKcal: 500,
  lightMealKcal: 700,
  lightMealCarbs: 100, // "viele KH offen" = ≥ 400 kcal from carbs (D-055)
  restDayShakeFrom: 19 * 60,
  restDayRichMilkKcal: 400,
  overKcalShakeProtein: 30,
  maxMealKcal: 900,
};

export type ShakeKind = 'big' | 'small_low' | 'small_high';

export interface ShakeOption {
  id: ShakeKind;
  name: string;
  nutrients: Macros;
}

/** Something that can be logged in one tap: a food (with its usual amount) or a dish portion. */
export interface Candidate {
  kind: 'food' | 'dish';
  id: number;
  name: string;
  amount: number;
  unit: string;
  amountText: string;
  nutrients: Macros;
}

export type SuggestionAction =
  | { kind: 'shake'; shake: ShakeKind }
  | { kind: 'food'; foodId: number; amount: number; unit: string }
  | { kind: 'dish'; dishId: number; portions: number };

export interface Suggestion {
  key: string;
  /** "Jetzt · Pre-Workout", "19:00–19:30", "Nach dem Training" … */
  when: string;
  title: string;
  reason: string;
  nutrients: Macros;
  action: SuggestionAction;
  /** Logical minute to log it at (now, the snack window, or the end of the training). */
  at: number;
}

export interface SuggestionInput {
  /** Current logical minute. */
  now: number;
  day: TrainingInfo;
  checkpoint: Checkpoint | null;
  targets: Targets;
  eaten: Macros;
  /** Eaten up to the checkpoint time (for the pre-workout target). */
  eatenUntilCheckpoint: Macros | null;
  shakes: ShakeOption[];
  candidates: Candidate[];
  thresholds?: SuggestionThresholds;
}

export type ShakeDecision =
  | { shake: ShakeKind; reason: string; withLightMeal?: boolean }
  | { shake: null; reason: string; withLightMeal?: undefined };

/**
 * Shake rules (BRIEFING §10, D-055, D-121). The first matching rule wins; protein has priority.
 */
export function decideShake(input: SuggestionInput): ShakeDecision {
  const t = input.thresholds ?? DEFAULT_THRESHOLDS;
  const proteinOpen = input.targets.protein - input.eaten.protein;
  const kcalOpen = input.targets.kcal - input.eaten.kcal;
  const carbsOpen = input.targets.carbs - input.eaten.carbs;
  const { day, now } = input;

  if (proteinOpen < t.minProteinGapForShake) {
    return {
      shake: null,
      reason: `Weniger als ${formatInt(t.minProteinGapForShake)} g Protein offen – dafür reicht normales Essen.`,
    };
  }
  if (kcalOpen < 0) {
    return proteinOpen >= t.overKcalShakeProtein
      ? { shake: 'small_low', reason: 'Kalorien sind durch, Protein fehlt noch – der leichteste Shake.' }
      : { shake: null, reason: 'Kalorien sind durch.' };
  }
  if (day.isTraining && day.trainingStart !== null) {
    const end = day.trainingStart + (day.durationMin ?? 0);
    if (now < day.trainingStart) {
      return { shake: null, reason: 'Vor dem Training zählen Kohlenhydrate, der Shake kommt danach.' };
    }
    if (now < end) {
      return { shake: null, reason: 'Während des Trainings kein Vorschlag.' };
    }
    if (kcalOpen >= t.lightMealKcal && carbsOpen >= t.lightMealCarbs) {
      return {
        shake: kcalOpen >= t.restDayRichMilkKcal ? 'small_high' : 'small_low',
        reason: 'Noch viel offen: eine leichte Mahlzeit plus kleiner Shake statt einer großen Portion.',
        withLightMeal: true,
      };
    }
    if (proteinOpen >= t.bigShakeProtein && kcalOpen >= t.bigShakeKcal) {
      return {
        shake: 'big',
        reason: 'Nach dem Training hat der Shake Vorrang – genug Protein und Kalorien offen.',
      };
    }
    return {
      shake: kcalOpen >= t.restDayRichMilkKcal ? 'small_high' : 'small_low',
      reason: 'Nach dem Training: ein kleiner Shake reicht für den Rest.',
    };
  }
  if (now >= t.restDayShakeFrom) {
    return kcalOpen >= t.restDayRichMilkKcal
      ? {
          shake: 'small_high',
          reason: 'Am Abend schließt ein kleiner Shake die Proteinlücke, Kalorien sind noch frei.',
        }
      : { shake: 'small_low', reason: 'Am Abend schließt ein kleiner Shake die Proteinlücke.' };
  }
  return { shake: null, reason: 'Noch Zeit – Protein lieber über Essen holen.' };
}

interface Goal {
  kcal: number;
  protein: number;
  carbs: number;
  focus: 'protein' | 'carbs';
}

/** Picks candidates that fit the open values without clearly exceeding them (BRIEFING §10). */
export function pickFoods(candidates: Candidate[], goal: Goal, count: number, maxKcal: number): Candidate[] {
  const limit = Math.min(maxKcal, Math.max(0, goal.kcal) * 1.1);
  const fitting = candidates.filter((c) => c.nutrients.kcal > 0 && c.nutrients.kcal <= limit);
  const score = (c: Candidate) => {
    const n = c.nutrients;
    if (goal.focus === 'carbs') {
      // Carbohydrate-rich, little fat before training (BRIEFING §4).
      return Math.min(n.carbs, Math.max(goal.carbs, 0)) - n.fat * 2;
    }
    return Math.min(n.protein, Math.max(goal.protein, 0)) * 3 - Math.max(0, n.kcal - goal.kcal) / 10;
  };
  return [...fitting].sort((a, b) => score(b) - score(a)).slice(0, count);
}

function foodAction(c: Candidate): SuggestionAction {
  return c.kind === 'dish'
    ? { kind: 'dish', dishId: c.id, portions: c.amount }
    : { kind: 'food', foodId: c.id, amount: c.amount, unit: c.unit };
}

/** "+640 kcal · +42 g P" */
export function formatEffect(n: Macros): string {
  return `+${formatInt(n.kcal)} kcal · +${formatInt(n.protein)} g P`;
}

/**
 * 2–3 suggestions for the rest of the day (BRIEFING §10): timing, short reason, macro effect, one-tap action.
 */
export function suggest(input: SuggestionInput): Suggestion[] {
  const t = input.thresholds ?? DEFAULT_THRESHOLDS;
  const { day, now, checkpoint, targets, eaten } = input;
  const result: Suggestion[] = [];
  const open = {
    kcal: targets.kcal - eaten.kcal,
    protein: targets.protein - eaten.protein,
    carbs: targets.carbs - eaten.carbs,
  };

  if (day.isTraining && day.trainingStart !== null && now < day.trainingStart) {
    const start = day.trainingStart;
    // Pre-workout: reach the checkpoint (or the day's carb goal) with carbohydrates.
    if (checkpoint !== null && now < checkpoint.time && input.eatenUntilCheckpoint !== null) {
      const goal = {
        kcal: checkpoint.kcal - input.eatenUntilCheckpoint.kcal,
        protein: checkpoint.protein - input.eatenUntilCheckpoint.protein,
        carbs: checkpoint.carbs - input.eatenUntilCheckpoint.carbs,
        focus: 'carbs' as const,
      };
      const [meal] = pickFoods(input.candidates, goal, 1, t.maxMealKcal);
      if (meal !== undefined && goal.kcal > 0) {
        result.push({
          key: `pre-${String(meal.id)}`,
          when: `Jetzt · bis ${formatClock(checkpoint.time)}`,
          title: `${meal.name}, ${meal.amountText}`,
          reason: `Bringt dich Richtung Pre-Workout-Ziel: ${formatInt(input.eatenUntilCheckpoint.carbs + meal.nutrients.carbs)} von ${formatInt(checkpoint.carbs)} g KH bis ${formatClock(checkpoint.time)}.`,
          nutrients: meal.nutrients,
          action: foodAction(meal),
          at: now,
        });
      }
    }
    // Optional carb snack 60–30 min before (20–40 g carbs, BRIEFING §4).
    const snackFrom = start - 60;
    if (now < start - 30) {
      const snack = input.candidates
        .filter((c) => c.nutrients.carbs >= 20 && c.nutrients.carbs <= 40 && c.nutrients.fat <= 10)
        .sort((a, b) => a.nutrients.fat - b.nutrients.fat)[0];
      if (snack !== undefined && !result.some((r) => r.key.endsWith(`-${String(snack.id)}`))) {
        result.push({
          key: `snack-${String(snack.id)}`,
          when: `${formatClock(Math.max(now, snackFrom))}–${formatClock(start - 30)}`,
          title: `${snack.name}, ${snack.amountText}`,
          reason: `${formatInt(snack.nutrients.carbs)} g schnelle KH kurz vor dem Training, leicht verdaulich.`,
          nutrients: snack.nutrients,
          action: foodAction(snack),
          at: Math.max(now, snackFrom),
        });
      }
    }
  } else {
    // Rest of the day: protein first, without exceeding the calories.
    const meals = pickFoods(input.candidates, { ...open, focus: 'protein' }, 2, t.maxMealKcal);
    for (const meal of meals) {
      if (open.protein <= 0 || open.kcal <= 0) {
        break;
      }
      result.push({
        key: `food-${String(meal.id)}`,
        when: 'Jetzt',
        title: `${meal.name}, ${meal.amountText}`,
        reason: `Danach fehlen noch ${formatInt(Math.max(0, open.protein - meal.nutrients.protein))} g Protein bei ${formatInt(open.kcal - meal.nutrients.kcal)} kcal Spielraum.`,
        nutrients: meal.nutrients,
        action: foodAction(meal),
        at: now,
      });
    }
  }

  // The shake decision (after training, evening, or when calories are exhausted).
  const decision = decideShake(input);
  const shake = decision.shake === null ? undefined : input.shakes.find((s) => s.id === decision.shake);
  if (shake !== undefined) {
    const afterTraining =
      day.isTraining && day.trainingStart !== null
        ? now >= day.trainingStart + (day.durationMin ?? 0)
        : false;
    result.unshift({
      key: `shake-${shake.id}`,
      when: afterTraining ? 'Nach dem Training' : 'Jetzt',
      title: decision.withLightMeal === true ? `Leichte Mahlzeit + ${shake.name}` : shake.name,
      reason: decision.reason,
      nutrients: shake.nutrients,
      action: { kind: 'shake', shake: shake.id },
      at: now,
    });
  } else if (day.isTraining && day.trainingStart !== null && now < day.trainingStart) {
    const shakeAfter = input.shakes.find(
      (s) =>
        s.id === (open.kcal >= t.bigShakeKcal && open.protein >= t.bigShakeProtein ? 'big' : 'small_low'),
    );
    if (shakeAfter !== undefined && open.protein >= t.minProteinGapForShake) {
      result.push({
        key: `after-${shakeAfter.id}`,
        when: `Nach dem Training · in ${formatRemaining(day.trainingStart + (day.durationMin ?? 0) - now)}`,
        title: shakeAfter.name,
        reason: 'Nach dem Training hat der Shake Vorrang vor einer großen Mahlzeit.',
        nutrients: shakeAfter.nutrients,
        action: { kind: 'shake', shake: shakeAfter.id },
        at: day.trainingStart + (day.durationMin ?? 0),
      });
    }
  }

  return result.slice(0, 3);
}
