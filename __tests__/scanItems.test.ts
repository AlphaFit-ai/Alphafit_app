import type { FoodScanDto } from '../services/foodScanService';
import {
  canApply,
  confidenceLevel,
  editItems,
  foodLabel,
  gramsOf,
  itemsFromScan,
  macroShares,
  MAX_FACTOR,
  MIN_FACTOR,
  needsConfirmation,
  scaled,
  stepFactor,
  totals,
  withAlternative,
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
    expect(item.alternatives).toEqual([
      { name: 'Caesar salad', confidence: 0.4, classId: null, grams: null, nutrition: null },
    ]);
  });

  it('gives every item a distinct key and survives an empty or missing scan', () => {
    const keys = itemsFromScan(scan([apiShape, apiShape])).map((i) => i.key);
    expect(new Set(keys).size).toBe(2);
    expect(itemsFromScan(null)).toEqual([]);
    expect(itemsFromScan(scan([]))).toEqual([]);
  });
});

/** The api's shape since WP-API-8 (CONTRACTS 3.7), as the local api returns seed-scan-demo-02. */
const hamburger = {
  foodName: 'hamburger',
  confidence: 0.5421,
  classId: 53,
  nutrition: { calories: 480, proteinG: 31.5, carbsG: 42.5, fatG: 19.6 },
  portionWeightG: 220,
  needsConfirmation: true,
  alternatives: [
    {
      foodName: 'veggie burger',
      confidence: 0.433,
      classId: 104,
      portionWeightG: 220,
      nutrition: { calories: 389, proteinG: 34.5, carbsG: 31.5, fatG: 13.9 },
    },
    { foodName: 'falafel wrap', confidence: 0.02 },
  ],
};
const fries = {
  foodName: 'french fries',
  confidence: 0.93,
  classId: 40,
  nutrition: { calories: 365, proteinG: 4, carbsG: 48, fatG: 17 },
  portionWeightG: 117,
  needsConfirmation: false,
  alternatives: [],
};

describe('per-item confirmation and alternatives (CONTRACTS 3.7)', () => {
  const meal = (extra: Record<string, unknown> = {}) =>
    scan([hamburger, fries], {
      needsConfirmation: true,
      alternatives: [{ foodName: 'veggie burger', confidence: 0.433 }],
      ...extra,
    });

  it('reads the confirm state and the alternatives of each item, with their class id and nutrition', () => {
    const [burger, side] = itemsFromScan(meal());
    expect(burger.needsConfirmation).toBe(true);
    expect(side.needsConfirmation).toBe(false);
    expect(side.alternatives).toEqual([]);
    expect(burger.alternatives[0]).toEqual({
      name: 'veggie burger',
      confidence: 0.433,
      classId: 104,
      grams: 220,
      nutrition: { calories: 389, protein: 34.5, carbs: 31.5, fat: 13.9 },
    });
  });

  it('offers one tap only for an alternative with a class id and nutrition; the rest rename only', () => {
    const [burger] = itemsFromScan(meal());
    expect(burger.alternatives.map(canApply)).toEqual([true, false]);
    const nameOnly = { name: 'x', confidence: null, classId: 9, grams: 100, nutrition: null };
    expect(canApply(nameOnly)).toBe(false);
  });

  it('falls back to the scan-level fields (older api): they belong to the first item', () => {
    const plain = ({ alternatives: _a, needsConfirmation: _n, ...rest }: typeof hamburger) => rest;
    const [first, second] = itemsFromScan(
      scan([plain(hamburger), plain(hamburger)], {
        needsConfirmation: true,
        alternatives: [{ foodName: 'veggie burger', confidence: 0.4 }],
      })
    );
    expect(first.needsConfirmation).toBe(true);
    expect(first.alternatives.map((a) => [a.name, canApply(a)])).toEqual([
      ['veggie burger', false],
    ]);
    expect(second.needsConfirmation).toBe(false);
    expect(second.alternatives).toEqual([]);
  });

  it('an item with an alternative picked counts that food, its weight, and asks nothing more', () => {
    const [burger] = itemsFromScan(meal());
    const veggie = withAlternative(burger, burger.alternatives[0]);
    expect(veggie).toMatchObject({
      key: burger.key,
      classId: 53, // the PATCH still names the item by its current class id
      name: 'veggie burger',
      base: { calories: 389 },
      baseGrams: 220,
      needsConfirmation: false,
      alternatives: [],
    });
  });

  it('sends only what changed: the alternative, a portion, a new name', () => {
    const items = itemsFromScan(meal());
    const [burger, side] = items;
    const veggie = burger.alternatives[0];
    expect(editItems(items, {}, {}, { [burger.key]: veggie })).toEqual([
      { classId: 53, alternativeClassId: 104 },
    ]);
    // A new portion of the alternative is counted from the alternative's own weight.
    expect(editItems(items, { [burger.key]: 0.5 }, {}, { [burger.key]: veggie })).toEqual([
      { classId: 53, alternativeClassId: 104, grams: 110 },
    ]);
    expect(editItems(items, { [side.key]: 2 }, { [burger.key]: 'falafel wrap' })).toEqual([
      { classId: 53, foodName: 'falafel wrap' },
      { classId: 40, grams: 234 },
    ]);
    expect(editItems(items, {}, {})).toEqual([]);
  });

  it('cannot express a pick without nutrition, or a portion of an item without weight', () => {
    const items = itemsFromScan(meal());
    expect(editItems(items, {}, {}, { [items[0].key]: items[0].alternatives[1] })).toBeNull();
    const noWeight = itemsFromScan(scan([{ ...fries, portionWeightG: undefined }]));
    expect(editItems(noWeight, { [noWeight[0].key]: 2 }, {})).toBeNull();
    // A new name needs no weight.
    expect(editItems(noWeight, {}, { [noWeight[0].key]: 'Chips' })).toEqual([
      { classId: 40, foodName: 'Chips' },
    ]);
  });

  it('shows catalogue names with a capital first letter', () => {
    expect(foodLabel('veggie burger')).toBe('Veggie burger');
    expect(foodLabel('éclair')).toBe('Éclair');
    expect(foodLabel('')).toBe('');
    expect(foodLabel(undefined)).toBe('');
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
