import { ApiError } from '../../api/client.ts';

/** User-facing text for a failed login (Du-Form, no hint whether the username exists). */
export function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.';
  }
  if (error.code === 'too_many_attempts' && error.retryAfter !== null) {
    return `Zu viele Versuche. Bitte warte ${formatWait(error.retryAfter)} und versuche es dann erneut.`;
  }
  return error.message;
}

export function formatWait(seconds: number): string {
  if (seconds < 60) {
    const s = Math.max(1, Math.ceil(seconds));
    return s === 1 ? '1 Sekunde' : `${String(s)} Sekunden`;
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? '1 Minute' : `${String(minutes)} Minuten`;
}
