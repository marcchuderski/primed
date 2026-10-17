import { ApiError, apiRequest, isRecord } from './client.ts';
import type { Basis, Unit } from '../domain/units.ts';

export interface EntryNutrients {
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
}

export interface Entry {
  id: number;
  date: string;
  /** Wall clock minutes since midnight. */
  timeMin: number;
  kind: 'food' | 'dish' | 'shake';
  foodId: number | null;
  dishId: number | null;
  name: string;
  amount: number;
  unit: Unit | 'portion';
  quantity: number;
  nutrients: EntryNutrients;
  /** Current basis and package size of the food (null if unknown). */
  basis: Basis | null;
  packageAmount: number | null;
}

const UNITS = ['g', 'ml', 'el', 'tl', 'packung', 'stueck', 'portion'] as const;
const BASES = ['per_100g', 'per_100ml', 'per_unit'] as const;
const KINDS = ['food', 'dish', 'shake'] as const;
const invalid = () => new ApiError(200, 'invalid_response', 'Unerwartete Antwort vom Server.');

function n(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalid();
  }
  return value;
}

function parseEntry(value: unknown): Entry {
  if (!isRecord(value) || !isRecord(value['nutrients'])) {
    throw invalid();
  }
  const unit = UNITS.find((u) => u === value['unit']);
  const { date, name, foodId, dishId } = value;
  if (unit === undefined || typeof date !== 'string' || typeof name !== 'string') {
    throw invalid();
  }
  const nu = value['nutrients'];
  const basis = BASES.find((b) => b === value['basis']) ?? null;
  const pkg = value['packageAmount'];
  return {
    id: n(value['id']),
    date,
    timeMin: n(value['timeMin']),
    kind: KINDS.find((k) => k === value['kind']) ?? 'food',
    foodId: foodId === null ? null : n(foodId),
    dishId: dishId === null ? null : n(dishId),
    name,
    amount: n(value['amount']),
    unit,
    quantity: n(value['quantity']),
    nutrients: {
      kcal: n(nu['kcal']),
      protein: n(nu['protein']),
      carbs: n(nu['carbs']),
      sugar: n(nu['sugar']),
      fat: n(nu['fat']),
    },
    basis,
    packageAmount: pkg === null || pkg === undefined ? null : n(pkg),
  };
}

function entryOf(data: unknown): Entry {
  if (!isRecord(data)) {
    throw invalid();
  }
  return parseEntry(data['entry']);
}

export async function fetchEntries(date: string): Promise<Entry[]> {
  const data = await apiRequest('GET', `/days/${encodeURIComponent(date)}/entries`);
  if (!isRecord(data) || !Array.isArray(data['entries'])) {
    throw invalid();
  }
  return data['entries'].map(parseEntry);
}

export async function createEntry(input: {
  date: string;
  timeMin: number;
  foodId: number;
  amount: number;
  unit: Unit;
}): Promise<Entry> {
  return entryOf(await apiRequest('POST', '/entries', input));
}

export async function updateEntry(
  id: number,
  changes: { timeMin?: number; amount?: number; unit?: Unit },
): Promise<Entry> {
  return entryOf(await apiRequest('PATCH', `/entries/${String(id)}`, changes));
}

export async function deleteEntry(id: number): Promise<void> {
  await apiRequest('DELETE', `/entries/${String(id)}`);
}

export type ShakeId = 'big' | 'small_low' | 'small_high';

export interface Shake {
  id: ShakeId;
  name: string;
  label: string;
  nutrients: EntryNutrients;
}

const SHAKE_IDS = ['big', 'small_low', 'small_high'] as const;

export async function fetchShakes(): Promise<Shake[]> {
  const data = await apiRequest('GET', '/shakes');
  if (!isRecord(data) || !Array.isArray(data['shakes'])) {
    throw invalid();
  }
  return data['shakes'].map((value): Shake => {
    if (!isRecord(value) || !isRecord(value['nutrients'])) {
      throw invalid();
    }
    const id = SHAKE_IDS.find((s) => s === value['id']);
    const { name, label } = value;
    if (id === undefined || typeof name !== 'string' || typeof label !== 'string') {
      throw invalid();
    }
    const nu = value['nutrients'];
    return {
      id,
      name,
      label,
      nutrients: {
        kcal: n(nu['kcal']),
        protein: n(nu['protein']),
        carbs: n(nu['carbs']),
        sugar: n(nu['sugar']),
        fat: n(nu['fat']),
      },
    };
  });
}

export async function createShakeEntry(input: {
  date: string;
  timeMin: number;
  shake: ShakeId;
}): Promise<Entry> {
  return entryOf(await apiRequest('POST', '/entries/shake', input));
}
