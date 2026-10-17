import { ApiError } from '../../api/client.ts';
import { formatWait, loginErrorMessage } from './loginErrors.ts';

describe('formatWait', () => {
  it.each([
    [1, '1 Sekunde'],
    [16, '16 Sekunden'],
    [60, '1 Minute'],
    [61, '2 Minuten'],
    [900, '15 Minuten'],
  ])('%i s → %s', (seconds, text) => {
    expect(formatWait(seconds)).toBe(text);
  });
});

describe('loginErrorMessage', () => {
  it('uses the server message for invalid credentials', () => {
    expect(
      loginErrorMessage(new ApiError(401, 'invalid_credentials', 'Username oder Passwort ist falsch.')),
    ).toBe('Username oder Passwort ist falsch.');
  });

  it('never exposes unknown error details', () => {
    expect(loginErrorMessage(new Error('TypeError at line 3'))).not.toContain('line 3');
  });
});
