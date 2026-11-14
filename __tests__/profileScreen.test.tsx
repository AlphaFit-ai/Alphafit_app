import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import ProfileScreen from '../app/(tabs)/profile';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';
import { queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import { USER_ID_KEY } from '../services/storageKeys';
import { tokenStore } from '../services/tokenStore';

const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useRouter: () => mockRouter,
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));
const mockExpoRouter = jest.requireMock('expo-router').router;

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

const firebaseAuth = jest.requireMock('firebase/auth');
const { GoogleSignin } = jest.requireMock('@react-native-google-signin/google-signin');

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const httpError = (status: number) =>
  new AxiosError(
    'failed',
    'ERR_BAD_RESPONSE',
    config,
    {},
    { status, statusText: '', data: {}, headers: {}, config }
  );

const profile = { fullName: 'Ann Example', email: 'ann@example.com', subscriptionPlan: 'FREE' };

function answerApi(handler: (url: string) => unknown) {
  mockApi.get.mockImplementation((url: string) => {
    const answer = handler(url);
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve({ data: answer });
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  await tokenStore.save('token-of-ann', 'ann');
  answerApi((url) =>
    url === '/users/profile' ? profile : { success: true, data: { imageUrl: null } }
  );
});

function renderProfile() {
  return render(
    <AppProviders>
      <ProfileScreen />
    </AppProviders>
  );
}

describe('ProfileScreen', () => {
  it('shows the profile that was loaded', async () => {
    renderProfile();
    expect(await screen.findByText('Ann Example')).toBeTruthy();
    expect(screen.getByText('ann@example.com')).toBeTruthy();
  });

  describe('no placeholder flashes', () => {
    it('does not show the empty "Add Photo" slot while the picture is still being looked up', async () => {
      let answerPicture!: (value: unknown) => void;
      mockApi.get.mockImplementation((url: string) =>
        url === '/users/profile'
          ? Promise.resolve({ data: profile })
          : new Promise((resolve) => (answerPicture = resolve))
      );
      renderProfile();
      await screen.findByText('Ann Example');
      expect(screen.queryByText('Add Photo')).toBeNull();

      // The answer is "no picture yet": only now is the empty slot the truth.
      await act(async () => answerPicture({ data: { success: false } }));
      expect(await screen.findByText('Add Photo')).toBeTruthy();
    });

    it('keeps the profile on screen while it refreshes in the background', async () => {
      queryClient.setQueryData(queryKeys.profile, profile, { updatedAt: Date.now() - 120_000 });
      let answerProfile!: (value: unknown) => void;
      mockApi.get.mockImplementation((url: string) =>
        url === '/users/profile'
          ? new Promise((resolve) => (answerProfile = resolve))
          : Promise.resolve({ data: { success: true, data: { imageUrl: null } } })
      );
      renderProfile();

      // The cached copy shows at once, with no loading placeholder, while the request is running.
      expect(screen.getByText('Ann Example')).toBeTruthy();
      expect(screen.queryByLabelText('Loading...')).toBeNull();

      await act(async () => answerProfile({ data: { ...profile, fullName: 'Ann Updated' } }));
      expect(await screen.findByText('Ann Updated')).toBeTruthy();
    });

    it('shows a loading placeholder, not the "User" fallback name, on the very first load', async () => {
      mockApi.get.mockImplementation(() => new Promise(() => undefined));
      renderProfile();
      expect(screen.getByLabelText('Loading...')).toBeTruthy();
      expect(screen.queryByText('User')).toBeNull();
    });
  });

  it('shows an error with a retry, not a blank profile, when it cannot be loaded', async () => {
    answerApi(() => new AxiosError('Network Error', 'ERR_NETWORK', config, {}));
    renderProfile();
    expect(await screen.findByText('Try again')).toBeTruthy();
    expect(screen.queryByText('Ann Example')).toBeNull();
  });

  it('shows the retry state on a 401 and does not sign out by itself: the api client does that after it fails to renew the token', async () => {
    answerApi(() => httpError(401));
    renderProfile();
    expect(await screen.findByText('Try again')).toBeTruthy();
    expect(firebaseAuth.signOut).not.toHaveBeenCalled();
  });

  it('logout clears the token, Firebase and Google, then shows the login screen', async () => {
    renderProfile();
    await screen.findByText('Ann Example');

    fireEvent.press(screen.getByLabelText('Logout'));
    const buttons = await screen.findAllByText('Logout');
    fireEvent.press(buttons[buttons.length - 1]); // the confirm button of the dialog

    await waitFor(() => expect(mockExpoRouter.replace).toHaveBeenCalledWith('/'));
    expect(await tokenStore.getToken()).toBeNull();
    expect(await jest.requireMock('expo-secure-store').getItemAsync(USER_ID_KEY)).toBeNull();
    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  describe('delete account', () => {
    async function openDeleteDialog() {
      renderProfile();
      await screen.findByText('Ann Example');
      fireEvent.press(screen.getByLabelText('Delete Account'));
      return screen.findByPlaceholderText('Delete my account');
    }

    it('deactivates the account with the exact phrase, then signs out like logout does', async () => {
      mockApi.post.mockResolvedValue({ data: {} });
      const input = await openDeleteDialog();

      fireEvent.changeText(input, 'Delete my account');
      fireEvent.press(screen.getByText('Delete'));

      await waitFor(() =>
        expect(mockApi.post).toHaveBeenCalledWith('/users/deactivate', {
          confirmationText: 'Delete my account',
        })
      );
      await waitFor(() => expect(mockExpoRouter.replace).toHaveBeenCalledWith('/'));
      expect(await tokenStore.getToken()).toBeNull();
      expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
      expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the phrase is wrong', async () => {
      const input = await openDeleteDialog();

      fireEvent.changeText(input, 'delete');
      fireEvent.press(screen.getByText('Delete'));

      expect(await screen.findByText('Invalid Confirmation')).toBeTruthy();
      expect(mockApi.post).not.toHaveBeenCalled();
      expect(await tokenStore.getToken()).toBe('token-of-ann');
    });

    it('keeps the user signed in and says so when the account could not be deleted', async () => {
      mockApi.post.mockRejectedValue(httpError(500));
      const input = await openDeleteDialog();

      fireEvent.changeText(input, 'Delete my account');
      fireEvent.press(screen.getByText('Delete'));

      expect(await screen.findByText('Delete Account Failed')).toBeTruthy();
      expect(await tokenStore.getToken()).toBe('token-of-ann');
      expect(firebaseAuth.signOut).not.toHaveBeenCalled();
      expect(mockExpoRouter.replace).not.toHaveBeenCalled();
    });
  });
});
