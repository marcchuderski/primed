import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../../api/auth.ts';
import { forgetTheme } from '../menu/theme.ts';
import { AuthContext, type AuthState } from './useAuth.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    authApi
      .fetchCurrentUser()
      .then((user) => {
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
  }, [attempt]);

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

  const updateProfile = useCallback(async (displayName: string, username: string) => {
    const user = await authApi.updateProfile(displayName, username);
    setState({ status: 'authenticated', user });
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await authApi.deleteAccount(password);
    forgetTheme();
    setState({ status: 'anonymous' });
  }, []);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ state, login, logout, logoutEverywhere, updateProfile, deleteAccount, retry }),
    [state, login, logout, logoutEverywhere, updateProfile, deleteAccount, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
