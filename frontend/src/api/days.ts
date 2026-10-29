import { ApiError, apiRequest, isRecord } from './client.ts';
import type { Targets } from '../domain/types.ts';

export interface Day {
  date: string;
  isToday: boolean;
  /** Entries and day type may be changed (today and 7 days back, D-176); older days are read only. */
  editable: boolean;
  dayTypeId: number | null;
  dayTypeName: string;
  isTraining: boolean;
  trainingStart: number | null;
  durationMin: number | null;
  source: 'template' | 'manual';
  targets: Targets;
  /** Left out of the history statistics (D-180). */
  statsExcluded: boolean;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  proteinDefault: number;
  defaultDurationMin: number;
  earliestTrainingMin: number;
  checkpoint: { offsetMin: number; pct: number; earliestMin: number };
  dayBoundaryMin: number;
  /** Foods used by the quick shakes (never suggested on their own). */
  shakeFoods: { proteinPowder: number | null };
  /** Protein powder per shake in grams; sizes are fixed at 400/200 ml (D-139). */
  shakePowderG: number;
  /** Liquids the shakes are offered with (at least one). */
  shakeLiquids: ShakeLiquids;
  /** Rating tolerance in percent (history, D-044). */
  tolerancePct: number;
  thresholds: Thresholds;
  /** Shakes and shake rules switched on (Einstellungen › Shakes). */
  shakesEnabled: boolean;
}

/** Suggestion thresholds (BRIEFING §10), editable under "Vorschläge". */
export interface Thresholds {
  minProteinGap: number;
  bigShakeProtein: number;
  bigShakeKcal: number;
  lightMealKcal: number;
  /** Logical minute from which a rest-day shake is suggested. */
  restShakeFrom: number;
  richMilkKcal: number;
  overKcalProtein: number;
}

export const DEFAULT_SETTINGS_THRESHOLDS: Thresholds = {
  minProteinGap: 25,
  bigShakeProtein: 35,
  bigShakeKcal: 500,
  lightMealKcal: 700,
  restShakeFrom: 19 * 60,
  richMilkKcal: 400,
  overKcalProtein: 30,
};

export interface ShakeLiquids {
  milkLow: boolean;
  milkHigh: boolean;
  water: boolean;
}

/** Partial update for PATCH /settings (D-123). */
export interface SettingsPatch {
  theme?: Settings['theme'];
  proteinDefault?: number;
  earliestTrainingMin?: number;
  checkpoint?: Settings['checkpoint'];
  tolerancePct?: number;
  shakesEnabled?: boolean;
  thresholds?: Partial<Thresholds>;
  shake?: Partial<{
    proteinPowderFoodId: number | null;
    powderG: number;
    liquids: Partial<ShakeLiquids>;
  }>;
}

export interface TemplateDay {
  /** ISO weekday, 1 = Monday. */
  weekday: number;
  dayTypeId: number;
  trainingStart: number | null;
  durationMin: number | null;
}

export interface DayTypeDraft {
  name: string;
  kcal: number;
  protein: number | null;
  carbs: number;
  sugarRef: number;
  isTraining: boolean;
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
  /** The fixed rest day type (D-106). */
  isRest: boolean;
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
    editable: d['editable'] === undefined ? true : bool(d['editable']),
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
    statsExcluded: d['statsExcluded'] === undefined ? false : bool(d['statsExcluded']),
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
    shakeFoods: parseShakeFoods(s['shakeFoods']),
    shakePowderG: s['shakePowderG'] === undefined ? 30 : num(s['shakePowderG']),
    shakeLiquids: parseShakeLiquids(s['shakeLiquids']),
    tolerancePct: s['tolerancePct'] === undefined ? 5 : num(s['tolerancePct']),
    thresholds: parseThresholds(s['thresholds']),
    shakesEnabled: s['shakesEnabled'] !== false,
  };
}

function parseShakeLiquids(value: unknown): ShakeLiquids {
  if (!isRecord(value)) {
    return { milkLow: true, milkHigh: true, water: true };
  }
  return { milkLow: bool(value['milkLow']), milkHigh: bool(value['milkHigh']), water: bool(value['water']) };
}

function parseThresholds(value: unknown): Thresholds {
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS_THRESHOLDS };
  }
  const result = { ...DEFAULT_SETTINGS_THRESHOLDS };
  for (const key of Object.keys(result) as (keyof Thresholds)[]) {
    result[key] = num(value[key]);
  }
  return result;
}

function parseShakeFoods(value: unknown): Settings['shakeFoods'] {
  return { proteinPowder: isRecord(value) ? nullableNum(value['proteinPowder'] ?? null) : null };
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
    isRest: bool(t['isRest']),
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

/** Leaves the day out of the history statistics or counts it again (D-180); edit window only. */
export async function setStatsExcluded(date: string, excluded: boolean): Promise<Day> {
  const data = await apiRequest('PUT', `/days/${encodeURIComponent(date)}/stats`, { excluded });
  return parseDay(record(data)['day']);
}

export async function fetchSettings(): Promise<Settings> {
  return parseSettings(record(await apiRequest('GET', '/settings'))['settings']);
}

export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  return parseSettings(record(await apiRequest('PATCH', '/settings', patch))['settings']);
}

export async function createDayType(draft: DayTypeDraft): Promise<DayType> {
  return parseDayType(record(await apiRequest('POST', '/day-types', draft))['dayType']);
}

export async function updateDayType(id: number, draft: DayTypeDraft): Promise<DayType> {
  return parseDayType(record(await apiRequest('PATCH', `/day-types/${String(id)}`, draft))['dayType']);
}

export async function deleteDayType(id: number): Promise<void> {
  await apiRequest('DELETE', `/day-types/${String(id)}`);
}

function parseTemplate(value: unknown): TemplateDay[] {
  const list = record(value)['days'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map((item) => {
    const d = record(item);
    return {
      weekday: num(d['weekday']),
      dayTypeId: num(d['dayTypeId']),
      trainingStart: nullableNum(d['trainingStart']),
      durationMin: nullableNum(d['durationMin']),
    };
  });
}

export async function fetchWeekTemplate(): Promise<TemplateDay[]> {
  return parseTemplate(await apiRequest('GET', '/week-template'));
}

export async function updateWeekTemplate(days: TemplateDay[]): Promise<TemplateDay[]> {
  return parseTemplate(await apiRequest('PUT', '/week-template', { days }));
}

export async function fetchDayTypes(): Promise<DayType[]> {
  const list = record(await apiRequest('GET', '/day-types'))['dayTypes'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map(parseDayType);
}
