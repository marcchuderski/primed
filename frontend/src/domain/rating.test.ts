import { rateKcal } from './rating.ts';

describe('rateKcal', () => {
  it.each([
    [2600, 2600, 'ok'],
    [2470, 2600, 'ok'], // −5 % exactly
    [2730, 2600, 'ok'], // +5 % exactly
    [2469, 2600, 'low'],
    [2731, 2600, 'high'],
    [0, 2000, 'low'],
  ] as const)('%i of %i → %s', (actual, target, expected) => {
    expect(rateKcal(actual, target)).toBe(expected);
  });

  it('respects a custom tolerance', () => {
    expect(rateKcal(2400, 2600, 10)).toBe('ok');
  });
});
