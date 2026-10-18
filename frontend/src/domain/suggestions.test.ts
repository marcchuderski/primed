import { checkpointFor, eatenUntil } from './checkpoint.ts';
import {
  decideShake,
  suggest,
  type Candidate,
  type ShakeOption,
  type SuggestionInput,
} from './suggestions.ts';

const m = (kcal: number, protein: number, carbs = 0, fat = 0) => ({ kcal, protein, carbs, fat, sugar: 0 });
const shakes: ShakeOption[] = [
  { id: 'big', name: 'Shake Groß 1,5 %', nutrients: m(300, 35, 21, 8) },
  { id: 'small_low', name: 'Shake Klein 1,5 %', nutrients: m(206, 28, 12, 5) },
  { id: 'small_high', name: 'Shake Klein 3,5 %', nutrients: m(240, 28, 11, 9) },
];
const candidates: Candidate[] = [
  {
    kind: 'dish',
    id: 7,
    name: 'Bolognese',
    amount: 1,
    unit: 'portion',
    amountText: '1 Portion',
    nutrients: m(640, 42, 78, 16),
  },
  {
    kind: 'food',
    id: 3,
    name: 'REWE Quarkcreme',
    amount: 1,
    unit: 'packung',
    amountText: '1 Packung',
    nutrients: m(134, 25, 6, 1),
  },
  {
    kind: 'food',
    id: 8,
    name: 'Lidl Müsli-Riegel',
    amount: 2,
    unit: 'stueck',
    amountText: '2 Stück',
    nutrients: m(174, 4, 34, 4.6),
  },
  {
    kind: 'food',
    id: 9,
    name: 'Lidl Chicken Nuggets',
    amount: 300,
    unit: 'g',
    amountText: '300 g',
    nutrients: m(945, 76, 70, 40),
  },
];
const rest = { isTraining: false, trainingStart: null, durationMin: null };
const training = { isTraining: true, trainingStart: 20 * 60, durationMin: 90 };
const restTargets = { kcal: 2000, protein: 150, carbs: 200, sugar: 50 };
const trainingTargets = { kcal: 2600, protein: 150, carbs: 350, sugar: 50 };
const rule = { offsetMin: 180, pct: 70, earliestMin: 360 };

function input(over: Partial<SuggestionInput>): SuggestionInput {
  return {
    now: 14 * 60,
    day: rest,
    checkpoint: null,
    targets: restTargets,
    eaten: m(0, 0),
    eatenUntilCheckpoint: null,
    shakes,
    candidates,
    ...over,
  };
}

describe('decideShake (BRIEFING §10)', () => {
  it('no shake with less than 25 g protein open', () => {
    expect(decideShake(input({ eaten: m(1500, 130) })).shake).toBeNull();
  });

  it('calories exceeded: small 1,5 % only with at least 30 g protein open', () => {
    expect(decideShake(input({ eaten: m(2100, 115) })).shake).toBe('small_low');
    expect(decideShake(input({ eaten: m(2100, 122) })).shake).toBeNull();
  });

  it('training day before training: carbs first, no shake', () => {
    expect(decideShake(input({ day: training, targets: trainingTargets, now: 15 * 60 })).shake).toBeNull();
  });

  it('after training: big with ≥ 35 g protein and ≥ 500 kcal open, otherwise small', () => {
    const after = { day: training, targets: trainingTargets, now: 22 * 60 };
    expect(decideShake(input({ ...after, eaten: m(2050, 100, 300) })).shake).toBe('big');
    expect(decideShake(input({ ...after, eaten: m(2300, 120, 300) })).shake).toBe('small_low');
  });

  it('after training with ≥ 700 kcal and ≥ 100 g carbs open: light meal plus small shake', () => {
    const d = decideShake(
      input({ day: training, targets: trainingTargets, now: 22 * 60, eaten: m(1500, 90, 150) }),
    );
    expect(d.shake).toBe('small_high');
    expect('withLightMeal' in d && d.withLightMeal).toBe(true);
  });

  it('rest day from 19:00: small 3,5 % with ≥ 400 kcal open, otherwise 1,5 %', () => {
    expect(decideShake(input({ now: 19 * 60, eaten: m(1500, 110) })).shake).toBe('small_high');
    expect(decideShake(input({ now: 19 * 60, eaten: m(1700, 110) })).shake).toBe('small_low');
    expect(decideShake(input({ now: 18 * 60 + 45, eaten: m(1500, 110) })).shake).toBeNull();
  });
});

describe('suggest', () => {
  it('rest day afternoon: protein-rich foods within the calories, no shake yet', () => {
    const list = suggest(input({ eaten: m(900, 60) }));
    expect(list.map((s) => s.title)).toEqual(['Bolognese, 1 Portion', 'REWE Quarkcreme, 1 Packung']);
    expect(list.every((s) => s.nutrients.kcal <= 1100 * 1.1)).toBe(true);
    expect(list.some((s) => s.action.kind === 'shake')).toBe(false);
  });

  it('never suggests unrealistically large single meals', () => {
    const list = suggest(input({ eaten: m(0, 0) }));
    expect(list.map((s) => s.title)).not.toContain('Lidl Chicken Nuggets, 300 g');
  });

  it('training day before the checkpoint: pre-workout meal, carb snack window and the shake after training', () => {
    const cp = checkpointFor(training, trainingTargets, rule);
    const list = suggest(
      input({
        day: training,
        targets: trainingTargets,
        checkpoint: cp,
        now: 14 * 60 + 30,
        eaten: m(600, 50, 80),
        eatenUntilCheckpoint: eatenUntil([], 17 * 60),
      }),
    );
    expect(list.map((s) => s.when)).toEqual([
      'Jetzt · bis 17:00',
      '19:00–19:30',
      'Nach dem Training · in 7 Stunden',
    ]);
    expect(list[1]?.title).toBe('Lidl Müsli-Riegel, 2 Stück');
    expect(list[2]?.action).toEqual({ kind: 'shake', shake: 'big' });
  });

  it('after training: the shake comes first', () => {
    const list = suggest(
      input({ day: training, targets: trainingTargets, now: 22 * 60, eaten: m(2050, 100, 300) }),
    );
    expect(list[0]).toMatchObject({ when: 'Nach dem Training', title: 'Shake Groß 1,5 %' });
  });
});

describe('suggest without shakes (settings)', () => {
  it('never suggests a shake, also not in the evening', () => {
    const list = suggest(input({ now: 20 * 60, eaten: m(1500, 100), shakesEnabled: false }));
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((s) => s.action.kind === 'shake')).toBe(false);
  });

  it('suggests a protein meal after training instead of the shake', () => {
    const before = suggest(
      input({
        day: training,
        targets: trainingTargets,
        now: 14 * 60 + 30,
        eaten: m(600, 50, 80),
        checkpoint: checkpointFor(training, trainingTargets, rule),
        eatenUntilCheckpoint: eatenUntil([], 17 * 60),
        shakesEnabled: false,
      }),
    );
    const after = before.at(-1);
    expect(after?.when).toBe('Nach dem Training · in 7 Stunden');
    expect(after?.action.kind).not.toBe('shake');
    expect(after?.at).toBe(21 * 60 + 30);

    const now = suggest(
      input({
        day: training,
        targets: trainingTargets,
        now: 22 * 60,
        eaten: m(2050, 100, 300),
        shakesEnabled: false,
      }),
    );
    expect(now[0]?.when).toBe('Nach dem Training');
    expect(now.some((s) => s.action.kind === 'shake')).toBe(false);
  });
});
