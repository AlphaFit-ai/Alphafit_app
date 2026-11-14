import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { BootstrapDeps, bootstrapSession } from '../services/bootstrap';
import type { OnboardingData } from '../services/onboardingService';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function httpError(status: number): AxiosError {
  return new AxiosError(
    'failed',
    'ERR_BAD_RESPONSE',
    config,
    {},
    { status, statusText: '', data: {}, headers: {}, config }
  );
}
const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK', config, {});

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

function makeDeps(overrides: Partial<BootstrapDeps> = {}): jest.Mocked<BootstrapDeps> {
  return {
    waitForAuth: jest.fn().mockResolvedValue(true),
    fetchOnboarding: jest.fn().mockResolvedValue(complete),
    ...overrides,
  } as jest.Mocked<BootstrapDeps>;
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('bootstrapSession', () => {
  it('goes to Home for a user who finished onboarding', async () => {
    expect(await bootstrapSession(makeDeps())).toMatchObject({
      kind: 'ready',
      route: '/(tabs)/home',
      complete: true,
    });
  });

  it('resumes onboarding at the first unanswered screen', async () => {
    const deps = makeDeps({
      fetchOnboarding: jest.fn().mockResolvedValue({ source: 'google', gender: 'male' }),
    });
    expect(await bootstrapSession(deps)).toMatchObject({
      kind: 'ready',
      route: '/onboarding/age',
      step: 1,
    });
  });

  it('starts onboarding for a signed-in user who has no data yet (a real "new user")', async () => {
    const deps = makeDeps({ fetchOnboarding: jest.fn().mockResolvedValue(null) });
    expect(await bootstrapSession(deps)).toMatchObject({
      kind: 'ready',
      route: '/onboarding/source',
      data: null,
    });
  });

  it('shows the intro when nobody is signed in, without calling the api', async () => {
    const deps = makeDeps({ waitForAuth: jest.fn().mockResolvedValue(false) });
    expect(await bootstrapSession(deps)).toEqual({ kind: 'unauthenticated' });
    expect(deps.fetchOnboarding).not.toHaveBeenCalled();
  });

  it('waits for Firebase to restore the saved session before it asks the api anything', async () => {
    const order: string[] = [];
    const deps = makeDeps({
      waitForAuth: jest.fn(async () => {
        await Promise.resolve();
        order.push('auth ready');
        return true;
      }),
      fetchOnboarding: jest.fn(async () => {
        order.push('fetch');
        return complete;
      }),
    });
    await bootstrapSession(deps);
    expect(order).toEqual(['auth ready', 'fetch']);
  });

  describe('a failed request is never "new user"', () => {
    it.each([
      ['no connection', networkError(), 'offline'],
      [
        'a timeout',
        new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED', config, {}),
        'timeout',
      ],
      ['a server error', httpError(500), 'http'],
      ['a gateway error', httpError(502), 'http'],
      ['a 503', httpError(503), 'http'],
      ['a 403 (wrong role, not a bad session)', httpError(403), 'http'],
    ])('shows a retry after %s and routes nowhere', async (_name, error, reason) => {
      const deps = makeDeps({ fetchOnboarding: jest.fn().mockRejectedValue(error) });
      const result = await bootstrapSession(deps);
      expect(result).toEqual({ kind: 'retry', reason });
    });

    it('can be tried again and then succeeds', async () => {
      const fetchOnboarding = jest
        .fn()
        .mockRejectedValueOnce(networkError())
        .mockResolvedValueOnce(complete);
      const deps = makeDeps({ fetchOnboarding });
      expect((await bootstrapSession(deps)).kind).toBe('retry');
      expect(await bootstrapSession(deps)).toMatchObject({ kind: 'ready', route: '/(tabs)/home' });
    });

    it('is a retry when Firebase itself cannot start', async () => {
      const deps = makeDeps({
        waitForAuth: jest.fn().mockRejectedValue(new Error('storage unreadable')),
      });
      expect((await bootstrapSession(deps)).kind).toBe('retry');
    });
  });

  describe('a session that cannot be used', () => {
    it('signs the user out on a 401 that reaches here (the api client already tried to renew it)', async () => {
      const deps = makeDeps({ fetchOnboarding: jest.fn().mockRejectedValue(httpError(401)) });
      expect(await bootstrapSession(deps)).toEqual({ kind: 'signedOut' });
      expect(deps.fetchOnboarding).toHaveBeenCalledTimes(1); // no second, imperative renewal here
    });

    it('signs the user out when the account no longer exists (404)', async () => {
      const deps = makeDeps({ fetchOnboarding: jest.fn().mockRejectedValue(httpError(404)) });
      expect(await bootstrapSession(deps)).toEqual({ kind: 'signedOut' });
    });
  });
});
