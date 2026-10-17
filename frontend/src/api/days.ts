import { ApiError, apiRequest, isRecord } from './client.ts';
import type { Targets } from '../domain/types.ts';

export interface Day {
  date: string;
  isToday: boolean;
  dayTypeId: number | null;
  dayTypeName: string;
  isTraining: boolean;
  trainingStart: number | null;
  durationMin: number | null;
  source: 'template' | 'manual';
  targets: Targets;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  proteinDefault: number;
  defaultDurationMin: number;
  earliestTrainingMin: number;
  checkpoint: { offsetMin: number; pct: number; earliestMin: number };
  dayBoundaryMin: number;
}

export interface DayType {
  id: number;
  name: string;
  kcal: number;
  protein: number | null;
  effectiveProtein: number;
  carbs: number;
  sugarRef: number;
  isTraining: boolean;
  sort: number;
}

const invalid = () => new ApiError(200, 'invalid_response', 'Unerwartete Antwort vom Server.');

function num(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalid();
  }
  return value;
}

function nullableNum(value: unknown): number | null {
  return value === null ? null : num(value);
}

function str(value: unknown): string {
  if (typeof value !== 'string') {
    throw invalid();
  }
  return value;
}

function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw invalid();
  }
  return value;
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw invalid();
  }
  return value;
}

export function parseDay(value: unknown): Day {
  const d = record(value);
  const t = record(d['targets']);
  const source = str(d['source']);
  if (source !== 'template' && source !== 'manual') {
    throw invalid();
  }
  return {
    date: str(d['date']),
    isToday: bool(d['isToday']),
    dayTypeId: nullableNum(d['dayTypeId']),
    dayTypeName: str(d['dayTypeName']),
    isTraining: bool(d['isTraining']),
    trainingStart: nullableNum(d['trainingStart']),
    durationMin: nullableNum(d['durationMin']),
    source,
    targets: {
      kcal: num(t['kcal']),
      protein: num(t['protein']),
      carbs: num(t['carbs']),
      sugar: num(t['sugar']),
    },
  };
}

export function parseSettings(value: unknown): Settings {
  const s = record(value);
  const c = record(s['checkpoint']);
  const theme = str(s['theme']);
  if (theme !== 'system' && theme !== 'light' && theme !== 'dark') {
    throw invalid();
  }
  return {
    theme,
    proteinDefault: num(s['proteinDefault']),
    defaultDurationMin: num(s['defaultDurationMin']),
    earliestTrainingMin: num(s['earliestTrainingMin']),
    checkpoint: { offsetMin: num(c['offsetMin']), pct: num(c['pct']), earliestMin: num(c['earliestMin']) },
    dayBoundaryMin: num(s['dayBoundaryMin']),
  };
}

export function parseDayType(value: unknown): DayType {
  const t = record(value);
  return {
    id: num(t['id']),
    name: str(t['name']),
    kcal: num(t['kcal']),
    protein: nullableNum(t['protein']),
    effectiveProtein: num(t['effectiveProtein']),
    carbs: num(t['carbs']),
    sugarRef: num(t['sugarRef']),
    isTraining: bool(t['isTraining']),
    sort: num(t['sort']),
  };
}

export async function fetchToday(): Promise<Day> {
  return parseDay(record(await apiRequest('GET', '/days/today'))['day']);
}

export async function fetchDay(date: string): Promise<Day> {
  return parseDay(record(await apiRequest('GET', `/days/${encodeURIComponent(date)}`))['day']);
}

export async function updateDay(
  date: string,
  dayTypeId: number,
  trainingStart: number | null,
  durationMin: number | null,
): Promise<Day> {
  const data = await apiRequest('PUT', `/days/${encodeURIComponent(date)}`, {
    dayTypeId,
    trainingStart,
    durationMin,
  });
  return parseDay(record(data)['day']);
}

export async function fetchSettings(): Promise<Settings> {
  return parseSettings(record(await apiRequest('GET', '/settings'))['settings']);
}

export async function fetchDayTypes(): Promise<DayType[]> {
  const list = record(await apiRequest('GET', '/day-types'))['dayTypes'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map(parseDayType);
}
