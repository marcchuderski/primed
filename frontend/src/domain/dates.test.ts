import { formatDate } from './dates.ts';

describe('formatDate', () => {
  it('formats an ISO date the German way', () => {
    expect(formatDate('2026-10-20')).toBe('20.10.2026');
  });
});
