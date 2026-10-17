import { useState, type SubmitEvent } from 'react';
import { changePassword, type User } from '../../api/auth.ts';
import { Button } from '../../components/Button/Button.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { TextField } from '../../components/TextField/TextField.tsx';
import { useAuth } from '../auth/useAuth.ts';
import { SettingsPage } from './SettingsPage.tsx';
import styles from './Settings.module.css';

const MIN_PASSWORD = 12;

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Profile: display name, username, password, account deletion (BRIEFING §12, D-082). */
export function ProfilePage({ user, onBack }: { user: User; onBack: () => void }) {
  const { updateProfile, deleteAccount } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const profileChanged = displayName.trim() !== user.displayName || username.trim() !== user.username;

  async function saveProfile(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      await updateProfile(displayName.trim(), username.trim());
      setProfileMsg({ ok: true, text: 'Profil gespeichert.' });
    } catch (e) {
      setProfileMsg({ ok: false, text: message(e, 'Profil konnte nicht gespeichert werden.') });
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwMsg(null);
    if (next.length < MIN_PASSWORD) {
      setPwMsg({ ok: false, text: `Das neue Passwort braucht mindestens ${String(MIN_PASSWORD)} Zeichen.` });
      return;
    }
    if (next !== repeat) {
      setPwMsg({ ok: false, text: 'Die beiden neuen Passwörter stimmen nicht überein.' });
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setRepeat('');
      setPwMsg({ ok: true, text: 'Passwort geändert. Andere Geräte sind jetzt abgemeldet.' });
    } catch (e) {
      setPwMsg({ ok: false, text: message(e, 'Passwort konnte nicht geändert werden.') });
    } finally {
      setPwBusy(false);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
    } catch (e) {
      setConfirmOpen(false);
      setDeleteBusy(false);
      setDeleteError(message(e, 'Konto konnte nicht gelöscht werden.'));
    }
  }

  return (
    <SettingsPage title="Profil" onBack={onBack}>
      <form className={styles['form']} onSubmit={(e) => void saveProfile(e)} noValidate>
        <TextField
          label="Display-Name"
          value={displayName}
          maxLength={64}
          autoComplete="nickname"
          onChange={(e) => {
            setDisplayName(e.target.value);
          }}
        />
        <TextField
          label="Username"
          hint="3–32 Zeichen: a–z, 0–9, Punkt, Bindestrich, Unterstrich. Damit meldest du dich an."
          value={username}
          maxLength={32}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        {profileMsg !== null && (
          <p
            className={profileMsg.ok ? styles['hint'] : styles['error']}
            role={profileMsg.ok ? 'status' : 'alert'}
          >
            {profileMsg.text}
          </p>
        )}
        <Button
          type="submit"
          block
          busy={profileBusy}
          disabled={!profileChanged || displayName.trim() === ''}
        >
          Profil speichern
        </Button>
      </form>

      <form className={styles['form']} onSubmit={(e) => void savePassword(e)} noValidate>
        <h2 className={styles['sectionLabel']}>Passwort ändern</h2>
        <TextField
          label="Aktuelles Passwort"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
          }}
        />
        <TextField
          label="Neues Passwort"
          type="password"
          autoComplete="new-password"
          hint={`Mindestens ${String(MIN_PASSWORD)} Zeichen.`}
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
          }}
        />
        <TextField
          label="Neues Passwort wiederholen"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => {
            setRepeat(e.target.value);
          }}
        />
        {pwMsg !== null && (
          <p className={pwMsg.ok ? styles['hint'] : styles['error']} role={pwMsg.ok ? 'status' : 'alert'}>
            {pwMsg.text}
          </p>
        )}
        <Button type="submit" variant="tonal" block busy={pwBusy} disabled={current === '' || next === ''}>
          Passwort ändern
        </Button>
      </form>

      <section className={styles['section']}>
        <h2 className={styles['sectionLabel']}>Konto</h2>
        <Button
          variant="tonal"
          block
          onClick={() => {
            setDeletePassword('');
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        >
          Konto löschen
        </Button>
      </section>

      <Sheet
        open={deleteOpen}
        title="Konto löschen"
        onClose={() => {
          setDeleteOpen(false);
        }}
      >
        <form
          className={styles['form']}
          onSubmit={(e) => {
            e.preventDefault();
            if (deletePassword !== '') {
              setConfirmOpen(true);
            }
          }}
          noValidate
        >
          <p className={styles['hint']}>
            Dein Konto und alle deine Daten (Einträge, Bibliothek, Gerichte, Einstellungen) werden endgültig
            gelöscht. Gib zur Bestätigung dein Passwort ein.
          </p>
          <TextField
            label="Passwort"
            type="password"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
            }}
          />
          {deleteError !== null && (
            <p className={styles['error']} role="alert">
              {deleteError}
            </p>
          )}
          <Button type="submit" block disabled={deletePassword === ''}>
            Weiter
          </Button>
        </form>
        <ConfirmDialog
          open={confirmOpen}
          title="Konto endgültig löschen?"
          text="Alle deine Daten werden gelöscht. Das lässt sich nicht rückgängig machen."
          confirmLabel="Endgültig löschen"
          busy={deleteBusy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            setConfirmOpen(false);
          }}
        />
      </Sheet>
    </SettingsPage>
  );
}
