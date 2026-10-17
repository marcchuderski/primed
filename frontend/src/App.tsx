import { AuthProvider } from './features/auth/AuthContext.tsx';
import { useAuth } from './features/auth/useAuth.ts';
import { ErrorScreen } from './features/auth/ErrorScreen.tsx';
import { LoadingScreen } from './features/auth/LoadingScreen.tsx';
import { LoginScreen } from './features/auth/LoginScreen.tsx';
import { HomePlaceholder } from './features/home/HomePlaceholder.tsx';
import styles from './App.module.css';

function Screens() {
  const { state, retry } = useAuth();

  // Keyed wrapper: every screen change replays the short crossfade (DESIGN.md §8).
  let screen;
  switch (state.status) {
    case 'loading':
      screen = <LoadingScreen />;
      break;
    case 'error':
      screen = <ErrorScreen message={state.message} onRetry={retry} />;
      break;
    case 'anonymous':
      screen = <LoginScreen />;
      break;
    case 'authenticated':
      screen = <HomePlaceholder user={state.user} />;
      break;
  }

  return (
    <div key={state.status} className={styles['fade']}>
      {screen}
    </div>
  );
}

export function App({ minLoadingMs }: { minLoadingMs?: number }) {
  return (
    <AuthProvider {...(minLoadingMs === undefined ? {} : { minLoadingMs })}>
      <Screens />
    </AuthProvider>
  );
}
