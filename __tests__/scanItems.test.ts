import type { FoodScanDto } from '../services/foodScanService';
import {
  confidenceLevel,
  gramsOf,
  itemsFromScan,
  macroShares,
  MAX_FACTOR,
  MIN_FACTOR,
  needsConfirmation,
  scaled,
  stepFactor,
  totals,
} from '../src/scan/items';

const scan = (predictions: unknown[], extra: Record<string, unknown> = {}) =>
  ({ id: 's1', predictions, status: 'COMPLETED', ...extra }) as unknown as FoodScanDto;

const apiShape = {
  foodName: 'Chicken salad',
  confidence: 0.91,
  classId: 7,
  nutrition: { calories: 400, proteinG: 30, carbsG: 20, fatG: 20 },
};

describe('itemsFromScan', () => {
  it('reads the api shape (foodName, nutrition.proteinG)', () => {
    const [item] = itemsFromScan(scan([apiShape]));
    expect(item).toMatchObject({
      name: 'Chicken salad',
      confidence: 0.91,
      base: { calories: 400, protein: 30, carbs: 20, fat: 20 },
      baseGrams: null,
      alternatives: [],
    });
  });

  it('still reads the older flat names, and the snake_case vision names', () => {
    const items = itemsFromScan(
      scan([
        { food: 'Rice', calories: 200, protein: 4, carbs: 44, fat: 1 },
        { foodName: 'Egg', nutrition: { calories: 70, protein_g: 6, carbs_g: 0.5, fat_g: 5 } },
      ])
    );
    expect(items[0]).toMatchObject({ name: 'Rice', base: { calories: 200, carbs: 44 } });
    expect(items[1].base).toEqual({ calories: 70, protein: 6, carbs: 0.5, fat: 5 });
  });

  it('works when the optional new fields are absent, and uses them when present', () => {
    expect(itemsFromScan(scan([apiShape]))[0].alternatives).toEqual([]);
    const [item] = itemsFromScan(
      scan([
        {
          ...apiShape,
          nutrition: { ...apiShape.nutrition, portion_weight_g: 250 },
          alternatives: [{ foodName: 'Caesar salad', confidence: 0.4 }, { nope: true }],
        },
      ])
    );
    expect(item.baseGrams).toBe(250);
    expect(item.alternatives).toEqual([{ name: 'Caesar salad', confidence: 0.4 }]);
  });

  it('gives every item a distinct key and survives an empty or missing scan', () => {
    const keys = itemsFromScan(scan([apiShape, apiShape])).map((i) => i.key);
    expect(new Set(keys).size).toBe(2);
    expect(itemsFromScan(null)).toEqual([]);
    expect(itemsFromScan(scan([]))).toEqual([]);
  });
});

describe('needsConfirmation', () => {
  it('is false by default and true for either spelling, on the scan or on an item', () => {
    expect(needsConfirmation(scan([apiShape]))).toBe(false);
    expect(needsConfirmation(scan([apiShape], { needs_confirmation: true }))).toBe(true);
    expect(needsConfirmation(scan([apiShape], { needsConfirmation: true }))).toBe(true);
    expect(needsConfirmation(scan([{ ...apiShape, needs_confirmation: true }]))).toBe(true);
    expect(needsConfirmation(null)).toBe(false);
  });
});

describe('portion edits', () => {
  const grams = itemsFromScan(
    scan([{ ...apiShape, nutrition: { ...apiShape.nutrition, portion_weight_g: 200 } }])
  )[0];
  const noGrams = itemsFromScan(scan([apiShape]))[0];

  it('steps by about 10% of the grams when they are known, 25% otherwise', () => {
    expect(gramsOf(grams, stepFactor(grams, 1, 1))).toBe(220);
    expect(gramsOf(grams, stepFactor(grams, 1, -1))).toBe(180);
    expect(stepFactor(noGrams, 1, 1)).toBe(1.25);
    expect(stepFactor(noGrams, 1, -1)).toBe(0.75);
    expect(gramsOf(noGrams, 1)).toBeNull();
  });

  it('never goes below the minimum or above the maximum', () => {
    let f = 1;
    for (let i = 0; i < 100; i++) f = stepFactor(noGrams, f, -1);
    expect(f).toBe(MIN_FACTOR);
    for (let i = 0; i < 100; i++) f = stepFactor(noGrams, f, 1);
    expect(f).toBe(MAX_FACTOR);
  });

  it('scales calories and macros with the portion and sums them', () => {
    expect(scaled(noGrams, 0.5)).toEqual({ calories: 200, protein: 15, carbs: 10, fat: 10 });
    const two = itemsFromScan(scan([apiShape, { ...apiShape, classId: 8 }]));
    expect(totals(two).calories).toBe(800);
    expect(totals(two, { [two[0].key]: 0.5 }).calories).toBe(600);
  });
});

describe('macroShares and confidence', () => {
  it('shares add up to 100 and are zero for no macros', () => {
    const s = macroShares({ calories: 0, protein: 33, carbs: 33, fat: 34 });
    expect(s.protein + s.carbs + s.fat).toBe(100);
    expect(macroShares({ calories: 0, protein: 0, carbs: 0, fat: 0 })).toEqual({
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('labels confidence and says nothing when it is unknown', () => {
    expect(confidenceLevel(0.9)).toBe('high');
    expect(confidenceLevel(0.6)).toBe('medium');
    expect(confidenceLevel(0.2)).toBe('low');
    expect(confidenceLevel(null)).toBeNull();
  });
});
