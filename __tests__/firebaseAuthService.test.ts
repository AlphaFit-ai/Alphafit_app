import { Platform } from 'react-native';
import firebaseAuthService from '../services/firebaseAuthService';
import { getAuthErrorKey } from '../services/authErrors';

const firebaseAuth = jest.requireMock('firebase/auth');
const AppleAuthentication = jest.requireMock('expo-apple-authentication');
const { GoogleSignin } = jest.requireMock('@react-native-google-signin/google-signin');

function firebaseError(code: string): Error & { code: string } {
  return Object.assign(new Error(`Firebase: Error (${code}).`), { code });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerWithEmail', () => {
  it('keeps the Firebase code, so the screen can handle "email already in use"', async () => {
    firebaseAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(
      firebaseError('auth/email-already-in-use')
    );

    const failure = await firebaseAuthService
      .registerWithEmail('a@b.co', 'Passw0rd', 'Ann')
      .catch((e) => e);

    expect(failure).toBeInstanceOf(Error);
    expect(failure.code).toBe('auth/email-already-in-use');
    expect(failure.message).toBe('An account with this email already exists');
  });

  it.each([
    'auth/weak-password',
    'auth/invalid-email',
    'auth/operation-not-allowed',
    'auth/network-request-failed',
  ])('keeps %s', async (code) => {
    firebaseAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(firebaseError(code));
    const failure = await firebaseAuthService.registerWithEmail('a@b.co', 'x').catch((e) => e);
    expect(failure.code).toBe(code);
  });

  it('returns the user and a fresh ID token on success', async () => {
    const user = { getIdToken: jest.fn().mockResolvedValue('id-token') };
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user });
    const result = await firebaseAuthService.registerWithEmail('a@b.co', 'Passw0rd');
    expect(result).toEqual({ user, idToken: 'id-token' });
  });
});

describe('other sign-in methods keep the code too', () => {
  it('email sign-in', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
      firebaseError('auth/invalid-credential')
    );
    const failure = await firebaseAuthService
      .signInWithEmailPassword('a@b.co', 'x')
      .catch((e) => e);
    expect(failure.code).toBe('auth/invalid-credential');
    expect(failure.message).toBe('Invalid email or password');
  });

  it('password reset', async () => {
    firebaseAuth.sendPasswordResetEmail.mockRejectedValueOnce(firebaseError('auth/user-not-found'));
    const failure = await firebaseAuthService.sendPasswordResetEmail('a@b.co').catch((e) => e);
    expect(failure.code).toBe('auth/user-not-found');
  });

  it('Apple, so the screen can stay quiet when the user backs out', async () => {
    AppleAuthentication.signInAsync.mockRejectedValueOnce(
      Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' })
    );
    const failure = await firebaseAuthService.signInWithApple().catch((e) => e);
    expect(failure.code).toBe('ERR_CANCELED');
  });
});

describe('signOutProviders', () => {
  it('signs out Firebase and Google', async () => {
    await firebaseAuthService.signOutProviders();
    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  it('still signs Google out when Firebase fails, then reports the failure', async () => {
    firebaseAuth.signOut.mockRejectedValueOnce(firebaseError('auth/network-request-failed'));
    await expect(firebaseAuthService.signOutProviders()).rejects.toMatchObject({
      code: 'auth/network-request-failed',
    });
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('waitForAuthReady', () => {
  it('resolves only after Firebase has restored the session, and returns that user', async () => {
    const order: string[] = [];
    const restored = { uid: 'u1' };
    firebaseAuth.__mockAuth.currentUser = null;
    firebaseAuth.__mockAuth.authStateReady.mockImplementationOnce(async () => {
      await Promise.resolve();
      firebaseAuth.__mockAuth.currentUser = restored; // the saved session shows up when it is ready
      order.push('ready');
    });

    const user = await firebaseAuthService.waitForAuthReady();
    order.push('returned');

    expect(user).toBe(restored);
    expect(order).toEqual(['ready', 'returned']);
    firebaseAuth.__mockAuth.currentUser = null;
  });
});

describe('Sign in with Apple', () => {
  const original = Platform.OS;
  afterEach(() => {
    jest.replaceProperty(Platform, 'OS', original);
  });

  it('is offered on iOS', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    await expect(firebaseAuthService.isAppleSignInAvailable()).resolves.toBe(true);
  });

  it('is not offered on Android, and the SDK is not even asked', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await expect(firebaseAuthService.isAppleSignInAvailable()).resolves.toBe(false);
    expect(AppleAuthentication.isAvailableAsync).not.toHaveBeenCalled();
  });
});

describe('getAuthErrorKey', () => {
  it('maps the Firebase codes the screens show to translation keys', () => {
    expect(getAuthErrorKey('auth/email-already-in-use')).toBe('authErrors.emailInUse');
    expect(getAuthErrorKey('auth/invalid-credential')).toBe('authErrors.invalidCredential');
    expect(getAuthErrorKey('auth/something-new')).toBeNull();
    expect(getAuthErrorKey(undefined)).toBeNull();
  });
});
