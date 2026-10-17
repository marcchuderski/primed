import { ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { User } from '../../api/auth.ts';
import {
  fetchDayTypes,
  fetchSettings,
  fetchWeekTemplate,
  updateSettings,
  type DayType,
  type Settings,
  type TemplateDay,
} from '../../api/days.ts';
import { Button } from '../../components/Button/Button.tsx';
import { useAuth } from '../auth/useAuth.ts';
import { CheckpointsPage } from './CheckpointsPage.tsx';
import { DayTypesPage } from './DayTypesPage.tsx';
import { checkpointSummary, shakesSummary, weekSummary } from './menuSummaries.ts';
import { ProfilePage } from './ProfilePage.tsx';
import { RatingPage } from './RatingPage.tsx';
import { ShakesPage } from './ShakesPage.tsx';
import { SuggestionRulesPage } from './SuggestionRulesPage.tsx';
import { applyTheme } from './theme.ts';
import { WeekTemplatePage } from './WeekTemplatePage.tsx';
import styles from './MenuScreen.module.css';
import common from './Settings.module.css';

type Page = 'profile' | 'dayTypes' | 'week' | 'shakes' | 'checkpoints' | 'suggestions' | 'rating';

const THEMES: { id: Settings['theme']; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
];

interface Data {
  settings: Settings;
  types: DayType[];
  template: TemplateDay[];
}

/** Screen 16: profile, appearance, settings list, logout (BRIEFING §12). */
export function MenuScreen({ user, onClose }: { user: User; onClose: () => void }) {
  const { logout, logoutEverywhere } = useAuth();
  const [page, setPage] = useState<Page | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([fetchSettings(), fetchDayTypes(), fetchWeekTemplate()])
      .then(([settings, types, template]) => {
        setData({ settings, types, template });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Einstellungen konnten nicht geladen werden.');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  function chooseTheme(theme: Settings['theme']) {
    if (data === null || data.settings.theme === theme) {
      return;
    }
    const previous = data.settings.theme;
    applyTheme(theme);
    setData({ ...data, settings: { ...data.settings, theme } });
    updateSettings({ theme }).catch((e: unknown) => {
      applyTheme(previous);
      setData((d) => (d === null ? d : { ...d, settings: { ...d.settings, theme: previous } }));
      setError(e instanceof Error ? e.message : 'Darstellung konnte nicht gespeichert werden.');
    });
  }

  const back = () => {
    setPage(null);
    load();
  };

  if (page !== null && data !== null) {
    const props = { settings: data.settings, onBack: back };
    switch (page) {
      case 'profile':
        return <ProfilePage user={user} onBack={back} />;
      case 'dayTypes':
        return <DayTypesPage {...props} />;
      case 'week':
        return <WeekTemplatePage {...props} />;
      case 'shakes':
        return <ShakesPage {...props} />;
      case 'checkpoints':
        return <CheckpointsPage {...props} />;
      case 'suggestions':
        return <SuggestionRulesPage {...props} />;
      case 'rating':
        return <RatingPage {...props} />;
    }
  }

  const items: { id: Page; name: string; meta: string }[] =
    data === null
      ? []
      : [
          {
            id: 'dayTypes',
            name: 'Tagesarten & Sollwerte',
            meta: `${String(data.types.length)} Tagesarten · kcal, Protein, KH`,
          },
          { id: 'week', name: 'Wochenvorlage', meta: weekSummary(data.template, data.types) },
          { id: 'shakes', name: 'Shakes', meta: shakesSummary(data.settings) },
          { id: 'checkpoints', name: 'Checkpoints', meta: checkpointSummary(data.settings) },
          { id: 'suggestions', name: 'Vorschläge', meta: 'Shake-Schwellen' },
          {
            id: 'rating',
            name: 'Bewertung',
            meta: `Toleranz ±${String(data.settings.tolerancePct)} % im Verlauf`,
          },
        ];

  return (
    <div className={styles['screen']}>
      <div className={styles['head']}>
        <h1 className={styles['title']}>Menü</h1>
        <button type="button" className={common['close']} aria-label="Menü schließen" onClick={onClose}>
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className={styles['profile']}
        onClick={() => {
          setPage('profile');
        }}
        disabled={data === null}
      >
        <span className={styles['avatar']} aria-hidden="true">
          {(user.displayName.at(0) ?? '?').toUpperCase()}
        </span>
        <span className={styles['profileTexts']}>
          <span className={styles['profileName']}>{user.displayName}</span>
          <span className={styles['profileMeta']}>@{user.username} · Profil bearbeiten</span>
        </span>
        <ChevronRight size={20} strokeWidth={2.2} className={common['chevron']} aria-hidden="true" />
      </button>

      <section className={common['section']} aria-labelledby="menu-theme">
        <h2 id="menu-theme" className={common['sectionLabel']}>
          Darstellung
        </h2>
        <div className={styles['segment']} role="group" aria-label="Darstellung">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={data?.settings.theme === t.id}
              disabled={data === null}
              onClick={() => {
                chooseTheme(t.id);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className={common['hint']}>System folgt der Einstellung deines Geräts.</p>
      </section>

      <section className={common['section']} aria-labelledby="menu-settings">
        <h2 id="menu-settings" className={common['sectionLabel']}>
          Einstellungen
        </h2>
        <div className={common['card']}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={common['link']}
              onClick={() => {
                setPage(item.id);
              }}
            >
              <span className={common['linkTexts']}>
                <span className={common['linkName']}>{item.name}</span>
                <span className={common['linkMeta']}>{item.meta}</span>
              </span>
              <ChevronRight size={20} strokeWidth={2.2} className={common['chevron']} aria-hidden="true" />
            </button>
          ))}
          {data === null && error === null && <p className={styles['loading']}>Lädt …</p>}
        </div>
      </section>

      {error !== null && (
        <p className={common['error']} role="alert">
          {error}
        </p>
      )}

      <div className={styles['actions']}>
        <Button variant="tonal" block busy={busy} onClick={() => void run(logout)}>
          Abmelden
        </Button>
        <button
          type="button"
          className={styles['textLink']}
          disabled={busy}
          onClick={() => void run(logoutEverywhere)}
        >
          Überall abmelden
        </button>
      </div>
    </div>
  );
}
