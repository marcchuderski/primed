import { useState } from 'react';
import { updateSettings, type Settings } from '../../api/days.ts';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { formatClock } from '../../domain/time.ts';
import { formatDuration } from './menuSummaries.ts';
import { SettingRow, SettingsPage } from './SettingsPage.tsx';
import { useAutoSave } from './useAutoSave.ts';
import styles from './Settings.module.css';

interface Draft {
  checkpoint: Settings['checkpoint'];
  earliestTrainingMin: number;
}

/** Pre-workout checkpoint rule and the earliest training start (BRIEFING §4/§5). */
export function CheckpointsPage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [draft, setDraft] = useState<Draft>({
    checkpoint: settings.checkpoint,
    earliestTrainingMin: settings.earliestTrainingMin,
  });
  const saver = useAutoSave(async (value: Draft) => {
    await updateSettings(value);
  });

  const change = (next: Draft) => {
    setDraft(next);
    saver.schedule(next);
  };
  const cp = draft.checkpoint;

  return (
    <SettingsPage title="Checkpoints" onBack={onBack} status={saver.status} error={saver.error}>
      <p className={styles['hint']}>
        An Trainingstagen zeigt „Heute“, wie viel du bis kurz vor dem Training gegessen haben solltest: bis{' '}
        {formatDuration(cp.offsetMin)} vor Trainingsbeginn {cp.pct} % der Kohlenhydrate.
      </p>
      <div className={styles['card']}>
        <SettingRow label="Zeitpunkt" hint="vor Trainingsbeginn">
          <Stepper
            label="Zeitpunkt"
            value={cp.offsetMin}
            min={60}
            max={300}
            step={15}
            format={formatDuration}
            onChange={(offsetMin) => {
              change({ ...draft, checkpoint: { ...cp, offsetMin } });
            }}
          />
        </SettingRow>
        <SettingRow label="Anteil" hint="der Kohlenhydrate bis dahin">
          <Stepper
            label="Anteil"
            value={cp.pct}
            min={50}
            max={95}
            step={5}
            unit="%"
            onChange={(pct) => {
              change({ ...draft, checkpoint: { ...cp, pct } });
            }}
          />
        </SettingRow>
        <SettingRow label="Frühester Checkpoint" hint="davor entfällt er">
          <Stepper
            label="Frühester Checkpoint"
            value={cp.earliestMin}
            min={240}
            max={600}
            step={15}
            format={formatClock}
            onChange={(earliestMin) => {
              change({ ...draft, checkpoint: { ...cp, earliestMin } });
            }}
          />
        </SettingRow>
      </div>
      <div className={styles['card']}>
        <SettingRow label="Frühester Trainingsbeginn">
          <Stepper
            label="Frühester Trainingsbeginn"
            value={draft.earliestTrainingMin}
            min={300}
            max={720}
            step={15}
            format={formatClock}
            onChange={(earliestTrainingMin) => {
              change({ ...draft, earliestTrainingMin });
            }}
          />
        </SettingRow>
      </div>
    </SettingsPage>
  );
}
