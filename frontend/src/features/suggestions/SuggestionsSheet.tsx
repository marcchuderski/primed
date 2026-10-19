import { useEffect, useState } from 'react';
import type { Day, Settings } from '../../api/days.ts';
import { fetchDishes, logDishPortion } from '../../api/dishes.ts';
import { createEntry, createShakeEntry, fetchShakes, type Entry } from '../../api/entries.ts';
import { searchFoods } from '../../api/foods.ts';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { Bone, Loading } from '../../components/Skeleton/Skeleton.tsx';
import type { Checkpoint } from '../../domain/checkpoint.ts';
import { formatRemaining } from '../../domain/format.ts';
import {
  formatEffect,
  suggest,
  type Candidate,
  type ShakeOption,
  type Suggestion,
} from '../../domain/suggestions.ts';
import { formatClock, MINUTES_PER_DAY } from '../../domain/time.ts';
import type { Macros } from '../../domain/types.ts';
import type { Unit } from '../../domain/units.ts';
import { buildCandidates } from './candidates.ts';
import { thresholdsFromSettings } from './thresholds.ts';
import styles from './SuggestionsSheet.module.css';

interface Data {
  shakes: ShakeOption[];
  candidates: Candidate[];
}

async function loadData(settings: Settings): Promise<Data> {
  const [shakes, foods, dishes] = await Promise.all([
    settings.shakesEnabled ? fetchShakes() : Promise.resolve([]),
    searchFoods({}),
    fetchDishes('active'),
  ]);
  // The protein powder is only kept out while shakes are on (it is part of the shakes then, D-122/D-139).
  const powder = settings.shakeFoods.proteinPowder;
  const excluded = settings.shakesEnabled && powder !== null ? [powder] : [];
  return {
    shakes: shakes.map((s) => ({
      id: s.id,
      size: s.size,
      liquid: s.liquid,
      name: s.name,
      nutrients: s.nutrients,
    })),
    candidates: buildCandidates(foods, dishes, excluded),
  };
}

/** Screen 09 "Vorschläge" (Zauberstab): rule based, no AI (D-001, D-013). */
export function SuggestionsSheet({
  day,
  settings,
  now,
  checkpoint,
  eaten,
  eatenUntilCheckpoint,
  onClose,
  onAdded,
}: {
  day: Day;
  settings: Settings;
  /** Logical minute. */
  now: number;
  checkpoint: Checkpoint | null;
  eaten: Macros;
  eatenUntilCheckpoint: Macros | null;
  onClose: () => void;
  onAdded: (entry: Entry) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadData(settings)
      .then((d) => {
        if (!cancelled) {
          setData(d);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Vorschläge konnten nicht geladen werden.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  const suggestions =
    data === null
      ? []
      : suggest({
          now,
          day,
          checkpoint,
          targets: day.targets,
          eaten,
          eatenUntilCheckpoint,
          shakes: data.shakes,
          candidates: data.candidates,
          thresholds: thresholdsFromSettings(settings),
          shakesEnabled: settings.shakesEnabled,
        });

  const wall = now % MINUTES_PER_DAY;
  const subtitle =
    day.isTraining && day.trainingStart !== null && now < day.trainingStart
      ? `${formatClock(wall)} · noch ${formatRemaining(day.trainingStart - now)} bis Training`
      : `${formatClock(wall)} · ${day.dayTypeName}`;

  async function log(s: Suggestion) {
    setBusy(s.key);
    setError(null);
    const timeMin = (Math.ceil(s.at / 15) * 15) % MINUTES_PER_DAY;
    try {
      const a = s.action;
      const entry =
        a.kind === 'shake'
          ? await createShakeEntry({ date: day.date, timeMin, shake: a.shake })
          : a.kind === 'dish'
            ? await logDishPortion({ date: day.date, timeMin, dishId: a.dishId, portions: a.portions })
            : await createEntry({
                date: day.date,
                timeMin,
                foodId: a.foodId,
                amount: a.amount,
                unit: a.unit as Unit,
              });
      setDone((list) => [...list, s.key]);
      onAdded(entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eintragen fehlgeschlagen.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet open title="Vorschläge" subtitle={subtitle} onClose={onClose} tone="bg" fullHeight>
      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
      {data === null && error === null && (
        <Loading className={styles['list']}>
          <Bone height={104} radius="card" />
          <Bone height={104} radius="card" />
          <Bone height={104} radius="card" />
        </Loading>
      )}
      {data !== null && suggestions.length === 0 && (
        <p className={styles['empty']}>Gerade passt nichts Sinnvolles – du liegst gut im Plan.</p>
      )}
      <ul className={styles['list']}>
        {suggestions.map((s) => (
          <li key={s.key} className={styles['card']}>
            <span className={styles['top']}>
              <span className={styles['when']}>{s.when}</span>
              <span className={styles['effect']}>{formatEffect(s.nutrients)}</span>
            </span>
            <span className={styles['title']}>{s.title}</span>
            <span className={styles['reason']}>{s.reason}</span>
            {done.includes(s.key) ? (
              <span className={styles['done']} role="status">
                ✓ Eingetragen
              </span>
            ) : (
              <Button variant="tonal" busy={busy === s.key} onClick={() => void log(s)}>
                Eintragen
                {s.at !== now ? ` · ${formatClock((Math.ceil(s.at / 15) * 15) % MINUTES_PER_DAY)}` : ''}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className={styles['note']}>
        Regelbasiert aus deinen Sollwerten, Shake-Regeln und deiner Bibliothek. Keine KI, keine Daten
        verlassen Primed.
      </p>
    </Sheet>
  );
}
