import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Appearance } from 'react-native';
import { AppProviders } from '../context/AppProviders';
import { useDiet } from '../context/DietContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useProjection } from '../context/ProjectionContext';
import { useTheme } from '../context/ThemeContext';
import { queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import { tokenStore } from '../services/tokenStore';
import {
  getSessionEpoch,
  isSessionCurrent,
  registerSessionResetter,
  signOut,
} from '../services/session';
import { THEME_STORAGE_KEY, USER_ID_KEY } from '../services/storageKeys';

// The api client is replaced so saving a diet answer does not need a network.
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const firebaseAuth = jest.requireMock('firebase/auth');
const { GoogleSignin } = jest.requireMock('@react-native-google-signin/google-signin');

type Stores = {
  onboarding: ReturnType<typeof useOnboarding>;
  diet: ReturnType<typeof useDiet>;
  projection: ReturnType<typeof useProjection>;
  theme: ReturnType<typeof useTheme>;
};

function renderStores() {
  const ref: { current: Stores | null } = { current: null };
  function Probe() {
    ref.current = {
      onboarding: useOnboarding(),
      diet: useDiet(),
      projection: useProjection(),
      theme: useTheme(),
    };
    return null;
  }
  render(
    <AppProviders>
      <Probe />
    </AppProviders>
  );
  return ref as { current: Stores };
}

/** Everything one user leaves on the phone. */
async function fillAsFirstUser(stores: { current: Stores }) {
  await tokenStore.save('token-of-user-one', 'user-one');
  await act(async () => {
    stores.current.onboarding.updateOnboardingData({
      email: 'one@example.com',
      goal: 'build-muscle',
    });
    stores.current.onboarding.setCurrentStep(7);
    await stores.current.diet.updateDietData({
      dietPreference: 'vegan',
      mealsPerDay: 4,
      scanId: 'scan-1',
    });
    stores.current.diet.setCurrentStep(4);
    await stores.current.projection.updateProjectionData({
      sleepHours: '7-8',
      dailySteps: '7-10k',
    });
    stores.current.theme.setTheme('dark', { sync: false });
  });
  queryClient.setQueryData(queryKeys.avatar, 'https://img.example/one.jpg');
  queryClient.setQueryData(queryKeys.profile, { fullName: 'User One' });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
});

describe('signOut', () => {
  it('clears the token, every store, the theme, the avatar, Firebase and Google', async () => {
    const stores = renderStores();
    await fillAsFirstUser(stores);

    // The first user's data is really there before signing out.
    expect(stores.current.onboarding.onboardingData.goal).toBe('build-muscle');
    expect(stores.current.diet.dietData.dietPreference).toBe('vegan');
    expect(stores.current.projection.projectionData.sleepHours).toBe('7-8');
    expect(stores.current.theme.isDarkMode).toBe(true);
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(queryClient.getQueryData(queryKeys.avatar)).toBe('https://img.example/one.jpg');

    await act(async () => {
      await signOut();
    });

    // Stored credentials
    expect(await tokenStore.getToken()).toBeNull();
    expect(await jest.requireMock('expo-secure-store').getItemAsync(USER_ID_KEY)).toBeNull();
    // Contexts are back to their defaults
    expect(stores.current.onboarding.onboardingData).toEqual({});
    expect(stores.current.onboarding.currentStep).toBe(0);
    expect(stores.current.diet.dietData.dietPreference).toBeUndefined();
    expect(stores.current.diet.dietData.mealsPerDay).toBeUndefined();
    expect(stores.current.diet.dietData.scanId).toBeUndefined();
    expect(stores.current.diet.currentStep).toBe(0);
    expect(stores.current.projection.projectionData.sleepHours).toBeUndefined();
    expect(stores.current.projection.projectionData.dailySteps).toBeUndefined();
    // Theme: the phone's own setting, nothing saved
    expect(stores.current.theme.isDarkMode).toBe(false);
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    // Avatar
    expect(queryClient.getQueryData(queryKeys.avatar)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.profile)).toBeUndefined();
    // Identity providers
    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  it('leaves nothing of the first user for a second user', async () => {
    const stores = renderStores();
    await fillAsFirstUser(stores);
    await act(async () => {
      await signOut();
    });

    // A second person signs in on the same phone and answers one question.
    await act(async () => {
      stores.current.onboarding.updateOnboardingData({ source: 'tiktok' });
    });

    await waitFor(() =>
      expect(stores.current.onboarding.onboardingData).toEqual({ source: 'tiktok' })
    );
    expect(stores.current.diet.dietData.dietPreference).toBeUndefined();
    expect(stores.current.projection.projectionData.sleepHours).toBeUndefined();
    expect(await tokenStore.getToken()).toBeNull();
  });

  it('still clears everything and signs Google out when Firebase fails', async () => {
    const stores = renderStores();
    await fillAsFirstUser(stores);
    firebaseAuth.signOut.mockRejectedValueOnce(
      Object.assign(new Error('offline'), { code: 'auth/network-request-failed' })
    );
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await act(async () => {
      await expect(signOut()).resolves.toBeUndefined();
    });

    expect(await tokenStore.getToken()).toBeNull();
    expect(stores.current.onboarding.onboardingData.goal).toBeUndefined();
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('keeps going when one store fails to reset', async () => {
    const stores = renderStores();
    await fillAsFirstUser(stores);
    const unregister = registerSessionResetter(() => {
      throw new Error('broken store');
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await act(async () => {
      await signOut();
    });

    expect(stores.current.diet.dietData.dietPreference).toBeUndefined();
    expect(GoogleSignin.signOut).toHaveBeenCalled();
    unregister();
    consoleError.mockRestore();
  });

  it('only calls Google when a Google session exists', async () => {
    GoogleSignin.hasPreviousSignIn.mockReturnValueOnce(false);
    renderStores();
    await act(async () => {
      await signOut();
    });
    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signOut).not.toHaveBeenCalled();
  });

  it('invalidates requests that were still running, so their answers cannot refill the stores', async () => {
    renderStores();
    const epoch = getSessionEpoch();
    expect(isSessionCurrent(epoch)).toBe(true);
    await act(async () => {
      await signOut();
    });
    expect(isSessionCurrent(epoch)).toBe(false);
    expect(isSessionCurrent(getSessionEpoch())).toBe(true);
  });
});
