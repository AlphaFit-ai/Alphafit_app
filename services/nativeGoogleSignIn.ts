import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com', // From Firebase Console
  iosClientId: '972624920920-s0r51ubufl4271hublj74bni1rdmei90.apps.googleusercontent.com', // iOS client ID
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export const nativeGoogleSignIn = {
  /**
   * Sign in with native Google Sign-In
   * Returns the ID token for Firebase authentication
   */
  signIn: async (): Promise<string> => {
    try {
      // Check if device supports Google Play Services (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();

      // Get ID token for Firebase
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      return idToken;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw new Error(error.message || 'Google Sign-In failed');
      }
    }
  },

  /**
   * Sign out from Google
   */
  signOut: async (): Promise<void> => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  },

  /**
   * Get current user info (returns null if not signed in)
   */
  getCurrentUser: async () => {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      return null;
    }
  },
};
