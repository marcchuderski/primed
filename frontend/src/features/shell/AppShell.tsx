import { useEffect, useState } from 'react';
import type { User } from '../../api/auth.ts';
import { fetchSettings } from '../../api/days.ts';
import { TopNav, type Tab } from '../../components/TopNav/TopNav.tsx';
import { EssenScreen } from '../essen/EssenScreen.tsx';
import { MenuScreen } from '../menu/MenuScreen.tsx';
import { applyTheme } from '../menu/theme.ts';
import { TodayScreen } from '../today/TodayScreen.tsx';
import styles from './AppShell.module.css';

/** Logged-in app: text tabs on top (D-024), "Heute" first. */
export function AppShell({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('heute');
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply the saved theme after login; flash-free start follows in 7.2.
  useEffect(() => {
    fetchSettings()
      .then((s) => {
        applyTheme(s.theme);
      })
      .catch(() => undefined);
  }, [user.id]);

  if (menuOpen) {
    return (
      <main className={styles['shell']}>
        <MenuScreen
          user={user}
          onClose={() => {
            setMenuOpen(false);
          }}
        />
      </main>
    );
  }

  return (
    <main className={styles['shell']}>
      <TopNav
        active={tab}
        onSelect={setTab}
        onMenu={() => {
          setMenuOpen(true);
        }}
      />
      <div key={tab} className={styles['panel']}>
        {tab === 'heute' && <TodayScreen displayName={user.displayName} />}
        {tab === 'essen' && <EssenScreen />}
        {tab === 'verlauf' && <p className={styles['placeholder']}>Verlauf folgt in Phase 6.</p>}
      </div>
    </main>
  );
}
