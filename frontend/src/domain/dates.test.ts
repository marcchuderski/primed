import { formatDate, recentDays } from './dates.ts';

describe('recentDays', () => {
  it('starts with today and yesterday and goes back across month borders', () => {
    const days = recentDays('2026-11-01', 4);
    expect(days.map((d) => d.value)).toEqual(['2026-11-01', '2026-10-31', '2026-10-30', '2026-10-29']);
    expect(days[0]?.label).toBe('Heute');
    expect(days[1]?.label).toBe('Gestern');
    expect(days[2]?.label).toBe('Fr., 30. Okt.');
  });
});

describe('formatDate', () => {
  it('formats an ISO date the German way', () => {
    expect(formatDate('2026-10-20')).toBe('20.10.2026');
  });
});
