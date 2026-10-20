import { formatDate } from '../../domain/dates.ts';
import { RELEASES } from './changelog.ts';
import { SettingsPage } from './SettingsPage.tsx';
import styles from './Settings.module.css';

/** What changed per version (D-169). */
export function ChangelogPage({ onBack }: { onBack: () => void }) {
  return (
    <SettingsPage title="Changelog" onBack={onBack}>
      {RELEASES.map((release) => (
        <section
          key={release.version}
          className={styles['section']}
          aria-label={`Version ${release.version}`}
        >
          <h2 className={styles['sectionLabel']}>
            Version {release.version} · {formatDate(release.date)}
          </h2>
          <ul className={`${styles['card'] ?? ''} ${styles['changes'] ?? ''}`}>
            {release.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      ))}
    </SettingsPage>
  );
}
