import { LogoMark, Wordmark } from '../../components/Logo/Logo.tsx';
import styles from './LoadingScreen.module.css';

/** Screen 01: the ring fills to ¾ once, the wordmark fades in (D-065). */
export function LoadingScreen() {
  return (
    <main className={styles['screen']} aria-busy="true">
      <LogoMark size={120} animated label="Primed lädt" />
      <Wordmark size={44} className={styles['word']} />
      <p className={styles['tagline']}>Bereit für heute.</p>
    </main>
  );
}
