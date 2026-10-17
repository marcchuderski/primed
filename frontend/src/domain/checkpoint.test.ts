import { checkpointFor, eatenUntil, trainingEnd } from './checkpoint.ts';

const rule = { offsetMin: 180, pct: 70, earliestMin: 360 };
const targets = { kcal: 2600, protein: 150, carbs: 350, sugar: 50 };
const training = { isTraining: true, trainingStart: 20 * 60, durationMin: 90 };

describe('checkpointFor', () => {
  it('is 3 h before training with 70 % targets (mockup values)', () => {
    expect(checkpointFor(training, targets, rule)).toEqual({
      time: 17 * 60,
      pct: 70,
      kcal: 1820,
      protein: 105,
      carbs: 245,
    });
  });

  it('does not exist on rest days', () => {
    expect(
      checkpointFor({ isTraining: false, trainingStart: null, durationMin: null }, targets, rule),
    ).toBeNull();
  });

  it('is dropped before the earliest checkpoint (06:00), kept exactly at it', () => {
    expect(checkpointFor({ ...training, trainingStart: 9 * 60 }, targets, rule)?.time).toBe(6 * 60);
    expect(checkpointFor({ ...training, trainingStart: 8 * 60 + 45 }, targets, rule)).toBeNull();
  });
});

describe('eatenUntil', () => {
  const entry = (logicalMinute: number, kcal: number) => ({
    logicalMinute,
    kcal,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
  });

  it('includes entries up to and including the checkpoint time', () => {
    const entries = [
      entry(8 * 60, 100),
      entry(17 * 60, 200),
      entry(17 * 60 + 15, 400),
      entry(24 * 60 + 30, 800),
    ];
    expect(eatenUntil(entries, 17 * 60).kcal).toBe(300);
  });
});

describe('trainingEnd', () => {
  it('adds the duration', () => {
    expect(trainingEnd(training)).toBe(21 * 60 + 30);
    expect(trainingEnd({ isTraining: false, trainingStart: null, durationMin: null })).toBeNull();
  });
});
