import { MINUTES_PER_DAY, roundUpToQuarterHour } from './time.ts';

const hm = (h: number, m: number) => h * 60 + m;

describe('roundUpToQuarterHour', () => {
  it.each([
    [hm(14, 8), hm(14, 15)],
    [hm(14, 1), hm(14, 15)],
    [hm(14, 14), hm(14, 15)],
    [hm(14, 16), hm(14, 30)],
    [hm(14, 59), hm(15, 0)],
  ])('rounds %i up to %i', (input, expected) => {
    expect(roundUpToQuarterHour(input)).toBe(expected);
  });

  it('keeps exact quarter hours', () => {
    expect(roundUpToQuarterHour(hm(14, 0))).toBe(hm(14, 0));
    expect(roundUpToQuarterHour(hm(14, 45))).toBe(hm(14, 45));
    expect(roundUpToQuarterHour(0)).toBe(0);
  });

  it('returns 24:00 for times after 23:45', () => {
    expect(roundUpToQuarterHour(hm(23, 50))).toBe(MINUTES_PER_DAY);
  });

  it.each([-1, MINUTES_PER_DAY, 1.5, Number.NaN])('rejects invalid input %s', (input) => {
    expect(() => roundUpToQuarterHour(input)).toThrow(RangeError);
  });
});
