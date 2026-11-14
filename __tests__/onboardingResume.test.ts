import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import {
  getDietResumeStep,
  getOnboardingRoute,
  getProjectionResumeStep,
  HOME_ROUTE,
  ONBOARDING_STEP_COUNT,
  resolveOnboardingResume,
} from '../services/onboardingResume';
import type { OnboardingData } from '../services/onboardingService';

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function httpError(status: number): AxiosError {
  return new AxiosError(
    'failed',
    'ERR_BAD_RESPONSE',
    config,
    {},
    {
      status,
      statusText: '',
      data: {},
      headers: {},
      config,
    }
  );
}

const complete: OnboardingData = {
  source: 'instagram',
  dateOfBirth: { month: 4, day: 12, year: 1998 },
  gender: 'female',
  height: { value: 170, unit: 'metric', cm: 170 },
  weight: { value: 65, unit: 'metric', kg: 65 },
  fitnessLevel: 'beginner',
  activityLevel: 'medium',
  workoutsPerWeek: '3-5',
  equipment: 'full-gym',
  goal: 'build-muscle',
};

describe('getOnboardingRoute', () => {
  it('starts at the first screen when there is no data (null or undefined)', () => {
    expect(getOnboardingRoute(null)).toEqual({
      route: '/onboarding/source',
      step: 0,
      complete: false,
    });
    expect(getOnboardingRoute(undefined).route).toBe('/onboarding/source');
  });

  it('starts at the first screen for an object with nothing filled in', () => {
    expect(getOnboardingRoute({}).route).toBe('/onboarding/source');
    expect(getOnboardingRoute({ source: undefined, goal: undefined }).route).toBe(
      '/onboarding/source'
    );
  });

  it('continues at the first unanswered screen for partial data', () => {
    expect(getOnboardingRoute({ source: 'google' })).toEqual({
      route: '/onboarding/age',
      step: 1,
      complete: false,
    });
    expect(getOnboardingRoute({ ...complete, goal: undefined })).toEqual({
      route: '/onboarding/goal',
      step: 8,
      complete: false,
    });
  });

  it('asks for height and weight together', () => {
    const onlyHeight = { ...complete, weight: undefined };
    expect(getOnboardingRoute(onlyHeight).route).toBe('/onboarding/height');
  });

  it('goes through the wizard in order, one screen per answer', () => {
    const order = [
      '/onboarding/source',
      '/onboarding/age',
      '/onboarding/gender',
      '/onboarding/height',
      '/onboarding/fitness-level',
      '/onboarding/activity',
      '/onboarding/workouts',
      '/onboarding/equipment',
      '/onboarding/goal',
    ];
    const answers: OnboardingData[] = [
      { source: 'google' },
      { dateOfBirth: complete.dateOfBirth },
      { gender: 'male' },
      { height: complete.height, weight: complete.weight },
      { fitnessLevel: 'advanced' },
      { activityLevel: 'low' },
      { workoutsPerWeek: '0-2' },
      { equipment: 'bodyweight-only' },
    ];
    let data: OnboardingData = {};
    order.forEach((route, index) => {
      expect(getOnboardingRoute(data).route).toBe(route);
      expect(getOnboardingRoute(data).step).toBe(index);
      if (answers[index]) data = { ...data, ...answers[index] };
    });
  });

  it('goes to Home when everything is answered', () => {
    expect(getOnboardingRoute(complete)).toEqual({
      route: HOME_ROUTE,
      step: ONBOARDING_STEP_COUNT,
      complete: true,
    });
  });
});

describe('resolveOnboardingResume', () => {
  it('turns data into a route', () => {
    expect(resolveOnboardingResume({ data: complete })).toMatchObject({
      kind: 'route',
      route: HOME_ROUTE,
    });
    expect(resolveOnboardingResume({ data: null })).toMatchObject({
      kind: 'route',
      route: '/onboarding/source',
    });
  });

  describe('when the request failed', () => {
    it('is a retry for a lost connection, a timeout and a server error, never an onboarding route', () => {
      const offline = new AxiosError('Network Error', 'ERR_NETWORK', config, {});
      const timeout = new AxiosError('timeout', 'ECONNABORTED', config, {});
      expect(resolveOnboardingResume({ error: offline })).toEqual({
        kind: 'retry',
        reason: 'offline',
      });
      expect(resolveOnboardingResume({ error: timeout })).toEqual({
        kind: 'retry',
        reason: 'timeout',
      });
      expect(resolveOnboardingResume({ error: httpError(500) })).toEqual({
        kind: 'retry',
        reason: 'http',
      });
      expect(resolveOnboardingResume({ error: new Error('anything') }).kind).toBe('retry');
    });

    it('signs the user out when the session is gone (401) or the account does not exist (404); a 403 is a wrong role and is only a retry', () => {
      expect(resolveOnboardingResume({ error: httpError(401) })).toEqual({ kind: 'signOut' });
      expect(resolveOnboardingResume({ error: httpError(403) }).kind).toBe('retry');
      expect(resolveOnboardingResume({ error: httpError(404) })).toEqual({ kind: 'signOut' });
    });

    it('never produces a route, whatever the error', () => {
      const errors = [
        new Error('x'),
        httpError(400),
        httpError(500),
        httpError(401),
        undefined,
        null,
        'boom',
      ];
      for (const error of errors) {
        expect(resolveOnboardingResume({ error }).kind).not.toBe('route');
      }
    });
  });
});

describe('getDietResumeStep', () => {
  it('starts at the first question with no data', () => {
    expect(getDietResumeStep(null)).toBe(0);
    expect(getDietResumeStep({})).toBe(0);
  });

  it('continues at the first unanswered question', () => {
    expect(getDietResumeStep({ dietPreference: 'vegan' })).toBe(1);
    expect(getDietResumeStep({ dietPreference: 'vegan', hasAllergies: false })).toBe(2);
    expect(getDietResumeStep({ dietPreference: 'vegan', hasAllergies: true, mealsPerDay: 3 })).toBe(
      3
    );
  });

  it('counts a "no" answer as answered', () => {
    expect(
      getDietResumeStep({
        dietPreference: 'flexible',
        hasAllergies: false,
        mealsPerDay: 4,
        takesSupplements: false,
      })
    ).toBe(4);
  });
});

describe('getProjectionResumeStep', () => {
  it('starts at sleep with no data', () => {
    expect(getProjectionResumeStep(null)).toBe(1);
    expect(getProjectionResumeStep({})).toBe(1);
  });

  it('continues at the first unanswered question and ends on the statistics', () => {
    expect(getProjectionResumeStep({ sleepHours: '7-8' })).toBe(2);
    expect(getProjectionResumeStep({ sleepHours: '7-8', dailySteps: '7-10k' })).toBe(3);
    expect(
      getProjectionResumeStep({ sleepHours: '7-8', dailySteps: '7-10k', stressLevel: 'low' })
    ).toBe(4);
    expect(
      getProjectionResumeStep({
        sleepHours: '7-8',
        dailySteps: '7-10k',
        stressLevel: 'low',
        frontPhotoUrl: 'a',
        sidePhotoUrl: 'b',
        backPhotoUrl: 'c',
      })
    ).toBe(0);
  });
});
