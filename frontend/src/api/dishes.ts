import { ApiError, apiRequest, isRecord } from './client.ts';
import type { Entry, EntryNutrients } from './entries.ts';
import { parseEntryResponse } from './entries.ts';
import type { FoodType } from './foods.ts';
import type { Basis, Unit } from '../domain/units.ts';

export interface DishIngredient {
  foodId: number | null;
  name: string;
  foodType: FoodType;
  amount: number;
  unit: Exclude<Unit, 'portion'>;
  quantity: number;
  basis: Basis | null;
  nutrients: EntryNutrients;
}

export interface Dish {
  id: number;
  name: string;
  cookedOn: string;
  portionsTotal: number;
  portionsLeft: number;
  status: 'active' | 'archived' | 'discarded';
  totals: EntryNutrients;
  perPortion: EntryNutrients;
  basedOnDishId: number | null;
  ingredients: DishIngredient[];
}

export interface DishDraft {
  name: string;
  portions: number;
  ingredients: { foodId: number; amount: number; unit: Exclude<Unit, 'portion'> }[];
  basedOnDishId?: number | null;
}

const invalid = () => new ApiError(200, 'invalid_response', 'Unerwartete Antwort vom Server.');
const UNITS = ['g', 'ml', 'el', 'tl', 'packung', 'stueck'] as const;
const BASES = ['per_100g', 'per_100ml', 'per_unit'] as const;
const TYPES = ['product', 'reference', 'ingredient'] as const;
const STATUSES = ['active', 'archived', 'discarded'] as const;

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

function oneOf<T extends string>(list: readonly T[], v: unknown): T {
  const found = list.find((x) => x === v);
  if (found === undefined) {
    throw invalid();
  }
  return found;
}

function nutrients(v: unknown): EntryNutrients {
  const n = rec(v);
  return {
    kcal: num(n['kcal']),
    protein: num(n['protein']),
    carbs: num(n['carbs']),
    sugar: num(n['sugar']),
    fat: num(n['fat']),
  };
}

function parseDish(v: unknown): Dish {
  const d = rec(v);
  const ingredients = d['ingredients'];
  if (!Array.isArray(ingredients) || typeof d['name'] !== 'string' || typeof d['cookedOn'] !== 'string') {
    throw invalid();
  }
  return {
    id: num(d['id']),
    name: d['name'],
    cookedOn: d['cookedOn'],
    portionsTotal: num(d['portionsTotal']),
    portionsLeft: num(d['portionsLeft']),
    status: oneOf(STATUSES, d['status']),
    totals: nutrients(d['totals']),
    perPortion: nutrients(d['perPortion']),
    basedOnDishId: d['basedOnDishId'] === null ? null : num(d['basedOnDishId']),
    ingredients: ingredients.map((value): DishIngredient => {
      const i = rec(value);
      if (typeof i['name'] !== 'string') {
        throw invalid();
      }
      return {
        foodId: i['foodId'] === null ? null : num(i['foodId']),
        name: i['name'],
        foodType: oneOf(TYPES, i['foodType']),
        amount: num(i['amount']),
        unit: oneOf(UNITS, i['unit']),
        quantity: num(i['quantity']),
        basis: i['basis'] === null ? null : oneOf(BASES, i['basis']),
        nutrients: nutrients(i['nutrients']),
      };
    }),
  };
}

export async function fetchDishes(status: 'active' | 'archived'): Promise<Dish[]> {
  const list = rec(await apiRequest('GET', `/dishes?status=${status}`))['dishes'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map(parseDish);
}

export async function fetchDish(id: number): Promise<Dish> {
  return parseDish(rec(await apiRequest('GET', `/dishes/${String(id)}`))['dish']);
}

export async function createDish(draft: DishDraft): Promise<Dish> {
  return parseDish(rec(await apiRequest('POST', '/dishes', draft))['dish']);
}

export async function updateDish(id: number, draft: DishDraft): Promise<Dish> {
  return parseDish(rec(await apiRequest('PUT', `/dishes/${String(id)}`, draft))['dish']);
}

export async function discardDish(id: number): Promise<Dish> {
  return parseDish(rec(await apiRequest('POST', `/dishes/${String(id)}/discard`))['dish']);
}

export async function logDishPortion(input: {
  date: string;
  timeMin: number;
  dishId: number;
  portions: number;
}): Promise<Entry> {
  return parseEntryResponse(await apiRequest('POST', '/entries/dish', input));
}
