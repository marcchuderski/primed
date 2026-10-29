import { useState } from 'react';
import {
  createDayType,
  deleteDayType,
  updateDayType,
  type DayType,
  type DayTypeDraft,
} from '../../api/days.ts';
import { Button } from '../../components/Button/Button.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { Stepper } from '../../components/Stepper/Stepper.tsx';
import { TextField } from '../../components/TextField/TextField.tsx';
import { formatInt } from '../../domain/format.ts';
import { SettingRow } from './SettingsPage.tsx';
import styles from './Settings.module.css';

const EMPTY: DayTypeDraft = {
  name: '',
  kcal: 2400,
  protein: null,
  carbs: 250,
  sugarRef: 50,
  isTraining: true,
};

/** Create or edit a day type. The rest day keeps its name and kind (D-106). */
export function DayTypeEditSheet({
  type,
  proteinDefault,
  onClose,
  onSaved,
}: {
  /** null = new day type. */
  type: DayType | null;
  proteinDefault: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<DayTypeDraft>(
    type === null
      ? EMPTY
      : {
          name: type.name,
          kcal: type.kcal,
          protein: type.protein,
          carbs: type.carbs,
          sugarRef: type.sugarRef,
          isTraining: type.isTraining,
        },
  );
  // Swiping the sheet away asks first once something was changed (D-185).
  const [initialDraft] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = type?.isRest === true;
  const set = (patch: Partial<DayTypeDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const save = () =>
    run(() =>
      type === null
        ? createDayType({ ...draft, name: draft.name.trim() })
        : updateDayType(type.id, { ...draft, name: draft.name.trim() }),
    );

  return (
    <Sheet
      open
      title={type === null ? 'Neue Tagesart' : type.name}
      subtitle={locked ? 'Fest im System · nur Sollwerte änderbar' : undefined}
      onClose={onClose}
      tone="bg"
      dirty={JSON.stringify(draft) !== JSON.stringify(initialDraft)}
    >
      <div className={styles['form']}>
        {!locked && (
          <TextField
            label="Name"
            value={draft.name}
            maxLength={40}
            onChange={(e) => {
              set({ name: e.target.value });
            }}
          />
        )}
        <div className={styles['card']}>
          {!locked && (
            <SettingRow label="Art">
              <span className={styles['toggle']} role="group" aria-label="Art">
                <button
                  type="button"
                  aria-pressed={draft.isTraining}
                  onClick={() => {
                    set({ isTraining: true });
                  }}
                >
                  Training
                </button>
                <button
                  type="button"
                  aria-pressed={!draft.isTraining}
                  onClick={() => {
                    set({ isTraining: false });
                  }}
                >
                  Ruhe
                </button>
              </span>
            </SettingRow>
          )}
          <SettingRow label="Kalorien">
            <Stepper
              label="Kalorien"
              value={draft.kcal}
              min={800}
              max={6000}
              step={50}
              format={formatInt}
              unit="kcal"
              onChange={(kcal) => {
                set({ kcal });
              }}
            />
          </SettingRow>
          <SettingRow
            label="Protein"
            accent
            hint={draft.protein === null ? `Standard (${String(proteinDefault)} g)` : 'eigener Wert'}
          >
            {draft.protein === null ? (
              <Button
                variant="tonal"
                onClick={() => {
                  set({ protein: proteinDefault });
                }}
              >
                Abweichen
              </Button>
            ) : (
              <Stepper
                label="Protein"
                value={draft.protein}
                min={0}
                max={400}
                step={5}
                unit="g"
                onChange={(protein) => {
                  set({ protein });
                }}
              />
            )}
          </SettingRow>
          {draft.protein !== null && (
            <SettingRow label="Protein-Standard verwenden">
              <Button
                variant="tonal"
                onClick={() => {
                  set({ protein: null });
                }}
              >
                Zurücksetzen
              </Button>
            </SettingRow>
          )}
          <SettingRow label="Kohlenhydrate">
            <Stepper
              label="Kohlenhydrate"
              value={draft.carbs}
              min={0}
              max={1000}
              step={5}
              unit="g"
              onChange={(carbs) => {
                set({ carbs });
              }}
            />
          </SettingRow>
          <SettingRow label="Zucker" hint="Richtwert, höchstens">
            <Stepper
              label="Zucker"
              value={draft.sugarRef}
              min={0}
              max={300}
              step={5}
              unit="g"
              onChange={(sugarRef) => {
                set({ sugarRef });
              }}
            />
          </SettingRow>
        </div>
        <p className={styles['hint']}>Änderungen gelten ab heute; vergangene Tage behalten ihre Sollwerte.</p>
        {error !== null && (
          <p className={styles['error']} role="alert">
            {error}
          </p>
        )}
        <Button block busy={busy} disabled={draft.name.trim() === ''} onClick={() => void save()}>
          {type === null ? 'Tagesart anlegen' : 'Speichern'}
        </Button>
        {type !== null && !locked && (
          <Button
            variant="tonal"
            block
            disabled={busy}
            onClick={() => {
              setConfirmDelete(true);
            }}
          >
            Tagesart löschen
          </Button>
        )}
      </div>
      {type !== null && (
        <ConfirmDialog
          open={confirmDelete}
          title="Tagesart löschen?"
          text={`„${type.name}“ verschwindet aus der Auswahl. Vergangene Tage behalten Name und Sollwerte.`}
          confirmLabel="Löschen"
          busy={busy}
          onConfirm={() => void run(() => deleteDayType(type.id))}
          onCancel={() => {
            setConfirmDelete(false);
          }}
        />
      )}
    </Sheet>
  );
}
