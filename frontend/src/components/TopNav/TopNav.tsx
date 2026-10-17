import { Menu } from 'lucide-react';
import styles from './TopNav.module.css';

export type Tab = 'heute' | 'essen' | 'verlauf';

const TABS: { id: Tab; label: string }[] = [
  { id: 'heute', label: 'Heute' },
  { id: 'essen', label: 'Essen' },
  { id: 'verlauf', label: 'Verlauf' },
];

/** Text tabs at the top, menu on the right (DESIGN.md §6, no bottom navigation). */
export function TopNav({
  active,
  onSelect,
  onMenu,
}: {
  active: Tab;
  onSelect: (tab: Tab) => void;
  onMenu: () => void;
}) {
  return (
    <div className={styles['bar']}>
      <nav aria-label="Bereiche" className={styles['tabs']}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={styles['tab']}
            aria-current={tab.id === active ? 'page' : undefined}
            onClick={() => {
              onSelect(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <button type="button" className={styles['iconButton']} aria-label="Menü" onClick={onMenu}>
        <Menu size={20} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
