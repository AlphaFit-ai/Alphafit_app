import { act, fireEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { HeaderShownContext } from 'expo-router/react-navigation';
import { renderRouter, screen } from 'expo-router/testing-library';
import React from 'react';
import { Text } from 'react-native';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';
import { dietBackStep } from '../services/onboardingResume';
import { sessionStore, useSession } from '../services/sessionStore';
import { PageHeader } from '../src/ui';
import { useSwitchTo } from '../src/wizard/useSwitchTo';

/**
 * Back navigation, as the Android back button does it (`router.back()` is the same go-back action the
 * navigation container sends on a hardware back press): with the app's real tab, Profile, Diet,
 * Projection and onboarding layouts, and a root Stack laid out like app/_layout.tsx. Screens are stubs.
 */
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => new Promise(() => {})),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

/* eslint-disable @typescript-eslint/no-require-imports -- the real layout modules, as route entries */
const layouts = {
  '(tabs)/_layout': require('../app/(tabs)/_layout'),
  'profile/_layout': require('../app/profile/_layout'),
  'diet/_layout': require('../app/diet/_layout'),
  'projection/_layout': require('../app/projection/_layout'),
  'onboarding/_layout': require('../app/onboarding/_layout'),
  'onboarding/index': require('../app/onboarding/index'),
  index: require('../app/index'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** The root Stack of app/_layout.tsx without the launch screen, fonts and status bar. */
function Root() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}
function RootStack() {
  const session = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Protected guard={session.status === 'ready'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="diet" />
        <Stack.Screen name="projection" />
        <Stack.Screen name="history" />
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="scan-result" options={{ presentation: 'transparentModal' }} />
      </Stack.Protected>
    </Stack>
  );
}

/** A stub screen. It also says whether a navigator header is drawn above it (there must be none). */
const page = (name: string) =>
  function Page() {
    const underHeader = React.useContext(HeaderShownContext);
    return <Text>{underHeader ? `${name} (under a navigator header)` : name}</Text>;
  };

const routes = {
  _layout: Root,
  ...layouts,
  '(tabs)/home': page('Home'),
  '(tabs)/workouts': page('Workouts'),
  '(tabs)/scan': page('Scan'),
  '(tabs)/projections': page('Projections'),
  '(tabs)/diet': page('Diet'),
  '(tabs)/profile': page('Profile'),
  history: page('History'),
  chatbot: page('Chat'),
  'scan-result': page('Scan result'),
  // A pushed screen's own header, as the real Profile screens draw it.
  'profile/settings': function Settings() {
    return <PageHeader title="Settings" />;
  },
  'profile/manage-data': page('My data'),
  'diet/meals': page('Meals question'),
  'projection/sleep': page('Sleep question'),
  'onboarding/intro': page('Intro'),
  // The cross-links as app/onboarding/login.tsx and register.tsx wire them.
  'onboarding/login': function Login() {
    const switchTo = useSwitchTo();
    return (
      <Text onPress={() => switchTo('register', '/onboarding/register', 'push')}>
        Login: Sign up
      </Text>
    );
  },
  'onboarding/register': function Register() {
    const switchTo = useSwitchTo();
    return (
      <Text onPress={() => switchTo('login', '/onboarding/login', 'replace')}>
        Register: Sign in
      </Text>
    );
  },
  'onboarding/source': page('Source question'),
};

// expo-router's screen helpers are typed against Testing Library 14; the app runs 13 (see CLAUDE.md).
const path = () => (screen as unknown as { getPathname(): string }).getPathname();

async function openApp(status: 'ready' | 'signedOut' = 'ready') {
  if (status === 'ready') sessionStore.setReady();
  else sessionStore.setSignedOut(true);
  await renderRouter(routes, { initialUrl: '/' });
}

describe('back returns to the screen it came from', () => {
  it('History, the scan result sheet and chat, opened from Home', async () => {
    await openApp();
    expect(path()).toBe('/home');
    for (const route of ['/history', '/scan-result?scanId=s1', '/chatbot'] as const) {
      act(() => router.push(route));
      expect(router.canGoBack()).toBe(true);
      act(() => router.back());
      expect(path()).toBe('/home');
    }
  });

  it('Profile screens and the questions opened from them', async () => {
    await openApp();
    act(() => router.navigate('/profile'));
    act(() => router.push('/profile/manage-data'));
    act(() => router.push({ pathname: '/diet/meals', params: { returnTo: 'profile' } }));
    expect(path()).toBe('/diet/meals');
    act(() => router.back());
    expect(path()).toBe('/profile/manage-data');
    act(() => router.back());
    expect(path()).toBe('/profile');
    act(() => router.push('/profile/settings'));
    act(() => router.back());
    expect(path()).toBe('/profile');
  });
});

describe('tabs', () => {
  it('back goes to the tab visited before, and only Home with nothing behind it leaves the app', async () => {
    await openApp();
    act(() => router.navigate('/workouts'));
    act(() => router.navigate('/profile'));
    act(() => router.back());
    // With the old default ("firstRoute") this jumped straight to Home.
    expect(path()).toBe('/workouts');
    act(() => router.back());
    expect(path()).toBe('/home');
    expect(router.canGoBack()).toBe(false); // the next back leaves the app
  });

  it('the centre scan button (the Diet tab) goes back to the tab it was pressed on', async () => {
    await openApp();
    act(() => router.navigate('/workouts'));
    act(() => router.navigate('/(tabs)/diet'));
    act(() => router.back());
    expect(path()).toBe('/workouts');
  });
});

describe('sign-in and sign-out are not undone by back', () => {
  it('after signing in, back does not return to the login screen', async () => {
    await openApp('signedOut');
    expect(path()).toBe('/onboarding/login');
    // What the login screen does after a successful sign-in.
    act(() => {
      sessionStore.setReady();
      router.replace('/');
    });
    expect(path()).toBe('/home');
    expect(router.canGoBack()).toBe(false);
  });

  it('after signing out, back does not return into the app', async () => {
    await openApp();
    act(() => router.push('/profile/settings'));
    // What signOut() and the Profile screen do.
    act(() => {
      sessionStore.setSignedOut(true);
      router.replace('/');
    });
    expect(path()).toBe('/onboarding/login');
    expect(router.canGoBack()).toBe(false);
  });
});

describe('back inside the Diet tab (questions, scan and results are steps, not routes)', () => {
  it('a question goes to the previous one, a result goes back to the scan', () => {
    expect([1, 2, 3].map(dietBackStep)).toEqual([0, 1, 2]);
    expect(dietBackStep(5)).toBe(4);
    expect(dietBackStep(6)).toBe(4);
  });

  it('the first question and the scan itself leave the tab (it used to send the scan to a question)', () => {
    expect(dietBackStep(0)).toBeNull();
    expect(dietBackStep(4)).toBeNull();
  });
});

describe('no navigator header anywhere (the owner wants none)', () => {
  it('tabs, pushed screens and the Profile and Diet stacks draw no header above the screen', async () => {
    await openApp();
    expect(screen.getByText('Home')).toBeTruthy(); // not "(under a navigator header)"
    for (const route of ['/workouts', '/profile', '/history', '/chatbot'] as const) {
      act(() => router.navigate(route));
      expect(screen.queryByText(/under a navigator header/)).toBeNull();
    }
    act(() => router.push('/profile/manage-data'));
    act(() => router.push({ pathname: '/diet/meals', params: { returnTo: 'profile' } }));
    expect(screen.getByText('Meals question')).toBeTruthy();
    expect(screen.queryByText(/under a navigator header/)).toBeNull();
  });

  it("a pushed screen's own round back button goes back like Android back", async () => {
    await openApp();
    act(() => router.navigate('/profile'));
    act(() => router.push('/profile/settings'));
    expect(screen.getByRole('header', { name: 'Settings' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(path()).toBe('/profile');
  });
});

describe('Login and Register link to each other without piling up', () => {
  it('Sign up then Sign in returns to the same Login (no second Login on top)', async () => {
    await openApp('signedOut');
    expect(path()).toBe('/onboarding/login');
    fireEvent.press(screen.getByText('Login: Sign up'));
    expect(path()).toBe('/onboarding/register');
    fireEvent.press(screen.getByText('Register: Sign in'));
    expect(path()).toBe('/onboarding/login');
    // Back from here leaves the app: there is nothing below this Login.
    expect(router.canGoBack()).toBe(false);
    // And again: still one Login, one Register at most.
    fireEvent.press(screen.getByText('Login: Sign up'));
    fireEvent.press(screen.getByText('Register: Sign in'));
    expect(router.canGoBack()).toBe(false);
  });

  it('Register opened on its own: Sign in replaces it with Login', async () => {
    await openApp('signedOut');
    act(() => router.replace('/onboarding/register'));
    fireEvent.press(screen.getByText('Register: Sign in'));
    expect(path()).toBe('/onboarding/login');
    expect(router.canGoBack()).toBe(false);
  });
});
