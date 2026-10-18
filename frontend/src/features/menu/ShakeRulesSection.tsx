import type { Thresholds } from '../../api/days.ts';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { formatInt } from '../../domain/format.ts';
import { formatClock } from '../../domain/time.ts';
import { SettingRow } from './SettingsPage.tsx';
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
    label: 'Reichhaltigere Flüssigkeit',
    hint: 'z.\u00a0B. Milch 3,5\u00a0% statt Wasser, ab kcal offen',
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

/** Shake thresholds for the suggestions (BRIEFING §10), shown inside the shakes page. */
export function ShakeRulesSection({
  values,
  onChange,
}: {
  values: Thresholds;
  onChange: (next: Thresholds) => void;
}) {
  return (
    <section className={styles['section']} aria-labelledby="shake-rules">
      <h2 id="shake-rules" className={styles['sectionLabel']}>
        Vorschläge
      </h2>
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
                onChange({ ...values, [f.key]: v });
              }}
            />
          </SettingRow>
        ))}
      </div>
      <p className={styles['hint']}>
        Wann der Zauberstab einen Shake vorschlägt und welchen. Protein hat immer Vorrang.
      </p>
    </section>
  );
}
