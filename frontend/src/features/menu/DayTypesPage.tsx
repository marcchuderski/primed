import { ChevronRight, CircleHelp, Dumbbell, Moon, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchDayTypes, updateSettings, type DayType, type Settings } from '../../api/days.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Loading, SkeletonRows } from '../../components/Skeleton/Skeleton.tsx';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { formatInt } from '../../domain/format.ts';
import { DayTypeEditSheet } from './DayTypeEditSheet.tsx';
import { GuidanceSheet } from './GuidanceSheet.tsx';
import { SettingRow, SettingsPage } from './SettingsPage.tsx';
import { useAutoSave } from './useAutoSave.ts';
import styles from './Settings.module.css';
import own from './DayTypesPage.module.css';

/** Screen 19: protein default, day types (tap = edit), "Neue Tagesart", help row (D-108). */
export function DayTypesPage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [protein, setProtein] = useState(settings.proteinDefault);
  const [types, setTypes] = useState<DayType[] | null>(null);
  const [editing, setEditing] = useState<DayType | 'new' | null>(null);
  const [guidance, setGuidance] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(() => {
    fetchDayTypes()
      .then(setTypes)
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : 'Tagesarten konnten nicht geladen werden.');
      });
  }, []);

  const saver = useAutoSave<number>(async (value) => {
    await updateSettings({ proteinDefault: value });
    // Effective protein of day types without their own value changes with the default.
    load();
  });

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SettingsPage
      title="Tagesarten & Sollwerte"
      onBack={onBack}
      status={saver.status}
      error={saver.error ?? loadError}
    >
      <div className={styles['card']}>
        <SettingRow label="Protein-Standard" hint="gilt für alle Tagesarten ohne eigenen Wert" accent>
          <Stepper
            label="Protein"
            value={protein}
            min={20}
            max={400}
            step={5}
            unit="g"
            onChange={(value) => {
              setProtein(value);
              saver.schedule(value);
            }}
          />
        </SettingRow>
      </div>

      <section className={styles['section']} aria-labelledby="day-types">
        <h2 id="day-types" className={styles['sectionLabel']}>
          Tagesarten{types === null ? '' : ` · ${String(types.length)}`}
        </h2>
        {types === null && loadError === null && (
          <Loading>
            <SkeletonRows count={5} variant="card" />
          </Loading>
        )}
        <div className={styles['card']}>
          {types?.map((type) => (
            <button
              key={type.id}
              type="button"
              className={styles['link']}
              onClick={() => {
                setEditing(type);
              }}
            >
              <span className={`${own['icon'] ?? ''} ${type.isTraining ? (own['training'] ?? '') : ''}`}>
                {type.isTraining ? (
                  <Dumbbell size={18} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Moon size={18} strokeWidth={2.2} aria-hidden="true" />
                )}
              </span>
              <span className={styles['linkTexts']}>
                <span className={styles['linkName']}>{type.name}</span>
                <span className={styles['linkMeta']}>
                  {formatInt(type.kcal)} kcal · {formatInt(type.effectiveProtein)} g P ·{' '}
                  {formatInt(type.carbs)} g KH
                </span>
              </span>
              <ChevronRight size={20} strokeWidth={2.2} className={styles['chevron']} aria-hidden="true" />
            </button>
          ))}
        </div>
        <Button
          variant="tonal"
          block
          onClick={() => {
            setEditing('new');
          }}
        >
          <Plus size={18} strokeWidth={2.2} aria-hidden="true" /> Neue Tagesart
        </Button>
      </section>

      <button
        type="button"
        className={`${styles['link'] ?? ''} ${own['help'] ?? ''}`}
        aria-haspopup="dialog"
        onClick={() => {
          setGuidance(true);
        }}
      >
        <span className={`${own['icon'] ?? ''} ${own['training'] ?? ''}`}>
          <CircleHelp size={18} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className={styles['linkTexts']}>
          <span className={styles['linkName']}>Hilfe beim Ermitteln deiner Richtwerte</span>
          <span className={styles['linkMeta']}>Mit einem Fragebogen für die KI deiner Wahl</span>
        </span>
        <ChevronRight size={20} strokeWidth={2.2} className={styles['chevron']} aria-hidden="true" />
      </button>

      {editing !== null && (
        <DayTypeEditSheet
          type={editing === 'new' ? null : editing}
          proteinDefault={protein}
          onClose={() => {
            setEditing(null);
          }}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      <GuidanceSheet
        open={guidance}
        onClose={() => {
          setGuidance(false);
        }}
      />
    </SettingsPage>
  );
}
