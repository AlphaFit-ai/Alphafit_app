import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import React from 'react';
import { Text } from 'react-native';
import { RootContent } from '../app/_layout';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';
import { runLaunchCheck } from '../services/launch';
import { sessionStore } from '../services/sessionStore';

/**
 * Seen on the phone (navigation trace): the session went back to 'loading' after the first launch, the
 * root layout swapped the navigator for the launch screen, and the navigation history was gone, so
 * Android back had nothing to pop and closed the app. A re-check of a known session now runs in the
 * background and the navigator stays mounted.
 */
const READY = {
  kind: 'ready' as const,
  data: null,
  route: '/(tabs)/home',
  step: 0,
  complete: true,
};
jest.mock('../services/bootstrap', () => ({
  ...jest.requireActual('../services/bootstrap'),
  bootstrapSession: jest.fn(async () => ({
    kind: 'ready',
    data: null,
    route: '/(tabs)/home',
    step: 0,
    complete: true,
  })),
}));
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  configureApiAuth: jest.fn(),
  default: {
    get: jest.fn(() => new Promise(() => {})),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
const mockBootstrap = jest.requireMock('../services/bootstrap').bootstrapSession as jest.Mock;

const page = (name: string) =>
  function Page() {
    return <Text>{name}</Text>;
  };

// expo-router's screen helpers are typed against Testing Library 14; the app runs 13.
const path = () => (screen as unknown as { getPathname(): string }).getPathname();

async function settle() {
  for (let i = 0; i < 5; i++) await act(async () => {});
}

async function openApp() {
  sessionStore.reset();
  await renderRouter(
    {
      _layout: function Root() {
        return (
          <AppProviders>
            <RootContent />
          </AppProviders>
        );
      },
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- the real entry route
      index: require('../app/index'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- the real tab layout
      '(tabs)/_layout': require('../app/(tabs)/_layout'),
      '(tabs)/home': page('Home'),
      '(tabs)/workouts': page('Workouts'),
      '(tabs)/scan': page('Scan'),
      '(tabs)/projections': page('Projections'),
      '(tabs)/diet': page('Diet'),
      '(tabs)/profile': page('Profile'),
      history: page('History'),
      'onboarding/login': page('Login'),
    },
    { initialUrl: '/' }
  );
  await settle();
}

it('the first launch check shows the launch screen once, then the app', async () => {
  await openApp();
  expect(mockBootstrap).toHaveBeenCalledTimes(1);
  expect(sessionStore.getState().status).toBe('ready');
  expect(path()).toBe('/home');
});

it('a re-check while signed in keeps the navigator and its history: back still returns to Home', async () => {
  await openApp();
  act(() => router.push('/history'));
  expect(path()).toBe('/history');

  const seen: string[] = [];
  const stop = sessionStore.subscribe(() => seen.push(sessionStore.getState().status));
  await act(async () => {
    await runLaunchCheck(async () => READY);
  });
  stop();
  await settle();

  expect(seen).not.toContain('loading');
  expect(path()).toBe('/history');
  expect(router.canGoBack()).toBe(true);
  act(() => router.back());
  expect(path()).toBe('/home');
});

it('a background re-check that cannot reach the api leaves the app as it is', async () => {
  await openApp();
  await act(async () => {
    await runLaunchCheck(async () => ({ kind: 'retry', reason: 'offline' }));
  });
  expect(sessionStore.getState()).toMatchObject({ status: 'ready', launchError: null });
  expect(path()).toBe('/home');
});
