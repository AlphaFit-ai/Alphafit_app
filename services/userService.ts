import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import firebaseAuthService from './firebaseAuthService';

export interface UserOnboardingData {
  fullName?: string;
  email?: string;
  authProvider?: 'google' | 'apple' | 'email';
  source?: 'instagram' | 'facebook' | 'tiktok' | 'threads' | 'x' | 'youtube' | 'google' | 'others';
  dateOfBirth?: {
    month: number;
    day: number;
    year: number;
  };
  gender?: 'male' | 'female';
  height?: {
    value: number;
    unit: 'imperial' | 'metric';
    feet?: number;
    inches?: number;
    cm?: number;
  };
  weight?: {
    value: number;
    unit: 'imperial' | 'metric';
    lbs?: number;
    kg?: number;
  };
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  activityLevel?: 'low' | 'medium' | 'high';
  workoutsPerWeek?: '0-2' | '3-5' | '6+';
  equipment?: 'full-gym' | 'dumbbells-barbell' | 'bodyweight-only';
  goal?: 'lose-fat' | 'get-stronger' | 'build-muscle' | 'stay-fit';
  currentPhysique?: number;
  projectedPhysique?: number;
}

export interface AuthResponse {
  token: string;
  userId: string;
  user: any;
}

export interface UserProfile extends UserOnboardingData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

class UserService {
  // Authentication endpoints
  async registerWithEmail(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      // First, authenticate with Firebase
      const firebaseResult = await firebaseAuthService.registerWithEmail(email, password, fullName);
      
      // Then, register with backend using Firebase ID token
      const response = await apiClient.post('/auth/register', { 
        firebaseToken: firebaseResult.idToken,
        email,
        fullName 
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.userId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      // First, authenticate with Firebase
      const firebaseResult = await firebaseAuthService.loginWithEmail(email, password);
      
      // Then, authenticate with backend using Firebase ID token
      const response = await apiClient.post('/auth/login', { 
        firebaseToken: firebaseResult.idToken 
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.userId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      // Authenticate with Firebase Google
      const firebaseResult = await firebaseAuthService.signInWithGoogle();
      
      // Then, authenticate with backend using Firebase ID token
      const response = await apiClient.post('/auth/google', { 
        firebaseToken: firebaseResult.idToken 
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.userId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async loginWithApple(): Promise<AuthResponse> {
    try {
      // Authenticate with Firebase Apple
      const firebaseResult = await firebaseAuthService.signInWithApple();
      
      // Then, authenticate with backend using Firebase ID token
      const response = await apiClient.post('/auth/apple', { 
        firebaseToken: firebaseResult.idToken 
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.userId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Onboarding data submission
  async submitOnboardingData(data: UserOnboardingData): Promise<UserProfile> {
    const response = await apiClient.post('/users/onboarding', data);
    return response.data;
  }

  async updateOnboardingData(data: Partial<UserOnboardingData>): Promise<UserProfile> {
    const response = await apiClient.patch('/users/onboarding', data);
    return response.data;
  }

  // User profile endpoints
  async getUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  }

  // Logout
  async logout(): Promise<void> {
    await firebaseAuthService.signOut();
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
  }
  
  // Password Reset
  async sendPasswordResetEmail(email: string): Promise<void> {
    await firebaseAuthService.sendPasswordResetEmail(email);
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }
}

export default new UserService();
