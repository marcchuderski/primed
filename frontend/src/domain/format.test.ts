import { formatDecimal, formatInt, formatRemaining } from './format.ts';
import { formatClock, toLogicalMinute } from './time.ts';

describe('formatInt / formatDecimal', () => {
  it('uses German separators and a real minus sign', () => {
    expect(formatInt(1092)).toBe('1.092');
    expect(formatInt(-210)).toBe('−210');
    expect(formatInt(24.6)).toBe('25');
    expect(formatDecimal(0.5)).toBe('0,5');
    expect(formatDecimal(16)).toBe('16');
  });
});

describe('formatRemaining', () => {
  it.each([
    [0, 'gleich'],
    [29, 'gleich'],
    [30, '30 Minuten'],
    [44, '30 Minuten'],
    [45, '1 Stunde'],
    [74, '1 Stunde'],
    [75, '1½ Stunden'],
    [120, '2 Stunden'],
    [150, '2½ Stunden'],
    [330, '5½ Stunden'],
  ])('%i min → %s', (minutes, text) => {
    expect(formatRemaining(minutes)).toBe(text);
  });
});

describe('time helpers', () => {
  it('places times before the day boundary after midnight', () => {
    expect(toLogicalMinute(30, 120)).toBe(1470);
    expect(toLogicalMinute(120, 120)).toBe(120);
  });

  it('formats clock times and wraps after midnight', () => {
    expect(formatClock(17 * 60)).toBe('17:00');
    expect(formatClock(24 * 60 + 30)).toBe('00:30');
  });
});
