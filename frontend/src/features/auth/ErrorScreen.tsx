import { Button } from '../../components/Button/Button.tsx';
import { LogoMark } from '../../components/Logo/Logo.tsx';
import styles from './StatusScreen.module.css';

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className={styles['screen']}>
      <LogoMark size={72} />
      <p role="alert">{message}</p>
      <Button variant="tonal" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </main>
  );
}
