import {
  formatLongDay,
  formatShortDay,
  isInWindow,
  kcalDeviationPct,
  pastDayDefaultTime,
  windowDates,
} from './pastDay.ts';

describe('edit window (D-176)', () => {
  it('lists today and the seven previous days, newest first', () => {
    const dates = windowDates('2026-10-20');
    expect(dates).toHaveLength(8);
    expect(dates[0]).toBe('2026-10-20');
    expect(dates[7]).toBe('2026-10-13');
    expect(windowDates('2026-03-02')).toContain('2026-02-28');
  });

  it('accepts only dates inside the window', () => {
    expect(isInWindow('2026-10-20', '2026-10-20')).toBe(true);
    expect(isInWindow('2026-10-13', '2026-10-20')).toBe(true);
    expect(isInWindow('2026-10-12', '2026-10-20')).toBe(false);
    expect(isInWindow('2026-10-21', '2026-10-20')).toBe(false);
  });
});

describe('pastDayDefaultTime (D-177)', () => {
  it('takes the last entry of the logical day, otherwise 12:00', () => {
    expect(pastDayDefaultTime([], 120)).toBe(720);
    expect(pastDayDefaultTime([{ timeMin: 480 }, { timeMin: 1170 }, { timeMin: 780 }], 120)).toBe(1170);
    // 00:30 belongs to the evening before (day boundary 02:00) and is the latest.
    expect(pastDayDefaultTime([{ timeMin: 1290 }, { timeMin: 30 }], 120)).toBe(30);
  });
});

describe('day labels and deviation', () => {
  it('formats short and long day labels', () => {
    expect(formatShortDay('2026-10-19')).toBe('Mo, 19.10.');
    expect(formatLongDay('2026-10-19')).toBe('Montag, 19.10.');
    expect(formatShortDay('2026-10-25')).toBe('So, 25.10.');
  });

  it('rounds the kcal deviation', () => {
    expect(kcalDeviationPct(2540, 2600)).toBe(-2);
    expect(kcalDeviationPct(2860, 2600)).toBe(10);
    expect(kcalDeviationPct(100, 0)).toBeNull();
  });
});
