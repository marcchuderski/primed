import { useState } from 'react';
import { updateSettings, type Settings } from '../../api/days.ts';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { SettingRow, SettingsPage } from './SettingsPage.tsx';
import { useAutoSave } from './useAutoSave.ts';
import styles from './Settings.module.css';

/** Tolerance for the history rating (BRIEFING §11, D-044). */
export function RatingPage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [tolerance, setTolerance] = useState(settings.tolerancePct);
  const saver = useAutoSave(async (tolerancePct: number) => {
    await updateSettings({ tolerancePct });
  });

  return (
    <SettingsPage title="Bewertung" onBack={onBack} status={saver.status} error={saver.error}>
      <p className={styles['hint']}>
        Im Verlauf gilt ein Tag als „im Rahmen“, wenn die Kalorien höchstens so weit vom Soll abweichen.
      </p>
      <div className={styles['card']}>
        <SettingRow label="Toleranz" hint="Abweichung vom kcal-Soll">
          <Stepper
            label="Toleranz"
            value={tolerance}
            min={1}
            max={15}
            step={1}
            format={(v) => `±${String(v)}`}
            unit="%"
            onChange={(v) => {
              setTolerance(v);
              saver.schedule(v);
            }}
          />
        </SettingRow>
      </div>
    </SettingsPage>
  );
}
