import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../../api/auth.ts';
import { AuthContext, type AuthState } from './useAuth.ts';

/** Loading animation length (D-065); it always plays once unless reduced motion is requested. */
export const LOADING_MIN_MS = 1400;

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({
  children,
  minLoadingMs = LOADING_MIN_MS,
}: {
  children: ReactNode;
  minLoadingMs?: number;
}) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const minimum = prefersReducedMotion() ? 0 : minLoadingMs;

    Promise.all([authApi.fetchCurrentUser(), wait(minimum)])
      .then(([user]) => {
        if (!cancelled) {
          setState(user === null ? { status: 'anonymous' } : { status: 'authenticated', user });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Es ist ein Fehler aufgetreten.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, minLoadingMs]);

  const login = useCallback(async (username: string, password: string) => {
    const user = await authApi.login(username, password);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({ status: 'anonymous' });
  }, []);

  const logoutEverywhere = useCallback(async () => {
    await authApi.logoutEverywhere();
    setState({ status: 'anonymous' });
  }, []);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ state, login, logout, logoutEverywhere, retry }),
    [state, login, logout, logoutEverywhere, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
