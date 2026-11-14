import { calculateAge } from './dateOfBirth';
import type { UserOnboardingData } from './userService';

const ACTIVITY_FACTOR = { low: 1.2, medium: 1.55, high: 1.725 } as const;
const GOAL_ADJUSTMENT = { 'lose-fat': -500, 'build-muscle': 250 } as Record<string, number>;
const MIN_CALORIES = 1200;

const heightCm = (h: NonNullable<UserOnboardingData['height']>): number | null => {
  if (h.unit === 'metric') return h.cm ?? null;
  if (h.feet === undefined) return null;
  return (h.feet * 12 + (h.inches ?? 0)) * 2.54;
};

const weightKg = (w: NonNullable<UserOnboardingData['weight']>): number | null => {
  if (w.unit === 'metric') return w.kg ?? null;
  return w.lbs === undefined ? null : w.lbs * 0.45359237;
};

/**
 * A rough daily calorie target from the onboarding answers (Mifflin-St Jeor, an activity factor and
 * a small goal adjustment). It is an estimate for orientation, shown as such, not medical advice.
 * Returns null when an answer it needs is missing, so Home shows no target rather than a made-up one.
 */
export function estimateDailyCalories(
  data: UserOnboardingData,
  now: Date = new Date()
): number | null {
  const age = calculateAge(data.dateOfBirth, now);
  if (age === null || !data.gender || !data.height || !data.weight) return null;
  const cm = heightCm(data.height);
  const kg = weightKg(data.weight);
  if (cm === null || kg === null) return null;

  const bmr = 10 * kg + 6.25 * cm - 5 * age + (data.gender === 'male' ? 5 : -161);
  const factor = ACTIVITY_FACTOR[data.activityLevel ?? 'low'];
  const adjusted = bmr * factor + (data.goal ? (GOAL_ADJUSTMENT[data.goal] ?? 0) : 0);
  return Math.max(MIN_CALORIES, Math.round(adjusted / 10) * 10);
}
