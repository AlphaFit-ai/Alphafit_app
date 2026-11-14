import type { FoodScanDto, ScanEditItem } from '../../services/foodScanService';

/**
 * What the result screen needs from a scan, read defensively. The api's `FoodScanDto` is the contract
 * (`foodName`, `nutrition.proteinG`...), older screens used flatter names (`food`, `protein`). The
 * confirm state and the alternatives are per item (CONTRACTS 3.7); a scan from an older api has them on
 * the scan only, and then they belong to the first item. None of these fields is required.
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
  /** Set with `nutrition` when the api can switch the item to this food in one tap (CONTRACTS 3.7). */
  classId: number | null;
  /** The alternative's own portion weight, when it has one. */
  grams: number | null;
  /** What the item would count with this food instead; null for a name-only suggestion. */
  nutrition: Macros | null;
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
  /** The model asks the user to check this item. */
  needsConfirmation: boolean;
  /**
   * The scan says per item whether it needs checking (CONTRACTS 3.7, `false` included). Without it (an
   * older scan) a low confidence is the only hint.
   */
  confirmKnown: boolean;
}

/** An alternative the api can apply in one tap (`alternativeClassId`); others can only rename the item. */
export const canApply = (
  alt: Alternative
): alt is Alternative & { classId: number; nutrition: Macros } =>
  alt.classId !== null && alt.nutrition !== null;

/** Catalogue names come in lower case ("veggie burger"): show them with a capital first letter. */
export function foodLabel(name: string | null | undefined): string {
  const text = (name ?? '').trim();
  return text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : '';
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

function macrosOf(value: unknown): Macros | null {
  const n = obj(value);
  const calories = num(n.calories);
  if (calories === null) return null;
  return {
    calories,
    protein: first(n.proteinG, n.protein_g) ?? 0,
    carbs: first(n.carbsG, n.carbs_g) ?? 0,
    fat: first(n.fatG, n.fat_g) ?? 0,
  };
}

function alternativesOf(value: unknown): Alternative[] {
  const raw = Array.isArray(value) ? (value as unknown[]) : [];
  return raw
    .map((a) => {
      const alt = obj(a);
      const name = alt.foodName ?? alt.food_name ?? alt.name;
      if (typeof name !== 'string' || !name) return null;
      const nutrition = obj(alt.nutrition);
      const grams = first(alt.portionWeightG, alt.portion_weight_g, nutrition.portion_weight_g);
      return {
        name,
        confidence: num(alt.confidence),
        classId: first(alt.classId, alt.class_id),
        grams: grams !== null && grams > 0 ? grams : null,
        nutrition: macrosOf(alt.nutrition),
      };
    })
    .filter((a): a is Alternative => a !== null);
}

const hasOwn = (p: Loose, key: string) => Object.prototype.hasOwnProperty.call(p, key);

export function itemsFromScan(scan: FoodScanDto | null | undefined): ScanItem[] {
  const predictions = (scan?.predictions ?? []) as unknown as Loose[];
  const loose = obj(scan);
  // An older api put the confirm state and the alternatives on the scan only (CONTRACTS 3.6): each is
  // then given to the first item. A current api sends them per item and repeats them on the scan.
  const confirmPerItem = predictions.some(
    (p) => hasOwn(p, 'needsConfirmation') || hasOwn(p, 'needs_confirmation')
  );
  const alternativesPerItem = predictions.some((p) => hasOwn(p, 'alternatives'));
  const scanNeedsConfirmation =
    loose.needsConfirmation === true || loose.needs_confirmation === true;
  const scanAlternatives = alternativesOf(loose.alternatives);
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
    const alternatives = alternativesPerItem
      ? alternativesOf(p.alternatives)
      : index === 0
        ? scanAlternatives
        : [];
    const itemNeedsConfirmation = confirmPerItem
      ? p.needsConfirmation === true || p.needs_confirmation === true
      : index === 0 && scanNeedsConfirmation;
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
      needsConfirmation: itemNeedsConfirmation,
      confirmKnown: confirmPerItem,
    };
  });
}

/** The item as it would be with `alt` chosen: its name, nutrition and weight, nothing left to confirm. */
export function withAlternative(item: ScanItem, alt: Alternative): ScanItem {
  return {
    ...item,
    name: alt.name,
    confidence: alt.confidence,
    base: alt.nutrition ?? item.base,
    baseGrams: alt.grams ?? item.baseGrams,
    alternatives: [],
    needsConfirmation: false,
  };
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

/** Alternatives the user picked, by item key, not saved yet. */
export type Picks = Record<string, Alternative>;

/**
 * The body items for `PATCH /food-scans/{id}` (CONTRACTS 3.7): only the items the user changed, each by
 * its class id with what changed: `alternativeClassId` for a one-tap alternative, `grams` (whole, 1 to
 * 5000) for a new portion (of the alternative when one was picked), `foodName` for a new name. Empty when
 * nothing changed; null when a change cannot be expressed (an item without class id, or a portion change
 * on an item without a known weight), and the edit then stays on screen only.
 */
export function editItems(
  items: ScanItem[],
  factors: Factors,
  names: Record<string, string>,
  picks: Picks = {}
): ScanEditItem[] | null {
  const out: ScanEditItem[] = [];
  for (const item of items) {
    const alt = picks[item.key];
    const factor = factorOf(item, factors);
    const renamed = names[item.key];
    const rename = !alt && renamed && renamed !== item.name ? renamed : undefined;
    if (!alt && factor === 1 && !rename) continue;
    if (item.classId === null) return null;
    const edit: ScanEditItem = { classId: item.classId };
    if (alt) {
      if (!canApply(alt)) return null;
      edit.alternativeClassId = alt.classId;
    }
    if (factor !== 1) {
      const base = alt ? (alt.grams ?? item.baseGrams) : item.baseGrams;
      if (base === null) return null;
      edit.grams = Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, Math.round(base * factor)));
    }
    if (rename) edit.foodName = rename.slice(0, MAX_NAME_LENGTH);
    out.push(edit);
  }
  return out;
}

/** True when the user changed a portion, renamed an item or picked an alternative. */
export function hasEdits(
  items: ScanItem[],
  factors: Factors,
  names: Record<string, string>,
  picks: Picks = {}
): boolean {
  return items.some(
    (i) =>
      factorOf(i, factors) !== 1 || !!picks[i.key] || (!!names[i.key] && names[i.key] !== i.name)
  );
}
