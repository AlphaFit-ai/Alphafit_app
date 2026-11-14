import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager } from '@tanstack/react-query';
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { AppProviders } from '../context/AppProviders';
import { useOnboarding } from '../context/OnboardingContext';
import { useProfile, useProfilePicture } from '../hooks/queries';
import { clearQueryCache, PERSIST_KEY, persistOptions, queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import { signOut } from '../services/session';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

const persist = {
  queryClient,
  persister: persistOptions.persister,
  buster: persistOptions.buster,
  dehydrateOptions: persistOptions.dehydrateOptions,
};

/** The persister writes in the background (throttled): wait until the copy is on the device. */
async function saveToDevice() {
  await persistQueryClientSave(persist);
  await waitFor(async () => expect(await AsyncStorage.getItem(PERSIST_KEY)).not.toBeNull());
}

function Probe() {
  const profile = useProfile();
  const { uri } = useProfilePicture();
  const { onboardingData } = useOnboarding();
  return (
    <>
      <Text testID="name">{profile.data?.fullName ?? 'none'}</Text>
      <Text testID="avatar">{uri ?? 'none'}</Text>
      <Text testID="goal">{onboardingData.goal ?? 'none'}</Text>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  onlineManager.setOnline(true);
  mockApi.get.mockImplementation((url: string) =>
    Promise.resolve({
      data:
        url === '/users/profile'
          ? { fullName: 'Ann' }
          : url === '/images/profile'
            ? { success: true, data: { imageUrl: 'https://img.example/ann.jpg' } }
            : { data: { goal: 'build-muscle' } },
    })
  );
});

describe('the query cache', () => {
  it('asks the api once for data several screens need', async () => {
    render(
      <AppProviders>
        <Probe />
        <Probe />
        <Probe />
      </AppProviders>
    );
    await waitFor(() => expect(screen.getAllByTestId('name')[2].props.children).toBe('Ann'));
    const calls = mockApi.get.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls.filter((u: string) => u === '/users/profile')).toHaveLength(1);
    expect(calls.filter((u: string) => u === '/images/profile')).toHaveLength(1);
  });

  it('shows the last known data from the saved copy on the device, without the api', async () => {
    queryClient.setQueryData(queryKeys.profile, { fullName: 'Cached Ann' });
    await saveToDevice();
    queryClient.clear();
    expect(queryClient.getQueryData(queryKeys.profile)).toBeUndefined();

    await persistQueryClientRestore(persist);

    expect(queryClient.getQueryData(queryKeys.profile)).toEqual({ fullName: 'Cached Ann' });
  });

  it('does not save failed queries to the device', async () => {
    await queryClient
      .fetchQuery({ queryKey: queryKeys.profile, queryFn: () => Promise.reject(new Error('boom')) })
      .catch(() => undefined);
    await persistQueryClientSave(persist);
    const saved = JSON.parse((await AsyncStorage.getItem(PERSIST_KEY)) ?? '{}');
    expect(saved.clientState?.queries ?? []).toEqual([]);
  });

  it('drops a saved copy from another version of the app instead of misreading it', async () => {
    queryClient.setQueryData(queryKeys.profile, { fullName: 'Old shape' });
    await persistQueryClientSave({ ...persist, buster: 'v0' });
    queryClient.clear();
    await persistQueryClientRestore(persist);
    expect(queryClient.getQueryData(queryKeys.profile)).toBeUndefined();
  });

  it('is shared with the wizard: an answer patched into the cache shows in every reader', async () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );
    await waitFor(() => expect(screen.getByTestId('name').props.children).toBe('Ann'));
    act(() => {
      queryClient.setQueryData(queryKeys.onboarding, { goal: 'stay-fit' });
    });
    await waitFor(() => expect(screen.getByTestId('goal').props.children).toBe('stay-fit'));
  });

  it('keeps cached data on screen and pauses queries while offline, then refetches when the network returns', async () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );
    await waitFor(() => expect(screen.getByTestId('name').props.children).toBe('Ann'));
    mockApi.get.mockClear();

    act(() => onlineManager.setOnline(false));
    await act(async () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await Promise.resolve();
    });
    expect(mockApi.get).not.toHaveBeenCalled(); // paused: no failing request
    expect(screen.getByTestId('name').props.children).toBe('Ann'); // still on screen

    act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith('/users/profile'));
  });
});

describe('sign-out and the cache', () => {
  it('wipes every cached answer, in memory and on the device, so a second user sees none of the first', async () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );
    await waitFor(() => expect(screen.getByTestId('name').props.children).toBe('Ann'));
    await saveToDevice();
    mockApi.get.mockImplementation(() => new Promise(() => undefined)); // nothing refetches after sign-out

    await act(async () => {
      await signOut();
    });

    expect(screen.getByTestId('name').props.children).toBe('none');
    expect(screen.getByTestId('avatar').props.children).toBe('none');
    expect(screen.getByTestId('goal').props.children).toBe('none');
    expect(await AsyncStorage.getItem(PERSIST_KEY)).toBeNull();
  });

  it('drops an answer that arrives after sign-out instead of putting the old user back', async () => {
    let answer: (v: unknown) => void = () => undefined;
    queryClient
      .fetchQuery({
        queryKey: queryKeys.profile,
        queryFn: () => new Promise((resolve) => (answer = resolve)),
      })
      .catch(() => undefined);
    await clearQueryCache(); // the user signs out while the request is running
    answer({ fullName: 'Previous user' });
    await Promise.resolve();
    expect(queryClient.getQueryData(queryKeys.profile)).toBeUndefined();
  });
});
