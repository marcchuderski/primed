import { useState } from 'react';
import { updateSettings, type Settings, type Thresholds } from '../../api/days.ts';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { formatInt } from '../../domain/format.ts';
import { formatClock } from '../../domain/time.ts';
import { SettingRow, SettingsPage } from './SettingsPage.tsx';
import { useAutoSave } from './useAutoSave.ts';
import styles from './Settings.module.css';

interface Field {
  key: keyof Thresholds;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
}

/** Ranges match the server (SettingsController::THRESHOLD_RANGES); steps are coarser for quick tapping. */
const FIELDS: Field[] = [
  {
    key: 'minProteinGap',
    label: 'Shake überhaupt',
    hint: 'ab so viel Protein offen',
    min: 10,
    max: 60,
    step: 5,
    unit: 'g',
  },
  {
    key: 'bigShakeProtein',
    label: 'Großer Shake',
    hint: 'ab so viel Protein offen',
    min: 20,
    max: 80,
    step: 5,
    unit: 'g',
  },
  {
    key: 'bigShakeKcal',
    label: 'Großer Shake',
    hint: 'und ab so vielen kcal offen',
    min: 200,
    max: 1500,
    step: 50,
    unit: 'kcal',
    format: formatInt,
  },
  {
    key: 'lightMealKcal',
    label: 'Leichte Mahlzeit + Shake',
    hint: 'nach dem Training ab kcal offen',
    min: 300,
    max: 2000,
    step: 50,
    unit: 'kcal',
    format: formatInt,
  },
  {
    key: 'richMilkKcal',
    label: 'Milch 3,5\u00a0% statt 1,5\u00a0%',
    hint: 'ab so vielen kcal offen',
    min: 100,
    max: 1000,
    step: 50,
    unit: 'kcal',
    format: formatInt,
  },
  {
    key: 'restShakeFrom',
    label: 'Abend-Shake an Ruhetagen',
    hint: 'ab dieser Uhrzeit',
    min: 960,
    max: 1380,
    step: 15,
    format: formatClock,
  },
  {
    key: 'overKcalProtein',
    label: 'Kalorien schon durch',
    hint: 'leichter Shake ab so viel Protein offen',
    min: 10,
    max: 80,
    step: 5,
    unit: 'g',
  },
];

/** Shake thresholds for the suggestions (BRIEFING §10). */
export function SuggestionRulesPage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [values, setValues] = useState(settings.thresholds);
  const saver = useAutoSave(async (value: Thresholds) => {
    await updateSettings({ thresholds: value });
  });

  return (
    <SettingsPage title="Vorschläge" onBack={onBack} status={saver.status} error={saver.error}>
      <p className={styles['hint']}>
        Wann der Zauberstab einen Shake vorschlägt und welchen. Protein hat immer Vorrang.
      </p>
      {!settings.shakesEnabled && (
        <p className={styles['hint']} role="note">
          Shakes sind ausgeschaltet. Diese Schwellen greifen erst wieder, wenn du Shakes einschaltest; bis
          dahin schlägt der Zauberstab nur Essen vor.
        </p>
      )}
      <div className={styles['card']}>
        {FIELDS.map((f) => (
          <SettingRow key={f.key} label={f.label} hint={f.hint}>
            <Stepper
              label={`${f.label}, ${f.hint}`}
              value={values[f.key]}
              min={f.min}
              max={f.max}
              step={f.step}
              {...(f.unit === undefined ? {} : { unit: f.unit })}
              {...(f.format === undefined ? {} : { format: f.format })}
              onChange={(v) => {
                const next = { ...values, [f.key]: v };
                setValues(next);
                saver.schedule(next);
              }}
            />
          </SettingRow>
        ))}
      </div>
    </SettingsPage>
  );
}
