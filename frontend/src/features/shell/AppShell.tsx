import { useState } from 'react';
import type { User } from '../../api/auth.ts';
import { TopNav, type Tab } from '../../components/TopNav/TopNav.tsx';
import { EssenScreen } from '../essen/EssenScreen.tsx';
import { MenuScreen } from '../menu/MenuScreen.tsx';
import { TodayScreen } from '../today/TodayScreen.tsx';
import styles from './AppShell.module.css';

/** Logged-in app: text tabs on top (D-024), "Heute" first. */
export function AppShell({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('heute');
  const [menuOpen, setMenuOpen] = useState(false);

  if (menuOpen) {
    return (
      <main className={styles['shell']}>
        <MenuScreen
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
