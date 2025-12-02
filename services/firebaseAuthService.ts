import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore
  getReactNativePersistence,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { config } from '../config';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: config.googleAuth.webClientId,
  offlineAccess: true,
  // Force account selection on first sign-in, then remember the account
  forceCodeForRefreshToken: true,
});

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(config.firebase) : getApp();

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e: any) {
  // If auth is already initialized, use the existing instance
  auth = getAuth(app);
}

const getAuthInstance = () => {
  return auth;
};

export interface AuthResult {
  user: User;
  idToken: string;
}

class FirebaseAuthService {
  /**
   * Sign in with Google using native Google Sign-In
   * @returns AuthResult if successful, null if user cancelled
   */
  async signInWithGoogle(): Promise<AuthResult | null> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign out first to clear any cached account and force account picker
      // This ensures users can always choose which account to use
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore errors if no account to clear
      }

      // Show account picker - users can select any Google account
      const userInfo = await GoogleSignin.signIn();

      // Check if user cancelled (no user data returned)
      if (!userInfo.data || !userInfo.data.user) {
        return null;
      }

      const idToken = userInfo.data.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase
      const userCredential = await signInWithCredential(getAuthInstance(), credential);
      const token = await userCredential.user.getIdToken();

      return {
        user: userCredential.user,
        idToken: token
      };
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.code === '-5' ||
        error.code === 'SIGN_IN_CANCELLED' ||
        error.message?.includes('Sign in action cancelled') ||
        error.message?.includes('User cancelled')) {
        // Clear any cached state so next attempt shows account picker
        try {
          await GoogleSignin.signOut();
        } catch (signOutError) {
          // Ignore sign out errors
        }
        return null;
      }

      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Sign in with Google using ID token from expo-auth-session (legacy)
   */
  async signInWithGoogleCredential(idToken: string): Promise<AuthResult> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(getAuthInstance(), credential);
      const token = await userCredential.user.getIdToken();

      return {
        user: userCredential.user,
        idToken: token
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Sign in with Apple
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
          displayName: `${appleCredential.fullName.givenName} ${appleCredential.fullName.familyName || ''}`.trim()
        });
      }

      return {
        user: userCredential.user,
        idToken: token
      };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        throw error;
      }
      throw new Error(error.message || 'Failed to sign in with Apple');
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailPassword(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(getAuthInstance(), email, password);
      const token = await userCredential.user.getIdToken();

      return {
        user: userCredential.user,
        idToken: token
      };
    } catch (error: any) {
      // Preserve the original error code from Firebase
      let errorMessage = 'Failed to sign in';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in';
      }

      // Create new error but preserve the Firebase error code
      const newError: any = new Error(errorMessage);
      newError.code = error.code;
      throw newError;
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
      const userCredential = await createUserWithEmailAndPassword(getAuthInstance(), email, password);

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const token = await userCredential.user.getIdToken();

      return {
        user: userCredential.user,
        idToken: token
      };
    } catch (error: any) {
      let errorMessage = 'Failed to create account';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use a stronger password';
          break;
        default:
          errorMessage = error.message || 'Failed to create account';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Sign out current user from both Firebase and Google
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Firebase
      await firebaseSignOut(getAuthInstance());

      // Sign out from Google Sign-In if user was signed in
      const isGoogleSignedIn = await GoogleSignin.hasPreviousSignIn();
      if (isGoogleSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuthInstance(), email);
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Check if email exists in the backend database
   * Returns true if user exists, false if not
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Use backend API to check email existence
      const response = await fetch(
        `http://100.91.176.251:8080/api/auth/check-email?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        return false;
      }

      const exists = await response.json();

      return exists;
    } catch (error: any) {
      // On error, return false (assume email doesn't exist)
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return getAuthInstance().currentUser;
  }

  /**
   * Get current user ID token
   */
  async getCurrentUserToken(): Promise<string | null> {
    const user = getAuthInstance().currentUser;
    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh current user ID token
   */
  async refreshToken(): Promise<string | null> {
    const user = getAuthInstance().currentUser;
    if (!user) return null;

    try {
      return await user.getIdToken(true);
    } catch (error) {
      return null;
    }
  }
}

export default new FirebaseAuthService();
