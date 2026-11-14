import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import LoginScreen from '../app/onboarding/login';
import RegisterScreen from '../app/onboarding/register';
import { AppProviders } from '../context/AppProviders';
import { sessionStore } from '../services/sessionStore';
import '../i18n/config';

const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: () => undefined,
}));

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('../services/userService', () => ({
  __esModule: true,
  default: {
    checkEmailExists: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
    authenticateUser: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deactivateAccount: jest.fn(),
  },
}));

jest.mock('../services/firebaseAuthService', () => ({
  __esModule: true,
  default: {
    isAppleSignInAvailable: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signInWithEmailPassword: jest.fn(),
    registerWithEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signOutProviders: jest.fn(),
  },
}));

jest.mock('../services/bootstrap', () => ({
  ...jest.requireActual('../services/bootstrap'),
  completeSignIn: jest.fn(),
}));

const firebaseService = jest.requireMock('../services/firebaseAuthService').default;
const userService = jest.requireMock('../services/userService').default;
const mockCompleteSignIn = jest.requireMock('../services/bootstrap').completeSignIn as jest.Mock;

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK', config, {});
const firebaseError = (code: string) => Object.assign(new Error(`Firebase: ${code}`), { code });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  firebaseService.isAppleSignInAvailable.mockResolvedValue(false);
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

describe('LoginScreen', () => {
  it('shows the Apple button only where Sign in with Apple exists (iOS)', async () => {
    firebaseService.isAppleSignInAvailable.mockResolvedValue(false);
    const android = renderWithProviders(<LoginScreen />);
    await waitFor(() => expect(firebaseService.isAppleSignInAvailable).toHaveBeenCalled());
    expect(screen.queryByText('Continue with Apple')).toBeNull();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    android.unmount();

    firebaseService.isAppleSignInAvailable.mockResolvedValue(true);
    renderWithProviders(<LoginScreen />);
    expect(await screen.findByText('Continue with Apple')).toBeTruthy();
  });

  it('continues to where onboarding stopped after a Google sign-in', async () => {
    firebaseService.signInWithGoogle.mockResolvedValue({
      user: { email: 'ann@example.com' },
      idToken: 'firebase-id-token',
    });
    mockCompleteSignIn.mockResolvedValue({
      data: { source: 'google' },
      route: '/onboarding/age',
      step: 1,
      complete: false,
      profile: { email: 'ann@example.com', preferences: { language: 'en', theme: 'light' } },
    });
    renderWithProviders(<LoginScreen />);

    fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(sessionStore.getState()).toMatchObject({
      status: 'onboarding',
      resumeRoute: '/onboarding/age',
    });
    expect(mockCompleteSignIn).toHaveBeenCalledWith('firebase-id-token', 'google');
  });

  it('offers a retry when the onboarding data cannot be loaded, and does not start onboarding', async () => {
    firebaseService.signInWithGoogle.mockResolvedValue({
      user: { email: 'ann@example.com' },
      idToken: 'firebase-id-token',
    });
    mockCompleteSignIn.mockRejectedValueOnce(networkError());
    renderWithProviders(<LoginScreen />);

    fireEvent.press(screen.getByText('Continue with Google'));

    // The failure is a dialog with the reason and a retry, not a silent "new user".
    expect(await screen.findByText('Error')).toBeTruthy();
    expect(
      screen.getByText('You seem to be offline. Check your connection and try again.')
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/onboarding/source');
    expect(mockRouter.replace).not.toHaveBeenCalled();

    // The user taps "Try again" and this time it works.
    mockCompleteSignIn.mockResolvedValueOnce({
      data: null,
      route: '/onboarding/source',
      step: 0,
      complete: false,
    });
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(sessionStore.getState()).toMatchObject({
      status: 'onboarding',
      resumeRoute: '/onboarding/source',
    });
  });

  it('says nothing when the user closes the Google account picker', async () => {
    firebaseService.signInWithGoogle.mockResolvedValue(null);
    renderWithProviders(<LoginScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));
    await waitFor(() => expect(firebaseService.signInWithGoogle).toHaveBeenCalled());
    expect(screen.queryByText('Error')).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('signs in with e-mail and password without any robot-check step', async () => {
    userService.checkEmailExists.mockResolvedValue(true);
    firebaseService.signInWithEmailPassword.mockResolvedValue({
      user: { email: 'ann@example.com' },
      idToken: 'firebase-id-token',
    });
    mockCompleteSignIn.mockResolvedValue({
      data: {},
      route: '/(tabs)/home',
      step: 9,
      complete: true,
      profile: { email: 'ann@example.com' },
    });
    renderWithProviders(<LoginScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), 'ann@example.com');
    fireEvent.press(screen.getByText('Continue'));

    fireEvent.changeText(await screen.findByPlaceholderText('Enter your password'), 'secret1');
    expect(screen.queryByText(/not a robot/i)).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() =>
      expect(firebaseService.signInWithEmailPassword).toHaveBeenCalledWith(
        'ann@example.com',
        'secret1'
      )
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
  });

  it('tells the user when there is no account for the e-mail', async () => {
    userService.checkEmailExists.mockResolvedValue(false);
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), 'new@example.com');
    fireEvent.press(screen.getByText('Continue'));

    expect(
      await screen.findByText('No account found with this email. Please sign up first.')
    ).toBeTruthy();
  });
});

