import { AuthProvider } from './features/auth/AuthContext.tsx';
import { useAuth } from './features/auth/useAuth.ts';
import { ErrorScreen } from './features/auth/ErrorScreen.tsx';
import { StartupScreen } from './features/auth/StartupScreen.tsx';
import { LoginScreen } from './features/auth/LoginScreen.tsx';
import { AppShell } from './features/shell/AppShell.tsx';
import styles from './App.module.css';

function Screens() {
  const { state, retry } = useAuth();

  // Keyed wrapper: every screen change replays the short crossfade (DESIGN.md §8).
  let screen;
  switch (state.status) {
    case 'loading':
      screen = <StartupScreen />;
      break;
    case 'error':
      screen = <ErrorScreen message={state.message} onRetry={retry} />;
      break;
    case 'anonymous':
      screen = <LoginScreen />;
      break;
    case 'authenticated':
      screen = <AppShell user={state.user} />;
      break;
  }

  return (
    <div key={state.status} className={styles['fade']}>
      {screen}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Screens />
    </AuthProvider>
  );
}
