import { useEffect, useState } from 'react';
import type { User } from '../../api/auth.ts';
import { fetchSettings } from '../../api/days.ts';
import { TopNav, type Tab } from '../../components/TopNav/TopNav.tsx';
import { EssenScreen } from '../essen/EssenScreen.tsx';
import { HistoryScreen } from '../history/HistoryScreen.tsx';
import { MenuScreen } from '../menu/MenuScreen.tsx';
import { applyTheme } from '../menu/theme.ts';
import { TodayScreen } from '../today/TodayScreen.tsx';
import { useViewDay } from '../today/useViewDay.ts';
import styles from './AppShell.module.css';

/** Logged-in app: text tabs on top (D-024), "Heute" first. */
export function AppShell({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('heute');
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewDate, setViewDate] = useViewDay();

  // Apply the saved theme after login; also refreshes the local copy used for the flash-free start (7.2).
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
        onSelect={(next) => {
          // The "Heute" tab always means today (D-178).
          if (next === 'heute') {
            setViewDate(null);
          }
          setTab(next);
        }}
        onMenu={() => {
          setMenuOpen(true);
        }}
      />
      <div key={tab} className={styles['panel']}>
        {tab === 'heute' && (
          // A new day remounts the screen, so no open sheet keeps logging into the previous day.
          <TodayScreen
            key={viewDate ?? 'today'}
            displayName={user.displayName}
            date={viewDate}
            onDateChange={setViewDate}
          />
        )}
        {tab === 'essen' && <EssenScreen />}
        {tab === 'verlauf' && (
          <HistoryScreen
            onOpenDay={(date, isToday) => {
              setViewDate(isToday ? null : date);
              setTab('heute');
            }}
          />
        )}
      </div>
    </main>
  );
}
