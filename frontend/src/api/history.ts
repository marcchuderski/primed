import type { HistoryDay } from '../domain/history.ts';
import { ApiError, apiRequest, isRecord } from './client.ts';

const invalid = () => new ApiError(200, 'invalid_response', 'Unerwartete Antwort vom Server.');

function rec(v: unknown): Record<string, unknown> {
  if (!isRecord(v)) {
    throw invalid();
  }
  return v;
}

function num(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw invalid();
  }
  return v;
}

function parseDay(v: unknown): HistoryDay {
  const d = rec(v);
  const t = rec(d['targets']);
  const e = rec(d['eaten']);
  if (typeof d['date'] !== 'string' || typeof d['dayTypeName'] !== 'string') {
    throw invalid();
  }
  return {
    date: d['date'],
    isToday: d['isToday'] === true,
    dayTypeName: d['dayTypeName'],
    isTraining: d['isTraining'] === true,
    targets: {
      kcal: num(t['kcal']),
      protein: num(t['protein']),
      carbs: num(t['carbs']),
      sugar: num(t['sugar']),
    },
    eaten: {
      kcal: num(e['kcal']),
      protein: num(e['protein']),
      carbs: num(e['carbs']),
      fat: num(e['fat']),
      sugar: num(e['sugar']),
    },
    entryCount: num(d['entryCount']),
    statsExcluded: d['statsExcluded'] === true,
  };
}

export interface History {
  today: string;
  days: HistoryDay[];
}

/** Days from `from` to `to` (inclusive, at most 366), limited by the server to account start … today. */
export async function fetchHistory(from: string, to: string): Promise<History> {
  const q = new URLSearchParams({ from, to }).toString();
  const data = rec(await apiRequest('GET', `/history?${q}`));
  const list = data['days'];
  if (typeof data['today'] !== 'string' || !Array.isArray(list)) {
    throw invalid();
  }
  return { today: data['today'], days: list.map(parseDay) };
}
