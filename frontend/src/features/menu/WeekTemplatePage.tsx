import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchDayTypes,
  fetchWeekTemplate,
  updateWeekTemplate,
  type DayType,
  type Settings,
  type TemplateDay,
} from '../../api/days.ts';
import { Loading, SkeletonRows } from '../../components/Skeleton/Skeleton.tsx';
import { formatClock } from '../../domain/time.ts';
import { DayTypePickerSheet } from '../today/DayTypeSheet.tsx';
import { WEEKDAYS_LONG } from './menuSummaries.ts';
import { SettingsPage } from './SettingsPage.tsx';
import styles from './Settings.module.css';

/** Week template: one day type (+ training time and duration) per weekday (BRIEFING §3). */
export function WeekTemplatePage({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [template, setTemplate] = useState<TemplateDay[] | null>(null);
  const [types, setTypes] = useState<DayType[]>([]);
  const [editing, setEditing] = useState<TemplateDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchWeekTemplate(), fetchDayTypes()])
      .then(([t, list]) => {
        setTemplate([...t].sort((a, b) => a.weekday - b.weekday));
        setTypes(list);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Wochenvorlage konnte nicht geladen werden.');
      });
  }, []);

  function describe(day: TemplateDay): string {
    const type = types.find((t) => t.id === day.dayTypeId);
    if (type === undefined) {
      return '–';
    }
    if (!type.isTraining || day.trainingStart === null) {
      return type.name;
    }
    return `${type.name} · ${formatClock(day.trainingStart)} · ${String(day.durationMin ?? 0)} min`;
  }

  return (
    <SettingsPage title="Wochenvorlage" onBack={onBack} error={error}>
      <p className={styles['hint']}>
        Legt fest, welche Tagesart ein Wochentag automatisch bekommt. Änderungen gelten ab heute; einzelne
        Tage änderst du unter „Heute“.
      </p>
      {template === null && error === null && (
        <Loading>
          <SkeletonRows count={7} variant="card" />
        </Loading>
      )}
      <div className={styles['card']}>
        {template?.map((day) => (
          <button
            key={day.weekday}
            type="button"
            className={styles['link']}
            aria-haspopup="dialog"
            onClick={() => {
              setEditing(day);
            }}
          >
            <span className={styles['linkTexts']}>
              <span className={styles['linkName']}>{WEEKDAYS_LONG[day.weekday - 1]}</span>
              <span className={styles['linkMeta']}>{describe(day)}</span>
            </span>
            <ChevronRight size={20} strokeWidth={2.2} className={styles['chevron']} aria-hidden="true" />
          </button>
        ))}
      </div>

      {editing !== null && template !== null && (
        <DayTypePickerSheet
          open
          title={WEEKDAYS_LONG[editing.weekday - 1] ?? 'Wochentag'}
          subtitle="Wochenvorlage · gilt ab heute"
          initial={{
            ...editing,
            isTraining: types.find((t) => t.id === editing.dayTypeId)?.isTraining ?? false,
          }}
          settings={settings}
          onClose={() => {
            setEditing(null);
          }}
          onSubmit={async (dayTypeId, trainingStart, durationMin) => {
            const next = template.map((d) =>
              d.weekday === editing.weekday ? { ...d, dayTypeId, trainingStart, durationMin } : d,
            );
            const saved = await updateWeekTemplate(next);
            setTemplate([...saved].sort((a, b) => a.weekday - b.weekday));
            setEditing(null);
          }}
        />
      )}
    </SettingsPage>
  );
}