describe('RegisterScreen', () => {
  async function fillAndSubmitForm() {
    userService.checkEmailExists.mockResolvedValue(false);
    userService.sendVerificationCode.mockResolvedValue(undefined);
    renderWithProviders(<RegisterScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your name'), 'Ann Example');
    fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), 'ann@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Min. 8 characters'), 'Passw0rdX');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'Passw0rdX');
    fireEvent.press(screen.getByText(/I agree to the/));
    fireEvent.press(screen.getByText('Create Account'));
    await waitFor(() => expect(userService.sendVerificationCode).toHaveBeenCalled());
  }

  async function submitCode() {
    userService.verifyCode.mockResolvedValue(true);
    fireEvent.changeText(await screen.findByPlaceholderText('000000'), '123456');
    fireEvent.press(screen.getByText('Verify & Create Account'));
  }

  it('handles "email already in use" by its Firebase code', async () => {
    await fillAndSubmitForm();
    firebaseService.registerWithEmail.mockRejectedValue(
      Object.assign(new Error('An account with this email already exists'), {
        code: 'auth/email-already-in-use',
      })
    );

    await submitCode();

    expect(await screen.findByText('Registration Error')).toBeTruthy();
    expect(
      screen.getByText('This email is already registered. Please log in instead.')
    ).toBeTruthy();
    expect(mockCompleteSignIn).not.toHaveBeenCalled();
  });

  it('handles a weak password by its Firebase code', async () => {
    await fillAndSubmitForm();
    firebaseService.registerWithEmail.mockRejectedValue(firebaseError('auth/weak-password'));

    await submitCode();

    expect(await screen.findByText('Registration Error')).toBeTruthy();
    expect(screen.getByText('Password is too weak. Please use a stronger password.')).toBeTruthy();
  });

  it('does not report a wrong code as a network problem, nor a network problem as a wrong code', async () => {
    await fillAndSubmitForm();
    userService.verifyCode.mockResolvedValueOnce(false);
    fireEvent.changeText(await screen.findByPlaceholderText('000000'), '123456');
    fireEvent.press(screen.getByText('Verify & Create Account'));
    expect(await screen.findByText('Invalid verification code')).toBeTruthy();
    expect(firebaseService.registerWithEmail).not.toHaveBeenCalled();

    userService.verifyCode.mockRejectedValueOnce(networkError());
    fireEvent.press(screen.getByText('Verify & Create Account'));
    expect(await screen.findByText('Registration Error')).toBeTruthy();
    expect(
      screen.getByText('You seem to be offline. Check your connection and try again.')
    ).toBeTruthy();
  });

  it('continues to onboarding after a successful registration', async () => {
    await fillAndSubmitForm();
    firebaseService.registerWithEmail.mockResolvedValue({
      user: { email: 'ann@example.com' },
      idToken: 'new-id-token',
    });
    mockCompleteSignIn.mockResolvedValue({
      data: null,
      route: '/onboarding/source',
      step: 0,
      complete: false,
    });

    await submitCode();

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(sessionStore.getState()).toMatchObject({
      status: 'onboarding',
      resumeRoute: '/onboarding/source',
    });
    expect(mockCompleteSignIn).toHaveBeenCalledWith('new-id-token', 'email');
  });
});
