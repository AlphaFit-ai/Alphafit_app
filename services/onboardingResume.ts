import { ApiErrorKind, isSessionInvalid, normalizeApiError } from './apiError';
import type {
  DietOnboardingData,
  OnboardingData,
  ProjectionOnboardingData,
} from './onboardingService';

/**
 * Where a signed-in user continues. This is the only place that decides it: the launch screen, the
 * login screen and the registration screen all call `resolveOnboardingResume`.
 *
 * The rule that matters: a request that failed never means "this user has no data". An error is a
 * retry (or, when the session is gone, a sign-out) and never an onboarding route.
 */

export const HOME_ROUTE = '/(tabs)/home';

interface OnboardingStep {
  route: string;
  isDone: (data: OnboardingData) => boolean;
}

/** In the order the wizard asks them. */
const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { route: '/onboarding/source', isDone: (d) => !!d.source },
  { route: '/onboarding/age', isDone: (d) => !!d.dateOfBirth },
  { route: '/onboarding/gender', isDone: (d) => !!d.gender },
  { route: '/onboarding/height', isDone: (d) => !!d.height && !!d.weight },
  { route: '/onboarding/fitness-level', isDone: (d) => !!d.fitnessLevel },
  { route: '/onboarding/activity', isDone: (d) => !!d.activityLevel },
  { route: '/onboarding/workouts', isDone: (d) => !!d.workoutsPerWeek },
  { route: '/onboarding/equipment', isDone: (d) => !!d.equipment },
  { route: '/onboarding/goal', isDone: (d) => !!d.goal },
];

/** Number of wizard screens, i.e. the `step` of a user who has finished onboarding. */
export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

export type ResumeOutcome =
  /** Go to `route`. `step` is how many wizard screens are already done (0 to 9). */
  | { kind: 'route'; route: string; step: number; complete: boolean }
  /** The request failed in a way that may succeed later. Show a retry; do not change any data. */
  | { kind: 'retry'; reason: ApiErrorKind }
  /** The session is invalid or the account no longer exists. Sign out and show the login screen. */
  | { kind: 'signOut' };

export type ResumeInput = { data: OnboardingData | null | undefined } | { error: unknown };

/** Pure: first screen the user has not completed, or Home when they have completed all of them. */
export function getOnboardingRoute(data: OnboardingData | null | undefined): {
  route: string;
  step: number;
  complete: boolean;
} {
  // No data at all (null, undefined, or an object with nothing filled in) starts at the first screen.
  const safe = data ?? {};
  const index = ONBOARDING_STEPS.findIndex((step) => !step.isDone(safe));
  if (index === -1) {
    return { route: HOME_ROUTE, step: ONBOARDING_STEP_COUNT, complete: true };
  }
  return { route: ONBOARDING_STEPS[index].route, step: index, complete: false };
}

export function resolveOnboardingResume(input: ResumeInput): ResumeOutcome {
  if ('error' in input) {
    const error = normalizeApiError(input.error);
    // 401/403: the token is no longer valid. 404: the account does not exist (deleted elsewhere).
    if (isSessionInvalid(error) || (error.kind === 'http' && error.status === 404)) {
      return { kind: 'signOut' };
    }
    return { kind: 'retry', reason: error.kind };
  }
  return { kind: 'route', ...getOnboardingRoute(input.data) };
}

/**
 * Diet wizard steps shown in the Diet tab: 0 preference, 1 allergies, 2 meals per day,
 * 3 supplements, 4 food scan (everything answered).
 */
export function getDietResumeStep(data: DietOnboardingData | null | undefined): number {
  if (!data) return 0;
  if (!data.dietPreference) return 0;
  if (data.hasAllergies === undefined || data.hasAllergies === null) return 1;
  if (!data.mealsPerDay) return 2;
  if (data.takesSupplements === undefined || data.takesSupplements === null) return 3;
  return 4;
}

/**
 * Where Android back goes inside the Diet tab, which shows its questions, the scan and the results in
 * place (steps, not routes): a question goes to the previous question, a result (5 the scan's numbers,
 * 6 a barcode product) goes back to the scan (4). null leaves it to the navigation: the first question
 * and the scan itself go back through the tab bar's history. The scan used to go to the last question.
 */
export function dietBackStep(step: number): number | null {
  if (step >= 1 && step <= 3) return step - 1;
  if (step === 5 || step === 6) return 4;
  return null;
}

/**
 * Projection steps shown in the Projections tab: 1 sleep, 2 steps, 3 stress, 4 photos,
 * 0 statistics (everything answered).
 */
export function getProjectionResumeStep(data: ProjectionOnboardingData | null | undefined): number {
  if (!data) return 1;
  if (!data.sleepHours) return 1;
  if (!data.dailySteps) return 2;
  if (!data.stressLevel) return 3;
  if (!data.frontPhotoUrl || !data.sidePhotoUrl || !data.backPhotoUrl) return 4;
  return 0;
}
