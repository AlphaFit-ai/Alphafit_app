import { estimateDailyCalories } from '../services/calorieTarget';

const NOW = new Date(2026, 5, 15); // 15 June 2026

const base = {
  gender: 'male' as const,
  dateOfBirth: { month: 6, day: 15, year: 1996 }, // 30 today
  height: { value: 180, unit: 'metric' as const, cm: 180 },
  weight: { value: 80, unit: 'metric' as const, kg: 80 },
  activityLevel: 'medium' as const,
};

describe('estimateDailyCalories', () => {
  it('follows Mifflin-St Jeor with an activity factor (hand-computed)', () => {
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; x 1.55 = 2759 -> rounded to 2760
    expect(estimateDailyCalories(base, NOW)).toBe(2760);
  });

  it('uses the female constant', () => {
    // BMR = 800 + 1125 - 150 - 161 = 1614; x 1.55 = 2501.7 -> 2500
    expect(estimateDailyCalories({ ...base, gender: 'female' }, NOW)).toBe(2500);
  });

  it('takes 500 off for fat loss and adds 250 for muscle gain', () => {
    expect(estimateDailyCalories({ ...base, goal: 'lose-fat' }, NOW)).toBe(2260);
    expect(estimateDailyCalories({ ...base, goal: 'build-muscle' }, NOW)).toBe(3010);
  });

  it('converts feet, inches and pounds', () => {
    const imperial = {
      ...base,
      height: { value: 71, unit: 'imperial' as const, feet: 5, inches: 11 },
      weight: { value: 176, unit: 'imperial' as const, lbs: 176 },
    };
    const metric = {
      ...base,
      height: { value: 180, unit: 'metric' as const, cm: 180.34 },
      weight: { value: 80, unit: 'metric' as const, kg: 79.83 },
    };
    expect(estimateDailyCalories(imperial, NOW)).toBe(estimateDailyCalories(metric, NOW));
  });

  it('never goes below 1200', () => {
    const tiny = {
      ...base,
      gender: 'female' as const,
      weight: { value: 40, unit: 'metric' as const, kg: 40 },
      height: { value: 150, unit: 'metric' as const, cm: 150 },
      activityLevel: 'low' as const,
      goal: 'lose-fat' as const,
    };
    expect(estimateDailyCalories(tiny, NOW)).toBe(1200);
  });

  it('returns null, not a guess, when an answer is missing', () => {
    expect(estimateDailyCalories({ ...base, weight: undefined }, NOW)).toBeNull();
    expect(estimateDailyCalories({ ...base, gender: undefined }, NOW)).toBeNull();
    expect(estimateDailyCalories({ ...base, dateOfBirth: undefined }, NOW)).toBeNull();
    expect(estimateDailyCalories({}, NOW)).toBeNull();
  });
});
