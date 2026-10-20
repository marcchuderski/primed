import { ApiError, apiRequest, isRecord } from './client.ts';
import type { EntryNutrients } from './entries.ts';
import { isValidBarcode } from '../domain/barcode.ts';
import type { Category } from '../domain/categories.ts';
import type { Basis, Unit } from '../domain/units.ts';

export type FoodType = 'product' | 'reference' | 'ingredient';

export interface Food {
  id: number;
  type: FoodType;
  name: string;
  brand: string | null;
  barcode: string | null;
  category: Category;
  basis: Basis;
  nutrients: EntryNutrients;
  packageAmount: number | null;
  /** g or ml of one piece on a g/ml basis: enables the unit Stück (D-170). */
  pieceWeight: number | null;
  usageCount: number;
  lastAmount: number | null;
  lastUnit: Unit | null;
}

/** A shared reference value (D-170), not yet in the library; picking it adopts a copy. */
export interface ReferenceFood {
  id: number;
  name: string;
  category: Category;
  basis: Basis;
  nutrients: EntryNutrients;
  pieceWeight: number | null;
}

/** A product from Open Food Facts, not yet in the library. */
export interface OffProduct {
  barcode: string;
  name: string;
  brand: string | null;
  category: Category;
  basis: Basis;
  nutrients: EntryNutrients;
  packageAmount: number | null;
  /** One serving in g or ml (the basis unit), if Open Food Facts knows it. */
  servingAmount: number | null;
}

export interface FoodDraft {
  type: FoodType;
  name: string;
  brand: string | null;
  barcode: string | null;
  category: Category;
  basis: Basis;
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  packageAmount: number | null;
  source?: 'manual' | 'off';
}

const CATEGORIES = [
  'snacks',
  'dairy',
  'bread',
  'produce',
  'drinks',
  'basics',
  'sauces',
  'supplements',
  'meals',
] as const;
const BASES = ['per_100g', 'per_100ml', 'per_unit'] as const;
const TYPES = ['product', 'reference', 'ingredient'] as const;
const UNITS = ['g', 'ml', 'el', 'tl', 'packung', 'stueck'] as const;

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

function optNum(v: unknown): number | null {
  return v === null || v === undefined ? null : num(v);
}

function str(v: unknown): string {
  if (typeof v !== 'string') {
    throw invalid();
  }
  return v;
}

function optStr(v: unknown): string | null {
  return v === null || v === undefined ? null : str(v);
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

export function parseFood(v: unknown): Food {
  const f = rec(v);
  return {
    id: num(f['id']),
    type: oneOf(TYPES, f['type']),
    name: str(f['name']),
    brand: optStr(f['brand']),
    barcode: optStr(f['barcode']),
    category: oneOf(CATEGORIES, f['category']),
    basis: oneOf(BASES, f['basis']),
    nutrients: nutrients(f['nutrients']),
    packageAmount: optNum(f['packageAmount']),
    pieceWeight: optNum(f['pieceWeight']),
    usageCount: num(f['usageCount']),
    lastAmount: optNum(f['lastAmount']),
    lastUnit: f['lastUnit'] === null ? null : oneOf(UNITS, f['lastUnit']),
  };
}

export function parseOffProduct(v: unknown): OffProduct {
  const p = rec(v);
  return {
    barcode: str(p['barcode']),
    name: str(p['name']),
    brand: optStr(p['brand']),
    category: oneOf(CATEGORIES, p['category']),
    basis: oneOf(BASES, p['basis']),
    nutrients: nutrients(p['nutrients']),
    packageAmount: optNum(p['packageAmount']),
    servingAmount: p['servingAmount'] === undefined ? null : optNum(p['servingAmount']),
  };
}

function foodList(data: unknown): Food[] {
  const list = rec(data)['foods'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map(parseFood);
}

export async function searchFoods(params: {
  q?: string;
  category?: Category | null;
  type?: FoodType | null;
  mealPrep?: boolean;
}): Promise<Food[]> {
  const query = new URLSearchParams();
  if (params.q !== undefined && params.q.trim() !== '') {
    query.set('q', params.q.trim());
  }
  if (params.category) {
    query.set('category', params.category);
  }
  if (params.type) {
    query.set('type', params.type);
  }
  if (params.mealPrep === true) {
    query.set('context', 'mealprep');
  }
  const qs = query.toString();
  return foodList(await apiRequest('GET', `/foods${qs === '' ? '' : `?${qs}`}`));
}

export async function fetchFrequentFoods(): Promise<Food[]> {
  return foodList(await apiRequest('GET', '/foods/frequent'));
}

export type BarcodeResult = { source: 'library'; food: Food } | { source: 'off'; product: OffProduct } | null;

/** Own library first, then Open Food Facts; null if unknown. */
export async function lookupBarcode(ean: string): Promise<BarcodeResult> {
  try {
    const data = rec(await apiRequest('GET', `/foods/barcode/${encodeURIComponent(ean)}`));
    return data['source'] === 'library'
      ? { source: 'library', food: parseFood(data['food']) }
      : { source: 'off', product: parseOffProduct(data['product']) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function searchOnline(q: string): Promise<OffProduct[]> {
  const list = rec(await apiRequest('GET', `/off/search?q=${encodeURIComponent(q.trim())}`))['products'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map(parseOffProduct);
}

function parseReference(v: unknown): ReferenceFood {
  const r = rec(v);
  return {
    id: num(r['id']),
    name: str(r['name']),
    category: oneOf(CATEGORIES, r['category']),
    basis: oneOf(BASES, r['basis']),
    nutrients: nutrients(r['nutrients']),
    pieceWeight: optNum(r['pieceWeight']),
  };
}

/** Shared reference values matching the query that are not in the library yet (D-170). */
export async function searchReferences(q: string): Promise<ReferenceFood[]> {
  const list = rec(await apiRequest('GET', `/references?q=${encodeURIComponent(q.trim())}`))['references'];
  if (!Array.isArray(list)) {
    throw invalid();
  }
  return list.map(parseReference);
}

/** The user's copy of a reference value (created on first use). */
export async function adoptReference(id: number): Promise<Food> {
  return parseFood(rec(await apiRequest('POST', `/references/${String(id)}/adopt`))['food']);
}

export async function fetchFood(id: number): Promise<Food> {
  return parseFood(rec(await apiRequest('GET', `/foods/${String(id)}`))['food']);
}

export async function createFood(draft: FoodDraft): Promise<Food> {
  return parseFood(rec(await apiRequest('POST', '/foods', draft))['food']);
}

export async function updateFood(id: number, draft: FoodDraft): Promise<Food> {
  return parseFood(rec(await apiRequest('PATCH', `/foods/${String(id)}`, draft))['food']);
}

export async function deleteFood(id: number): Promise<void> {
  await apiRequest('DELETE', `/foods/${String(id)}`);
}

export function draftFromOff(product: OffProduct, category: Category = product.category): FoodDraft {
  return {
    type: 'product',
    name: product.name,
    brand: product.brand,
    // Open Food Facts also lists store-internal codes (e.g. loose fruit) whose check digit fails;
    // the server rejects those, so such a hit is saved without a barcode.
    barcode: isValidBarcode(product.barcode) ? product.barcode : null,
    category,
    basis: product.basis,
    ...product.nutrients,
    packageAmount: product.packageAmount,
    source: 'off',
  };
}
