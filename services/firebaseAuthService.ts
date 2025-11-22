import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthResult {
  user: User;
  idToken: string;
}

class FirebaseAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Register with Email and Password
   */
  async registerWithEmail(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name if provided
      if (fullName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
      }

      const idToken = await userCredential.user.getIdToken();
      
      return {
        user: userCredential.user,
        idToken
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with Email and Password
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      return {
        user: userCredential.user,
        idToken
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      // This will be implemented with expo-auth-session
      // For now, throwing not implemented
      throw new Error('Google Sign-In requires additional setup. Use the Google Sign-In button component.');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Complete Google Sign-In with credential
   */
  async signInWithGoogleCredential(idToken: string): Promise<AuthResult> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const token = await userCredential.user.getIdToken();
      
      return {
        user: userCredential.user,
        idToken: token
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<AuthResult> {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName } = credential;
      
      if (!identityToken) {
        throw new Error('Apple Sign-In failed: No identity token');
      }

      const provider = new OAuthProvider('apple.com');
      const authCredential = provider.credential({
        idToken: identityToken,
      });

      const userCredential = await signInWithCredential(auth, authCredential);
      
      // Update profile with name from Apple if available
      if (fullName && userCredential.user) {
        const displayName = `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim();
        if (displayName) {
          await updateProfile(userCredential.user, {
            displayName
          });
        }
      }

      const idToken = await userCredential.user.getIdToken();
      
      return {
        user: userCredential.user,
        idToken
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send verification code to phone number
   */
  async sendPhoneVerificationCode(phoneNumber: string): Promise<string> {
    try {
      // Note: Phone auth with Firebase requires additional setup
      // This is a placeholder for the implementation
      throw new Error('Phone authentication requires additional setup with Firebase and your app configuration');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify phone number with code
   */
  async verifyPhoneCode(verificationId: string, code: string): Promise<AuthResult> {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();
      
      return {
        user: userCredential.user,
        idToken
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get current user ID token
   */
  async getCurrentUserIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      return await user.getIdToken(forceRefresh);
    } catch (error: any) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Handle Firebase Auth errors
   */
  private handleAuthError(error: any): Error {
    let message = 'An authentication error occurred';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'This operation is not allowed';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
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
        message = 'Invalid credentials provided';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with the same email but different sign-in credentials';
        break;
      case 'auth/invalid-verification-code':
        message = 'Invalid verification code';
        break;
      case 'auth/invalid-verification-id':
        message = 'Invalid verification ID';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

export default new FirebaseAuthService();
