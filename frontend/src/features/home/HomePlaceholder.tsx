import { useState } from 'react';
import type { User } from '../../api/auth.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Footer } from '../../components/Footer/Footer.tsx';
import { useAuth } from '../auth/useAuth.ts';
import styles from './HomePlaceholder.module.css';

/** Temporary home until the Heute screen (Phase 2) exists. */
export function HomePlaceholder({ user }: { user: User }) {
  const { logout, logoutEverywhere } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Es ist ein Fehler aufgetreten.');
      setBusy(false);
    }
  }

  return (
    <main className={styles['screen']}>
      <h1 className={styles['title']}>Hey, {user.displayName}.</h1>
      <p className={styles['lead']}>Der Heute-Screen folgt in Phase 2.</p>
      {error !== null && <p role="alert">{error}</p>}
      <div className={styles['actions']}>
        <Button variant="tonal" block busy={busy} onClick={() => void run(logout)}>
          Abmelden
        </Button>
        <button
          type="button"
          className={styles['link']}
          disabled={busy}
          onClick={() => void run(logoutEverywhere)}
        >
          Überall abmelden
        </button>
        <Footer />
      </div>
    </main>
  );
}
