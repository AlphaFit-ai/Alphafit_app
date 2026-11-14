import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import React from 'react';
import { Text } from 'react-native';
import { RootContent } from '../app/_layout';
import { AppProviders } from '../context/AppProviders';
import i18n from '../i18n/config';
import es from '../i18n/locales/es.json';
import fr from '../i18n/locales/fr.json';
import { sessionStore } from '../services/sessionStore';
import { AUTH_TOKEN_KEY, LANGUAGE_STORAGE_KEY } from '../services/storageKeys';
import { SHEET_EXIT_MS } from '../src/ui/Sheet';

/**
 * The owner on the phone: changing the language "is buggy, it should be smooth". It switched while the
 * sheet was still on top (the whole screen re-rendered under it, then the sheet vanished), and the
 * Language screen waited for the server before going back. Now: the choice is marked at once, the
 * sheet leaves first, then the language switches in one render (no animation, the owner's choice),
 * nothing is mounted again, and the phone and the server are written in the background.
 */
jest.mock('../services/bootstrap', () => ({
  ...jest.requireActual('../services/bootstrap'),
  bootstrapSession: jest.fn(async () => ({ kind: 'unauthenticated' })),
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
jest.mock('../services/firebaseAuthService', () => ({
  __esModule: true,
  default: {
    isAppleSignInAvailable: jest.fn(async () => false),
    isGoogleSignInAvailable: jest.fn(() => false),
  },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

// expo-router's screen helpers are typed against Testing Library 14; the app runs 13.
const path = () => (screen as unknown as { getPathname(): string }).getPathname();
const flush = () => act(async () => {});
const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));
const checked = (name: string) =>
  screen.getByRole('radio', { name }).props.accessibilityState?.checked;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  await i18n.changeLanguage('en');
});
afterEach(() => {
  jest.useRealTimers();
});

describe('Login (the real root layout and navigator)', () => {
  async function openLogin() {
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
        /* eslint-disable @typescript-eslint/no-require-imports -- the real routes */
        index: require('../app/index'),
        'onboarding/_layout': require('../app/onboarding/_layout'),
        'onboarding/index': require('../app/onboarding/index'),
        'onboarding/intro': require('../app/onboarding/intro'),
        'onboarding/login': require('../app/onboarding/login'),
        'onboarding/register': require('../app/onboarding/register'),
        /* eslint-enable @typescript-eslint/no-require-imports */
      },
      { initialUrl: '/onboarding/login' }
    );
    for (let i = 0; i < 5; i++) await flush();
  }

  it('marks the choice at once, closes the sheet first, then switches: nothing remounts or resets', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await openLogin();
    expect(path()).toBe('/onboarding/login');
    fireEvent.changeText(screen.getByPlaceholderText(i18n.t('welcome.emailPlaceholder')), 'a@b.co');
    const traceBefore = log.mock.calls.length;

    fireEvent.press(screen.getByRole('button', { name: 'Language' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Français' }));
    // Marked at once; nothing under the sheet changes while it is still on screen.
    expect(checked('Français')).toBe(true);
    expect(i18n.language).toBe('en');
    expect(screen.getByText(i18n.t('profile.selectLanguage'))).toBeTruthy();

    wait(SHEET_EXIT_MS + 10); // the sheet leaves, then the language switches, with nothing on top
    expect(screen.queryByText('Select Language')).toBeNull();
    expect(i18n.language).toBe('fr');
    expect(screen.queryByTestId('theme-reveal')).toBeNull();

    // Every text on the screen is in French, and it is the same screen: the typed e-mail is still there.
    expect(screen.getByText(fr.welcome.title)).toBeTruthy();
    expect(screen.getByText(fr.welcome.continue)).toBeTruthy();
    expect(screen.getByDisplayValue('a@b.co')).toBeTruthy();
    expect(path()).toBe('/onboarding/login');
    // The dev trace saw the language change and nothing else: no new root (it logs `session` when
    // mounted) and no route reset.
    const trace = log.mock.calls.slice(traceBefore).map((call) => call.join(' '));
    expect(trace).toEqual(['[alphafit-trace] language fr']);
    // Not signed in: saved on the phone only.
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(mockApi.put).not.toHaveBeenCalled();
  });
});

describe('Profile screens (the real Profile stack)', () => {
  async function openProfile(route: '/profile/settings' | '/profile/language') {
    await renderRouter(
      {
        _layout: function Root() {
          return (
            <AppProviders>
              <Stack screenOptions={{ headerShown: false }} />
            </AppProviders>
          );
        },
        index: function Home() {
          return <Text>Profile tab</Text>;
        },
        /* eslint-disable @typescript-eslint/no-require-imports -- the real routes */
        'profile/_layout': require('../app/profile/_layout'),
        'profile/settings': require('../app/profile/settings'),
        'profile/language': require('../app/profile/language'),
        /* eslint-enable @typescript-eslint/no-require-imports */
      },
      { initialUrl: '/' }
    );
    act(() => router.push(route));
    await flush();
  }

  it('Settings: the sheet closes before the switch, then the row and the title are in Spanish', async () => {
    await openProfile('/profile/settings');
    fireEvent.press(screen.getByText('Language'));
    fireEvent.press(screen.getByRole('radio', { name: 'Español' }));
    expect(checked('Español')).toBe(true);
    expect(i18n.language).toBe('en');
    wait(SHEET_EXIT_MS + 10);
    expect(i18n.language).toBe('es');
    expect(screen.getByText(es.profile.appSettings)).toBeTruthy();
    expect(screen.getByText('Español')).toBeTruthy(); // the row's current language
    expect(path()).toBe('/profile/settings');
  });

  it('Language: marks the choice, switches, and goes back without waiting for the server', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'token'); // signed in: the account is told
    mockApi.put.mockReturnValue(new Promise(() => {})); // and the server never answers
    await openProfile('/profile/language');
    fireEvent.press(screen.getByRole('radio', { name: 'Français' }));
    expect(checked('Français')).toBe(true);
    expect(i18n.language).toBe('fr'); // no sheet here: at once
    wait(1000);
    for (let i = 0; i < 3; i++) await flush();
    expect(path()).toBe('/');
    expect(screen.getByText('Profile tab')).toBeTruthy();
    expect(mockApi.put).toHaveBeenCalledWith('/users/profile', { preferences: { language: 'fr' } });
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
  });
});
