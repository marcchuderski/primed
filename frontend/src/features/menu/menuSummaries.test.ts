import { formatDuration, weekSummary } from './menuSummaries.ts';

const t = (id: number, name: string, isTraining: boolean) => ({
  id,
  name,
  kcal: 0,
  protein: null,
  effectiveProtein: 0,
  carbs: 0,
  sugarRef: 0,
  isTraining,
  sort: id,
  isRest: !isTraining,
});
const types = [t(1, 'Ruhetag', false), t(2, 'Normal · Fitness', true), t(3, 'Intensiv / Spiel', true)];
const day = (weekday: number, dayTypeId: number, trainingStart: number | null = null) => ({
  weekday,
  dayTypeId,
  trainingStart,
  durationMin: trainingStart === null ? null : 90,
});

describe('menu summaries', () => {
  it('formats durations', () => {
    expect(formatDuration(180)).toBe('3 h');
    expect(formatDuration(165)).toBe('2 h 45 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('summarises the week template', () => {
    expect(weekSummary([day(1, 1), day(2, 1)], types)).toBe('Keine Trainingstage');
    expect(weekSummary([day(4, 2, 1080), day(1, 2, 1080), day(2, 1)], types)).toBe('Mo + Do Fitness 18:00');
    expect(weekSummary([day(1, 2, 1080), day(3, 3, 1080)], types)).toBe('2 Trainingstage');
  });
});
