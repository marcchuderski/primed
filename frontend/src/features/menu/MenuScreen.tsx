import { useState } from 'react';
import { Button } from '../../components/Button/Button.tsx';
import { useAuth } from '../auth/useAuth.ts';
import styles from './MenuScreen.module.css';

/** Placeholder menu until roadmap 7.1: logout and "Überall abmelden" (D-064). */
export function MenuScreen({ onClose }: { onClose: () => void }) {
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
    <div className={styles['screen']}>
      <h1 className={styles['title']}>Menü</h1>
      <p className={styles['lead']}>Einstellungen folgen in Phase 7.</p>
      {error !== null && <p role="alert">{error}</p>}
      <div className={styles['actions']}>
        <Button variant="tonal" block onClick={onClose}>
          Zurück
        </Button>
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
      </div>
    </div>
  );
}
