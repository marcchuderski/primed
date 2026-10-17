import { checkpointFor } from './checkpoint.ts';
import { dailyLine, greetingLine, shortDayTypeName, type GreetingInput } from './greeting.ts';

const rule = { offsetMin: 180, pct: 70, earliestMin: 360 };
const zero = { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 };
const restTargets = { kcal: 2000, protein: 150, carbs: 200, sugar: 50 };
const trainingTargets = { kcal: 2600, protein: 150, carbs: 350, sugar: 50 };
const restDay = { isTraining: false, trainingStart: null, durationMin: null };
const basketball = { isTraining: true, trainingStart: 20 * 60, durationMin: 90 };

function rest(overrides: Partial<GreetingInput>): GreetingInput {
  return {
    date: '2026-10-19',
    now: 14 * 60,
    dayBoundaryMin: 120,
    dayTypeName: 'Ruhetag',
    day: restDay,
    checkpoint: null,
    targets: restTargets,
    eaten: zero,
    entryCount: 0,
    ...overrides,
  };
}

function trainingDay(overrides: Partial<GreetingInput>): GreetingInput {
  return rest({
    dayTypeName: 'Normal · Basketball',
    day: basketball,
    checkpoint: checkpointFor(basketball, trainingTargets, rule),
    targets: trainingTargets,
    ...overrides,
  });
}

describe('greetingLine', () => {
  it('1: says good morning with the short day type before 11 when nothing is logged', () => {
    expect(greetingLine(trainingDay({ now: 7 * 60 }))).toBe('Guten Morgen. Heute ist Basketball.');
    expect(greetingLine(rest({ now: 10 * 60 + 59 }))).toBe('Guten Morgen. Heute ist Ruhetag.');
  });

  it('1: not right after midnight (still the previous day) and not once something is logged', () => {
    expect(greetingLine(rest({ now: 24 * 60 + 30 }))).not.toContain('Guten Morgen');
    expect(
      greetingLine(rest({ now: 8 * 60, entryCount: 1, eaten: { ...zero, kcal: 300, protein: 20 } })),
    ).not.toContain('Guten Morgen');
  });

  it('2: counts down to the pre-workout before the checkpoint', () => {
    expect(greetingLine(trainingDay({ now: 14 * 60 + 30, entryCount: 2 }))).toBe(
      'Noch 2½ Stunden bis zu deinem Pre-Workout.',
    );
    expect(greetingLine(trainingDay({ now: 16 * 60 + 40, entryCount: 2 }))).toBe(
      'Gleich ist Zeit für dein Pre-Workout.',
    );
  });

  it('3: says it starts soon in the last 30 minutes', () => {
    expect(greetingLine(trainingDay({ now: 19 * 60 + 40, entryCount: 3 }))).toBe(
      "Gleich geht's los mit der nächsten Einheit.",
    );
  });

  it('3: counts down to the next session after the checkpoint', () => {
    expect(greetingLine(trainingDay({ now: 18 * 60 + 55, entryCount: 3 }))).toBe(
      'Noch 1 Stunde bis zur nächsten Einheit.',
    );
  });

  it('3: game days use the same sentence (no special game-day line)', () => {
    const game = { isTraining: true, trainingStart: 19 * 60, durationMin: 120 };
    const input = trainingDay({
      dayTypeName: 'Intensiv / Spiel',
      day: game,
      checkpoint: null,
      now: 18 * 60,
      entryCount: 1,
    });
    expect(greetingLine(input)).toBe('Noch 1 Stunde bis zur nächsten Einheit.');
  });

  it('4: praises recovery after the training', () => {
    expect(greetingLine(trainingDay({ now: 21 * 60 + 30, entryCount: 4 }))).toBe(
      'Starke Einheit. Jetzt zählt die Regeneration.',
    );
    expect(greetingLine(trainingDay({ now: 24 * 60 + 15, entryCount: 4 }))).toBe(
      'Starke Einheit. Jetzt zählt die Regeneration.',
    );
  });

  it('falls through to the nutrition rules during the training', () => {
    const eaten = { ...zero, kcal: 1500, protein: 140 };
    expect(greetingLine(trainingDay({ now: 20 * 60 + 30, entryCount: 3, eaten }))).toBe(
      'Nur noch 10 g Protein. Fast geschafft.',
    );
  });

  it('5: almost there when 15 g or less protein are open (rounded up)', () => {
    expect(greetingLine(rest({ entryCount: 3, eaten: { ...zero, kcal: 1500, protein: 135 } }))).toBe(
      'Nur noch 15 g Protein. Fast geschafft.',
    );
    expect(greetingLine(rest({ entryCount: 3, eaten: { ...zero, kcal: 1500, protein: 149.6 } }))).toBe(
      'Nur noch 1 g Protein. Fast geschafft.',
    );
  });

  it('6: all good when kcal are within ±5 % and protein is reached', () => {
    expect(greetingLine(rest({ entryCount: 5, eaten: { ...zero, kcal: 2050, protein: 152 } }))).toBe(
      'Alles im Rahmen. Stark gemacht.',
    );
  });

  it('6/7: use the tolerance from the settings', () => {
    const over8 = { entryCount: 6, eaten: { ...zero, kcal: 2160, protein: 152 } };
    expect(greetingLine(rest(over8))).toBe("Kalorien sind durch. Morgen geht's weiter.");
    expect(greetingLine(rest({ ...over8, tolerancePct: 10 }))).toBe('Alles im Rahmen. Stark gemacht.');
  });

  it('7: calories are done when more than 5 % over', () => {
    expect(greetingLine(rest({ entryCount: 6, eaten: { ...zero, kcal: 2200, protein: 120 } }))).toBe(
      "Kalorien sind durch. Morgen geht's weiter.",
    );
  });

  it('8a/8b: default with entries shows open protein or praises the reached target', () => {
    expect(greetingLine(rest({ entryCount: 2, eaten: { ...zero, kcal: 900, protein: 64.2 } }))).toBe(
      'Noch 86 g Protein für heute.',
    );
    expect(greetingLine(rest({ entryCount: 4, eaten: { ...zero, kcal: 1500, protein: 160 } }))).toBe(
      'Protein-Soll erreicht. Stark gemacht.',
    );
  });

  it('8c: default without entries uses the line of the day', () => {
    expect(greetingLine(rest({}))).toBe(dailyLine('2026-10-19'));
  });

  it('formats protein with German thousands separators', () => {
    const big = rest({
      entryCount: 1,
      targets: { ...restTargets, protein: 1200 },
      eaten: { ...zero, kcal: 100, protein: 10 },
    });
    expect(greetingLine(big)).toBe('Noch 1.190 g Protein für heute.');
  });
});

describe('dailyLine', () => {
  it('is stable for a date and varies across dates', () => {
    expect(dailyLine('2026-10-19')).toBe(dailyLine('2026-10-19'));
    const lines = new Set(Array.from({ length: 14 }, (_, i) => dailyLine(`2026-10-${String(10 + i)}`)));
    expect(lines.size).toBeGreaterThan(1);
  });
});

describe('shortDayTypeName', () => {
  it('shortens the default day types and keeps custom names', () => {
    expect(shortDayTypeName('Normal · Fitness')).toBe('Fitness');
    expect(shortDayTypeName('Intensiv / Spiel')).toBe('Spieltag');
    expect(shortDayTypeName('Krafttraining')).toBe('Krafttraining');
  });
});
