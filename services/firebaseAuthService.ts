import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth,
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

// Get Auth instance - Firebase 12.x auto-detects AsyncStorage if package is installed
// The warning can be safely ignored as persistence still works
const getAuthInstance = () => {
  return getAuth(app);
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
      console.log('Starting native Google Sign-In...');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Play Services available');
      
      // Sign out first to clear any cached account and force account picker
      // This ensures users can always choose which account to use
      try {
        await GoogleSignin.signOut();
        console.log('Cleared cached Google account');
      } catch (error) {
        console.log('No cached account to clear');
      }
      
      // Show account picker - users can select any Google account
      console.log('Showing Google Sign-In picker...');
      const userInfo = await GoogleSignin.signIn();
      
      // Check if user cancelled (no user data returned)
      if (!userInfo.data || !userInfo.data.user) {
        console.log('Google Sign-In cancelled by user (no user data)');
        return null;
      }
      
      const idToken = userInfo.data.idToken;
      console.log('User selected from picker:', userInfo.data.user.email);
      
      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }
      
      console.log('ID token received, signing in to Firebase...');
      
      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(getAuthInstance(), credential);
      const token = await userCredential.user.getIdToken();
      
      console.log('Firebase sign-in successful');
      
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
        console.log('Google Sign-In cancelled by user');
        // Clear any cached state so next attempt shows account picker
        try {
          await GoogleSignin.signOut();
        } catch (signOutError) {
          // Ignore sign out errors
        }
        return null; // Return null instead of throwing error
      }
      
      console.error('Firebase Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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
      console.error('Firebase Google sign-in error:', error);
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
      console.error('Firebase Apple sign-in error:', error);
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
      console.error('Firebase email sign-in error:', error);
      
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
      
      throw new Error(errorMessage);
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
      console.error('Firebase create user error:', error);
      
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
        console.log('Signed out from Google');
      }
      
      console.log('Sign out successful');
    } catch (error: any) {
      console.error('Sign-out error:', error);
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
      console.error('Firebase password reset error:', error);
      
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
      console.error('Failed to get user token:', error);
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
      console.error('Failed to refresh token:', error);
      return null;
    }
  }
}

export default new FirebaseAuthService();
