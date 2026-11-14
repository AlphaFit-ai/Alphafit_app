import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  // @ts-ignore: only the React Native build of firebase/auth exports this
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { config } from '../config';
import { getGoogleSignin } from './nativeModules';

// Configure Google Sign-In now, as before, where the binary has it (not in Expo Go: see nativeModules).
getGoogleSignin();

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(config.firebase) : getApp();

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // If auth is already initialized, use the existing instance
  auth = getAuth(app);
}

const getAuthInstance = () => auth;

export interface AuthResult {
  user: User;
  idToken: string;
}

export type AuthProviderName = 'google' | 'apple' | 'email';

/**
 * An error with a user-facing message that still carries the original Firebase code
 * (`auth/email-already-in-use`, `auth/weak-password`, ...), so a screen can branch on `error.code`.
 */
export class AuthError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

function toAuthError(error: unknown, fallback: string, message?: string): AuthError {
  const source = (error ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof source.code === 'string' ? source.code : undefined;
  const original = typeof source.message === 'string' && source.message ? source.message : fallback;
  return new AuthError(message ?? original, code);
}

class FirebaseAuthService {
  /**
   * Resolves once Firebase has restored the persisted session from storage. Reading `currentUser`
   * before this point returns null for a user who is in fact signed in.
   */
  async waitForAuthReady(): Promise<User | null> {
    const instance = getAuthInstance();
    await instance.authStateReady();
    return instance.currentUser;
  }

  /** Sign in with Apple is offered on iOS only. */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  /** Google sign-in needs its native module, which Expo Go does not have; the button is hidden then. */
  isGoogleSignInAvailable(): boolean {
    return getGoogleSignin() !== null;
  }

  /**
   * @returns AuthResult if successful, null if user cancelled
   */
  async signInWithGoogle(): Promise<AuthResult | null> {
    const GoogleSignin = getGoogleSignin();
    if (!GoogleSignin) {
      throw new AuthError(
        'Google sign-in is not available in this app build',
        'google/unavailable'
      );
    }
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign out first to clear any cached account and force account picker
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore errors if no account to clear
      }

      // Show account picker
      const userInfo = await GoogleSignin.signIn();

      // Check if user cancelled
      if (!userInfo.data || !userInfo.data.user) {
        return null;
      }

      const idToken = userInfo.data.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(getAuthInstance(), credential);
      const token = await userCredential.user.getIdToken();

      return { user: userCredential.user, idToken: token };
    } catch (error: unknown) {
      const source = (error ?? {}) as { code?: unknown; message?: unknown };
      const message = typeof source.message === 'string' ? source.message : '';
      // Handle user cancellation gracefully
      if (
        source.code === '-5' ||
        source.code === 'SIGN_IN_CANCELLED' ||
        message.includes('Sign in action cancelled') ||
        message.includes('User cancelled')
      ) {
        // Clear any cached state so next attempt shows account picker
        try {
          await GoogleSignin.signOut();
        } catch {
          // Ignore sign out errors
        }
        return null;
      }

      throw toAuthError(error, 'Failed to sign in with Google');
    }
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple(): Promise<AuthResult> {
    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = appleCredential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
      });

      const userCredential = await signInWithCredential(getAuthInstance(), credential);
      const token = await userCredential.user.getIdToken();

      // Update profile with Apple name if available
      if (appleCredential.fullName?.givenName) {
        await updateProfile(userCredential.user, {
          displayName:
            `${appleCredential.fullName.givenName} ${appleCredential.fullName.familyName || ''}`.trim(),
        });
      }

      return { user: userCredential.user, idToken: token };
    } catch (error: unknown) {
      // The code (`ERR_CANCELED`) is preserved so the caller can stay quiet when the user backs out.
      throw toAuthError(error, 'Failed to sign in with Apple');
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailPassword(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(getAuthInstance(), email, password);
      const token = await userCredential.user.getIdToken();

      return { user: userCredential.user, idToken: token };
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      let message: string | undefined;

      switch (code) {
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/invalid-credential':
          message = 'Invalid email or password';
          break;
      }

      throw toAuthError(error, 'Failed to sign in', message);
    }
  }

  /**
   * Create account with email and password
   */
  async registerWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        getAuthInstance(),
        email,
        password
      );

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const token = await userCredential.user.getIdToken();

      return { user: userCredential.user, idToken: token };
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      let message: string | undefined;

      switch (code) {
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          message = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Please use a stronger password';
          break;
      }

      // The code survives, so the registration screen can tell "email already in use" apart.
      throw toAuthError(error, 'Failed to create account', message);
    }
  }

  /**
   * Sign the Firebase user and the Google session out. Both are always attempted, even if the first
   * fails. Do not call this from screens: use `signOut()` from `services/session`, which also clears
   * the stored token and every in-memory store.
   */
  async signOutProviders(): Promise<void> {
    const failures: unknown[] = [];

    try {
      await firebaseSignOut(getAuthInstance());
    } catch (error) {
      failures.push(error);
    }

    try {
      const GoogleSignin = getGoogleSignin();
      if (GoogleSignin && (await GoogleSignin.hasPreviousSignIn())) {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      failures.push(error);
    }

    if (failures.length > 0) {
      throw toAuthError(failures[0], 'Failed to sign out');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuthInstance(), email);
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      let message: string | undefined;

      switch (code) {
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email';
          break;
      }

      throw toAuthError(error, 'Failed to send password reset email', message);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return getAuthInstance().currentUser;
  }

  /**
   * The Firebase ID token of the signed-in user. `forceRefresh` asks Firebase for a fresh one.
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = getAuthInstance().currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }

  /** Which sign-in method the current Firebase user used, in the names the api expects. */
  getSignInProvider(user: User | null = getAuthInstance().currentUser): AuthProviderName {
    const id = user?.providerData?.[0]?.providerId;
    if (id === 'google.com') return 'google';
    if (id === 'apple.com') return 'apple';
    return 'email';
  }
}

export default new FirebaseAuthService();
