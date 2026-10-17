import { LogoLockup } from '../../components/Logo/Logo.tsx';
import styles from './LoadingScreen.module.css';

/** Screen 01: the ring fills to ¾ once, "rimed" fades in (D-065, lockup per screen 18). */
export function LoadingScreen() {
  return (
    <main className={styles['screen']} aria-busy="true" aria-label="Primed lädt">
      <LogoLockup size={64} animated />
      <p className={styles['tagline']}>Bereit für heute.</p>
    </main>
  );
}
