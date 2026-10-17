import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Saves a draft shortly after the last change (steppers fire many quick changes). A pending save is
 * flushed when the page closes, so leaving right after a tap loses nothing.
 */
export function useAutoSave<T>(save: (value: T) => Promise<void>, delayMs = 500) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<{ value: T; timer: number } | null>(null);
  const saveRef = useRef(save);
  useLayoutEffect(() => {
    saveRef.current = save;
  });

  const run = useCallback((value: T) => {
    setStatus('saving');
    setError(null);
    saveRef
      .current(value)
      .then(() => {
        setStatus('saved');
      })
      .catch((e: unknown) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
      });
  }, []);

  const schedule = useCallback(
    (value: T) => {
      if (pending.current !== null) {
        window.clearTimeout(pending.current.timer);
      }
      const timer = window.setTimeout(() => {
        pending.current = null;
        run(value);
      }, delayMs);
      pending.current = { value, timer };
    },
    [delayMs, run],
  );

  useEffect(
    () => () => {
      const p = pending.current;
      if (p !== null) {
        window.clearTimeout(p.timer);
        pending.current = null;
        void saveRef.current(p.value).catch(() => undefined);
      }
    },
    [],
  );

  return { schedule, status, error };
}
