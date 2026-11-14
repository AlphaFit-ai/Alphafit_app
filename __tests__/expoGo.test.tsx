import { render, screen } from '@testing-library/react-native';
import React from 'react';
import LoginScreen from '../app/onboarding/login';
import RegisterScreen from '../app/onboarding/register';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';
import firebaseAuthService from '../services/firebaseAuthService';
import { isExpoGo } from '../services/nativeModules';
import { Input, Screen, Text } from '../src/ui';

/**
 * The app opened in Expo Go SDK 58 (the owner's phone, `npm run phone`), simulated the way the real one
 * looks: the `ExpoGo` native module is there (jest-expo provides it, so `isRunningInExpoGo()` is true)
 * and `executionEnvironment` is not "storeClient" (the check that let the Google package load in Expo
 * Go 58 and put a red error on the phone). Expo Go has no Google sign-in native module, and that
 * package throws as soon as it is imported. Everything else the app uses natively ships in Expo Go SDK
 * 58, react-native-keyboard-controller included, so those keep their normal mocks here.
 */
// The real `expo`, not the development-build stand-in of jest.setup.js.
jest.mock('expo', () => jest.requireActual('expo'));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'bare',
    expoConfig: {
      extra: {
        apiUrl: 'https://api.test.invalid',
        firebase: { apiKey: 'test', projectId: 'test' },
        googleAuth: { webClientId: 'test.apps.googleusercontent.com' },
      },
    },
  },
}));
// What Expo Go does when the package is imported: the native module is not there. The flag tells the
// test whether the app tried (it runs at start, before any spy could be set).
jest.mock('@react-native-google-signin/google-signin', () => {
  (globalThis as Record<string, unknown>).mockGoogleSignInRequired = true;
  throw new Error(
    "TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found. Verify that a module by this name is registered in the native binary."
  );
});
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useFocusEffect: () => undefined,
  useNavigation: () => ({ getState: () => undefined }),
}));
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(() => new Promise(() => {})), post: jest.fn(), put: jest.fn() },
}));

const withProviders = (ui: React.ReactElement) => render(<AppProviders>{ui}</AppProviders>);

it('knows it runs in Expo Go, and never tried to load Google sign-in (no error at start)', () => {
  expect(isExpoGo()).toBe(true);
  expect(firebaseAuthService.isGoogleSignInAvailable()).toBe(false);
  expect((globalThis as Record<string, unknown>).mockGoogleSignInRequired).toBeUndefined();
});

it('the root providers and the login screen start, without the Google button; e-mail sign-in stays', async () => {
  withProviders(<LoginScreen />);
  expect(await screen.findByText('WELCOME TO')).toBeTruthy();
  expect(screen.queryByText('Continue with Google')).toBeNull();
  expect(screen.getByLabelText('Email')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
});

it('the register screen starts', async () => {
  withProviders(<RegisterScreen />);
  expect(await screen.findByLabelText('Email')).toBeTruthy();
});

it('a Screen with keyboard handling renders its form', () => {
  withProviders(
    <Screen scroll keyboard footer={<Text>Footer</Text>}>
      <Input label="Name" value="" onChangeText={() => undefined} />
    </Screen>
  );
  expect(screen.getByLabelText('Name')).toBeTruthy();
  expect(screen.getByText('Footer')).toBeTruthy();
});

it('sign-out does not touch Google, and a Google sign-in says it is unavailable', async () => {
  expect(firebaseAuthService.isGoogleSignInAvailable()).toBe(false);
  await expect(firebaseAuthService.signOutProviders()).resolves.toBeUndefined();
  await expect(firebaseAuthService.signInWithGoogle()).rejects.toMatchObject({
    code: 'google/unavailable',
  });
});
