import {
  byMonth,
  formatWeekRange,
  tableDayTypeName,
  classifyBalance,
  dateRange,
  dayStatus,
  isoWeek,
  kcalRange,
  monthEnd,
  shiftMonth,
  summarize,
  weekStart,
  type HistoryDay,
} from './history.ts';

const day = (date: string, kcal: number, protein: number, over: Partial<HistoryDay> = {}): HistoryDay => ({
  date,
  isToday: false,
  dayTypeName: 'Ruhetag',
  isTraining: false,
  targets: { kcal: 2000, protein: 150, carbs: 200, sugar: 50 },
  eaten: { kcal, protein, carbs: 0, fat: 0, sugar: 0 },
  entryCount: kcal > 0 ? 3 : 0,
  statsExcluded: false,
  ...over,
});

describe('history (6.1)', () => {
  it('leaves excluded days out of status, sums and averages (D-180)', () => {
    const excluded = day('2026-10-18', 4000, 60, { statsExcluded: true });
    expect(dayStatus(excluded, 5)).toBe('excluded');
    expect(dayStatus(day('2026-10-17', 0, 0, { statsExcluded: true }), 5)).toBe('excluded');
    expect(dayStatus(day('2026-10-20', 900, 50, { isToday: true, statsExcluded: true }), 5)).toBe('running');

    const s = summarize([day('2026-10-19', 2000, 150), excluded], 5);
    expect(s.days).toBe(1);
    expect(s.eaten.kcal).toBe(2000);
    expect(s.balanceKcal).toBe(0);
    expect(s.avgProtein).toBe(150);
    expect(s.high).toBe(0);
    expect(summarize([excluded], 5).deviationPct).toBeNull();
  });

  it('rates days: running today, "/" without entries, otherwise kcal vs. target', () => {
    expect(dayStatus(day('2026-10-20', 1200, 90, { isToday: true }), 5)).toBe('running');
    expect(dayStatus(day('2026-10-19', 0, 0), 5)).toBe('empty');
    expect(dayStatus(day('2026-10-18', 2100, 150), 5)).toBe('ok');
    expect(dayStatus(day('2026-10-18', 2101, 150), 5)).toBe('high');
    expect(dayStatus(day('2026-10-18', 1899, 150), 5)).toBe('low');
    expect(dayStatus(day('2026-10-18', 2150, 150), 10)).toBe('ok');
  });

  it('classifies balances (D-044)', () => {
    expect(classifyBalance(-5, 5)).toBe('ausgeglichen');
    expect(classifyBalance(5, 5)).toBe('ausgeglichen');
    expect(classifyBalance(-5.1, 5)).toBe('leichtes Defizit');
    expect(classifyBalance(-15, 5)).toBe('leichtes Defizit');
    expect(classifyBalance(-15.1, 5)).toBe('Defizit');
    expect(classifyBalance(10, 5)).toBe('leichter Überschuss');
    expect(classifyBalance(10.1, 5)).toBe('Überschuss');
    expect(classifyBalance(8, 10)).toBe('ausgeglichen');
  });

  it('summarizes only finished days with entries', () => {
    const s = summarize(
      [
        day('2026-10-14', 1800, 140), // low (−10 %)
        day('2026-10-15', 2000, 160), // ok
        day('2026-10-16', 0, 0), // empty → ignored
        day('2026-10-17', 2300, 120), // high
        day('2026-10-18', 900, 50, { isToday: true }), // running → ignored
      ],
      5,
    );
    expect(s.days).toBe(3);
    expect(s.eaten.kcal).toBe(6100);
    expect(s.targets.kcal).toBe(6000);
    expect(s.balanceKcal).toBe(100);
    expect(s.deviationPct).toBeCloseTo(1.667, 2);
    expect(s.label).toBe('ausgeglichen');
    expect(s.avgProtein).toBe(140);
    expect([s.ok, s.low, s.high]).toEqual([1, 1, 1]);
  });

  it('has no balance without counted days', () => {
    const s = summarize([day('2026-10-16', 0, 0)], 5);
    expect(s).toMatchObject({ days: 0, deviationPct: null, label: null, avgProtein: null });
  });

  it('gives the kcal range of a target', () => {
    expect(kcalRange(2000, 5)).toEqual([1900, 2100]);
  });

  it('computes ISO weeks and calendar ranges', () => {
    expect(isoWeek('2026-10-20')).toEqual({ year: 2026, week: 43 });
    expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
    expect(isoWeek('2024-12-30')).toEqual({ year: 2025, week: 1 });
    expect(weekStart('2026-10-25')).toBe('2026-10-19');
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
    expect(monthEnd('2026-02-10')).toBe('2026-02-28');
    expect(monthEnd('2028-02-10')).toBe('2028-02-29');
    expect(shiftMonth('2026-01-31', -1)).toBe('2025-12-01');
    expect(dateRange('2026-03-28', '2026-03-31')).toEqual([
      '2026-03-28',
      '2026-03-29',
      '2026-03-30',
      '2026-03-31',
    ]);
    expect([...byMonth([day('2026-09-30', 1, 1), day('2026-10-01', 1, 1)]).keys()]).toEqual([
      '2026-09',
      '2026-10',
    ]);
  });

  it('formats week ranges and short day type names', () => {
    expect(formatWeekRange('2026-10-12', '2026-10-18')).toBe('12.–18. Oktober');
    expect(formatWeekRange('2026-09-28', '2026-10-04')).toBe('28. September – 4. Oktober');
    expect(formatWeekRange('2026-12-28', '2027-01-03')).toBe('28. Dezember 2026 – 3. Januar');
    expect(tableDayTypeName('Normal · Basketball')).toBe('Basket.');
    expect(tableDayTypeName('Yoga')).toBe('Yoga');
    expect(tableDayTypeName('Kraft · Oberkörper')).toBe('Oberkö.');
  });
});
