import { render, screen } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import { queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import { sessionStore } from '../services/sessionStore';
import { USER_ID_KEY } from '../services/storageKeys';
import { tokenStore } from '../services/tokenStore';

/**
 * The dev-only sign-in of the browser preview (docs/CONTRACTS.md section 8). It must do what a real
 * sign-in does when the build is a preview, and nothing at all in any other build.
 */
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const httpError = (status: number) =>
  new AxiosError(
    'x',
    'ERR_BAD_RESPONSE',
    config,
    {},
    {
      status,
      statusText: '',
      headers: {},
      config,
      data: {},
    }
  );

function jwt(claims: Record<string, unknown>): string {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${b64({ alg: 'HS512', typ: 'JWT' })}.${b64(claims)}.c2ln`;
}
const demoToken = jwt({
  sub: 'seed-user-demo',
  email: 'demo@example.test',
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const completeOnboarding = {
  source: 'instagram',
  dateOfBirth: { month: 1, day: 2, year: 1990 },
  gender: 'female',
  height: { value: 170, unit: 'metric', cm: 170 },
  weight: { value: 60, unit: 'metric', kg: 60 },
  fitnessLevel: 'beginner',
  activityLevel: 'low',
  workoutsPerWeek: '0-2',
  equipment: 'full-gym',
  goal: 'stay-fit',
};

const ORIGINAL = process.env.EXPO_PUBLIC_PREVIEW;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.EXPO_PUBLIC_PREVIEW;
  else process.env.EXPO_PUBLIC_PREVIEW = ORIGINAL;
});
beforeEach(() => jest.clearAllMocks());

const load = () =>
  jest.requireActual('../src/preview/devSignIn') as typeof import('../src/preview/devSignIn');

describe('in a preview build (EXPO_PUBLIC_PREVIEW=1)', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_PREVIEW = '1';
  });

  it('signs in like a real sign-in: token and user id stored, answers read, session ready', async () => {
    mockApi.get.mockResolvedValue({ data: { data: completeOnboarding } });
    const result = await load().signInWithDevToken(demoToken);

    expect(await tokenStore.getToken()).toBe(demoToken);
    expect(await jest.requireMock('expo-secure-store').getItemAsync(USER_ID_KEY)).toBe(
      'seed-user-demo'
    );
    expect(mockApi.get).toHaveBeenCalledWith('/onboarding', expect.anything());
    expect(result.complete).toBe(true);
    expect(sessionStore.getState().status).toBe('ready');
    expect(queryClient.getQueryData(queryKeys.onboarding)).toEqual(completeOnboarding);
  });

  it('continues onboarding where a user with missing answers stopped', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { source: 'instagram' } } });
    await load().signInWithDevToken(demoToken);
    expect(sessionStore.getState()).toMatchObject({
      status: 'onboarding',
      resumeRoute: '/onboarding/age',
    });
  });

  it('first signs the previous user out completely (nothing of theirs stays in the cache)', async () => {
    await tokenStore.save('previous-token', 'previous-user');
    queryClient.setQueryData(queryKeys.profile, { fullName: 'Previous User' });
    mockApi.get.mockResolvedValue({ data: { data: completeOnboarding } });

    await load().signInWithDevToken(demoToken);

    expect(queryClient.getQueryData(queryKeys.profile)).toBeUndefined();
    expect(await tokenStore.getToken()).toBe(demoToken);
  });

  it('keeps nothing when the api refuses the token, and says it was refused', async () => {
    mockApi.get.mockRejectedValue(httpError(401));
    await expect(load().signInWithDevToken(demoToken)).rejects.toMatchObject({
      reason: 'rejected',
    });
    expect(await tokenStore.getToken()).toBeNull();
    expect(sessionStore.getState().status).toBe('signedOut');
  });

  it('tells "the api is down" apart from "the token is bad"', async () => {
    mockApi.get.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK', config, {}));
    await expect(load().signInWithDevToken(demoToken)).rejects.toMatchObject({
      reason: 'offline',
    });
    expect(await tokenStore.getToken()).toBeNull();
  });

  it('refuses a broken or expired link before calling the api', async () => {
    const { signInWithDevToken } = load();
    await expect(signInWithDevToken(null)).rejects.toMatchObject({ reason: 'missing' });
    await expect(signInWithDevToken('not-a-jwt')).rejects.toMatchObject({ reason: 'malformed' });
    await expect(signInWithDevToken(jwt({ sub: 'u1', exp: 1 }))).rejects.toMatchObject({
      reason: 'expired',
    });
    expect(mockApi.get).not.toHaveBeenCalled();
    expect(await tokenStore.getToken()).toBeNull();
  });
});

describe('in any other build (no EXPO_PUBLIC_PREVIEW=1)', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_PREVIEW;
  });

  it('accepts no token at all, even a valid one, and calls nothing', async () => {
    await expect(load().signInWithDevToken(demoToken)).rejects.toMatchObject({
      reason: 'disabled',
    });
    process.env.EXPO_PUBLIC_PREVIEW = '0';
    await expect(load().signInWithDevToken(demoToken)).rejects.toMatchObject({
      reason: 'disabled',
    });
    expect(mockApi.get).not.toHaveBeenCalled();
    expect(await tokenStore.getToken()).toBeNull();
  });

  it('the /dev-sign-in route only redirects to / and never loads the preview code', () => {
    let previewLoaded = false;
    jest.isolateModules(() => {
      jest.doMock('../src/preview', () => {
        previewLoaded = true;
        return {};
      });
      const Route = jest.requireActual('../app/dev-sign-in').default;
      render(<Route />);
    });
    expect(mockRedirect).toHaveBeenCalledWith('/');
    expect(previewLoaded).toBe(false);
    expect(screen.toJSON()).toBeNull();
  });

  it('with the flag the same route renders the dev sign-in screen', () => {
    process.env.EXPO_PUBLIC_PREVIEW = '1';
    const mockScreen = jest.fn(() => null);
    jest.isolateModules(() => {
      jest.doMock('../src/preview', () => ({ DevSignInScreen: mockScreen }));
      const Route = jest.requireActual('../app/dev-sign-in').default;
      render(<Route />);
    });
    expect(mockScreen).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
