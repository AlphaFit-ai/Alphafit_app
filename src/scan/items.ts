import type { FoodScanDto } from '../../services/foodScanService';

/**
 * What the result screen needs from a scan, read defensively. The api's `FoodScanDto` is the contract
 * (`foodName`, `nutrition.proteinG`...), older screens used flatter names (`food`, `protein`), and the
 * vision service will add `needs_confirmation`, `alternatives` and a portion weight later: none of them
 * is required, and every one is used when it is there.
 */

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Alternative {
  name: string;
  confidence: number | null;
}

export interface ScanItem {
  key: string;
  /** The api's id of the item inside the scan; the PATCH names items by it. */
  classId: number | null;
  name: string;
  confidence: number | null;
  /** Nutrition of the portion the model saw. */
  base: Macros;
  /** Weight of that portion in grams, when the scan says so. */
  baseGrams: number | null;
  alternatives: Alternative[];
}

type Loose = Record<string, unknown>;
const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const first = (...values: unknown[]): number | null => {
  for (const v of values) {
    const n = num(v);
    if (n !== null) return n;
  }
  return null;
};
const obj = (value: unknown): Loose => (value && typeof value === 'object' ? (value as Loose) : {});

export function itemsFromScan(scan: FoodScanDto | null | undefined): ScanItem[] {
  const predictions = (scan?.predictions ?? []) as unknown as Loose[];
  return predictions.map((p, index) => {
    const nutrition = obj(p.nutrition);
    const info = obj(p.portionInfo);
    const grams = first(
      nutrition.portionWeightG,
      nutrition.portion_weight_g,
      p.portionWeightG,
      info.weightG,
      info.weight_g
    );
    const rawAlternatives = Array.isArray(p.alternatives) ? (p.alternatives as unknown[]) : [];
    const alternatives: Alternative[] = rawAlternatives
      .map((a) => {
        const alt = obj(a);
        const name = alt.foodName ?? alt.food_name ?? alt.name;
        return typeof name === 'string' && name ? { name, confidence: num(alt.confidence) } : null;
      })
      .filter((a): a is Alternative => a !== null);
    const name =
      (typeof p.foodName === 'string' && p.foodName) ||
      (typeof p.food === 'string' && p.food) ||
      '';
    return {
      key: `${index}-${String(p.classId ?? name)}`,
      classId: num(p.classId),
      name,
      confidence: num(p.confidence),
      base: {
        calories: first(nutrition.calories, p.calories) ?? 0,
        protein: first(nutrition.proteinG, nutrition.protein_g, p.protein) ?? 0,
        carbs: first(nutrition.carbsG, nutrition.carbs_g, p.carbs) ?? 0,
        fat: first(nutrition.fatG, nutrition.fat_g, p.fat) ?? 0,
      },
      baseGrams: grams !== null && grams > 0 ? grams : null,
      alternatives,
    };
  });
}

/** True when the scan asks the user to check it (`needs_confirmation`, either spelling, scan or item). */
export function needsConfirmation(scan: FoodScanDto | null | undefined): boolean {
  const loose = obj(scan);
  if (loose.needsConfirmation === true || loose.needs_confirmation === true) return true;
  return ((scan?.predictions ?? []) as unknown as Loose[]).some(
    (p) => p.needsConfirmation === true || p.needs_confirmation === true
  );
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export function confidenceLevel(confidence: number | null): ConfidenceLevel | null {
  if (confidence === null) return null;
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/** A portion edit: 1 is "as scanned". */
export type Factors = Record<string, number>;

export const MIN_FACTOR = 0.1;
export const MAX_FACTOR = 4;
const FACTOR_STEP = 0.25;

export function factorOf(item: ScanItem, factors: Factors): number {
  return factors[item.key] ?? 1;
}

export function gramsOf(item: ScanItem, factor: number): number | null {
  return item.baseGrams === null ? null : Math.round(item.baseGrams * factor);
}

/** One step bigger (+1) or smaller (-1): about 10% of the portion when the grams are known, else a quarter. */
export function stepFactor(item: ScanItem, factor: number, direction: 1 | -1): number {
  const next =
    item.baseGrams === null
      ? factor + direction * FACTOR_STEP
      : (Math.round(item.baseGrams * factor) +
          direction * Math.max(5, Math.round((item.baseGrams * 0.1) / 5) * 5)) /
        item.baseGrams;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, Math.round(next * 1000) / 1000));
}

export function scaled(item: ScanItem, factor: number): Macros {
  return {
    calories: item.base.calories * factor,
    protein: item.base.protein * factor,
    carbs: item.base.carbs * factor,
    fat: item.base.fat * factor,
  };
}

export function totals(items: ScanItem[], factors: Factors = {}): Macros {
  return items.reduce<Macros>(
    (sum, item) => {
      const m = scaled(item, factorOf(item, factors));
      return {
        calories: sum.calories + m.calories,
        protein: sum.protein + m.protein,
        carbs: sum.carbs + m.carbs,
        fat: sum.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Whole-number shares of protein, carbs and fat by weight; they always add up to 100 (or all 0). */
export function macroShares(m: Macros): { protein: number; carbs: number; fat: number } {
  const sum = m.protein + m.carbs + m.fat;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  const protein = Math.round((m.protein / sum) * 100);
  const carbs = Math.round((m.carbs / sum) * 100);
  return { protein, carbs, fat: 100 - protein - carbs };
}

export const MIN_GRAMS = 1;
export const MAX_GRAMS = 5000;
export const MAX_NAME_LENGTH = 100;

/**
 * The body items for `PATCH /food-scans/{id}`: every item with its portion in whole grams (1 to 5000)
 * and, when the user picked another food, its new name. Returns null when the correction cannot be
 * expressed: an item has no known weight or no class id.
 */
export function editItems(
  items: ScanItem[],
  factors: Factors,
  names: Record<string, string>
): { classId: number; grams: number; foodName?: string }[] | null {
  const out: { classId: number; grams: number; foodName?: string }[] = [];
  for (const item of items) {
    if (item.classId === null || item.baseGrams === null) return null;
    const grams = Math.min(
      MAX_GRAMS,
      Math.max(MIN_GRAMS, Math.round(item.baseGrams * factorOf(item, factors)))
    );
    const renamed = names[item.key];
    out.push({
      classId: item.classId,
      grams,
      ...(renamed && renamed !== item.name ? { foodName: renamed.slice(0, MAX_NAME_LENGTH) } : {}),
    });
  }
  return out.length > 0 ? out : null;
}

/** True when the user changed a portion or picked another food. */
export function hasEdits(
  items: ScanItem[],
  factors: Factors,
  names: Record<string, string>
): boolean {
  return items.some((i) => factorOf(i, factors) !== 1 || (names[i.key] && names[i.key] !== i.name));
}
