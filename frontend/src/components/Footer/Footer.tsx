import { Wordmark } from '../Logo/Logo.tsx';
import styles from './Footer.module.css';

/** Muted footer at the end of scrollable main screens: small logo and version (DESIGN.md §6). */
export function Footer() {
  return (
    <footer className={styles['footer']}>
      <Wordmark size={18} />
      <span className="num">v{__APP_VERSION__} · Bereit für heute.</span>
    </footer>
  );
}
