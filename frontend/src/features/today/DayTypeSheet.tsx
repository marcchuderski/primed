import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchDayTypes, updateDay, type Day, type DayType, type Settings } from '../../api/days.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { TimeWheel } from '../../components/Wheel/TimeWheel.tsx';
import { formatInt } from '../../domain/format.ts';
import styles from './DayTypeSheet.module.css';

const DURATIONS = [30, 60, 90, 120] as const;
const LATEST_TRAINING_MIN = 23 * 60 + 45;
const FALLBACK_TRAINING_START = 18 * 60;

const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'UTC' });

/** Screen 08: day type, training time wheel and duration for one day; the week template stays unchanged. */
export function DayTypeSheet({
  open,
  day,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  day: Day;
  settings: Settings;
  onClose: () => void;
  onSaved: (day: Day) => void;
}) {
  const subtitle = `${weekday.format(new Date(`${day.date}T12:00:00Z`))} · ${
    day.source === 'manual' ? 'manuell gewählt' : 'aus Wochenvorlage'
  }`;
  return (
    <DayTypePickerSheet
      open={open}
      title="Tagesart"
      subtitle={subtitle}
      initial={day}
      settings={settings}
      onClose={onClose}
      onSubmit={async (dayTypeId, trainingStart, durationMin) => {
        onSaved(await updateDay(day.date, dayTypeId, trainingStart, durationMin));
      }}
    />
  );
}

export interface DayTypeChoice {
  dayTypeId: number | null;
  isTraining: boolean;
  trainingStart: number | null;
  durationMin: number | null;
}

/** Day type list plus training time and duration; used for a day (screen 08) and the week template. */
export function DayTypePickerSheet({
  open,
  title,
  subtitle,
  initial,
  settings,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  initial: DayTypeChoice;
  settings: Settings;
  onClose: () => void;
  onSubmit: (dayTypeId: number, trainingStart: number | null, durationMin: number | null) => Promise<void>;
}) {
  const [types, setTypes] = useState<DayType[] | null>(null);
  const [typeId, setTypeId] = useState(initial.dayTypeId);
  // With a training day selected, the list collapses so the training time is in view (D-107).
  const [expanded, setExpanded] = useState(!initial.isTraining);
  const [start, setStart] = useState(initial.trainingStart ?? FALLBACK_TRAINING_START);
  const [duration, setDuration] = useState(initial.durationMin ?? settings.defaultDurationMin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    fetchDayTypes()
      .then((list) => {
        if (!cancelled) {
          setTypes(list);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Tagesarten konnten nicht geladen werden.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selected = types?.find((t) => t.id === typeId) ?? null;
  const earliest = settings.earliestTrainingMin;

  async function save() {
    if (selected === null) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(
        selected.id,
        selected.isTraining ? Math.max(earliest, start) : null,
        selected.isTraining ? duration : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} title={title} subtitle={subtitle} onClose={onClose}>
      <div className={styles['list']} role="group" aria-label="Tagesart wählen">
        {(types ?? [])
          .filter((type) => expanded || type.id === typeId)
          .map((type) => {
            const active = type.id === typeId;
            return (
              <button
                key={type.id}
                type="button"
                className={styles['option']}
                aria-pressed={active}
                onClick={() => {
                  setTypeId(type.id);
                  setExpanded(!type.isTraining);
                }}
              >
                <span className={styles['texts']}>
                  <span className={styles['name']}>{type.name}</span>
                  <span className={styles['meta']}>
                    {formatInt(type.kcal)} kcal · {formatInt(type.carbs)} g KH
                  </span>
                </span>
                {active ? (
                  <span className={styles['check']} aria-hidden="true">
                    <Check size={14} strokeWidth={3} />
                  </span>
                ) : (
                  <span className={styles['radio']} aria-hidden="true" />
                )}
              </button>
            );
          })}
        {!expanded && (
          <button
            type="button"
            className={styles['change']}
            aria-expanded={false}
            onClick={() => {
              setExpanded(true);
            }}
          >
            Auswahl ändern
            <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
      </div>

      {selected?.isTraining === true && (
        <div className={styles['training']}>
          <div className={styles['group']}>
            <span className={styles['groupLabel']} id="training-time-label">
              Training um
            </span>
            <TimeWheel
              value={Math.max(earliest, start)}
              onChange={setStart}
              minMinutes={earliest}
              maxMinutes={LATEST_TRAINING_MIN}
              label="Training um"
            />
          </div>
          <div className={styles['group']}>
            <span className={styles['groupLabel']}>Dauer</span>
            <div className={styles['chips']} role="group" aria-label="Dauer">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={styles['chip']}
                  aria-pressed={d === duration}
                  onClick={() => {
                    setDuration(d);
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
      <div className={styles['spacer']} />
      <Button size="large" block busy={busy} disabled={selected === null} onClick={() => void save()}>
        Übernehmen
      </Button>
    </Sheet>
  );
}
