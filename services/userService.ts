import apiClient from './apiClient';
import { storage } from './storage';

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
  needsOnboarding?: boolean;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
}

export interface UserProfile {
  id?: string;
  _id?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  authProvider?: string;
  profileImageUrl?: string;
  onboardingData?: UserOnboardingData;
  preferences?: UserPreferences;
  subscriptionPlan?: 'FREE' | 'PREMIUM';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

class UserService {
  // Authentication endpoints - All auth handled through Firebase ID tokens

  /**
   * Authenticate user with Firebase token
   */
  async authenticateUser(firebaseIdToken: string, provider?: 'google' | 'apple' | 'email'): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/firebase', {
      idToken: firebaseIdToken,
      provider: provider
    });

    if (response.data.token) {
      await storage.setItem('authToken', response.data.token);
      await storage.setItem('userId', response.data.userId);
    }

    return response.data;
  }

  /**
   * Check if email exists in the system
   * Returns true if user is registered, false otherwise
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const response = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return response.data;
  }

  /**
   * Legacy email/password registration (for backward compatibility)
   * Prefer using Firebase auth with authenticateUser instead
   */
  async registerWithEmail(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      fullName
    });

    if (response.data.token) {
      await storage.setItem('authToken', response.data.token);
      await storage.setItem('userId', response.data.userId);
    }

    return response.data;
  }

  /**
   * Legacy email/password login (for backward compatibility)
   * Prefer using Firebase auth with authenticateUser instead
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });

    if (response.data.token) {
      await storage.setItem('authToken', response.data.token);
      await storage.setItem('userId', response.data.userId);
    }

    return response.data;
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

  // Deactivate account
  async deactivateAccount(confirmationText: string): Promise<void> {
    await apiClient.post('/users/deactivate', { confirmationText });
  }

  // Logout
  async logout(): Promise<void> {
    await storage.removeItem('authToken');
    await storage.removeItem('userId');
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem('authToken');
    return !!token;
  }
}

export default new UserService();
