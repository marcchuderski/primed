import { useState, type SubmitEvent } from 'react';
import { Button } from '../../components/Button/Button.tsx';
import { LogoMark, Wordmark } from '../../components/Logo/Logo.tsx';
import { TextField } from '../../components/TextField/TextField.tsx';
import { useAuth } from './useAuth.ts';
import { loginErrorMessage } from './loginErrors.ts';
import styles from './LoginScreen.module.css';

/** Screen 02. No "Passwort vergessen?" link (D-063). */
export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (e) {
      setError(loginErrorMessage(e));
      setPassword('');
      setBusy(false);
    }
  }

  return (
    <main className={styles['screen']}>
      <div className={styles['brand']}>
        <LogoMark size={40} />
        <Wordmark size={28} />
      </div>

      <div className={styles['intro']}>
        <h1 className={styles['title']}>Willkommen zurück.</h1>
        <p className={styles['lead']}>Melde dich an und mach da weiter, wo du aufgehört hast.</p>
      </div>

      <form className={styles['form']} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={64}
          required
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        <TextField
          label="Passwort"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={1024}
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        {error !== null && (
          <p className={styles['error']} role="alert">
            {error}
          </p>
        )}
        <div className={styles['spacer']} />
        <Button type="submit" size="large" block busy={busy} disabled={username === '' || password === ''}>
          Einloggen
        </Button>
      </form>
    </main>
  );
}
