import apiClient from './apiClient';
import { tokenStore } from './tokenStore';

export interface UserOnboardingData {
  fullName?: string;
  email?: string;
  authProvider?: 'google' | 'apple' | 'email';
  source?: 'instagram' | 'facebook' | 'tiktok' | 'threads' | 'x' | 'youtube' | 'google' | 'others';
  /** `month` is 1 to 12. Builds before 2026-11 stored 0 to 11; see `services/dateOfBirth.ts`. */
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

/** Flat body of `POST /auth/firebase` (CONTRACTS section 2). */
export interface AuthResponse {
  token: string;
  userId: string;
  user?: UserProfile;
  needsOnboarding?: boolean;
  message?: string;
}

class UserService {
  // Authentication: every sign-in method ends in a Firebase ID token exchanged here for an api token.

  /**
   * Exchange a Firebase ID token for an api token and store it.
   */
  async authenticateUser(
    firebaseIdToken: string,
    provider?: 'google' | 'apple' | 'email'
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/firebase', {
      idToken: firebaseIdToken,
      provider: provider,
    });

    if (response.data.token) {
      await tokenStore.save(response.data.token, response.data.userId);
    }

    return response.data;
  }

  /**
   * Check if email exists in the system
   * Returns true if user is registered, false otherwise
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const response = await apiClient.get<boolean>(
      `/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return response.data;
  }

  /** Email a 6-digit code to confirm an address before registering (`POST /auth/send-verification-code`). */
  async sendVerificationCode(email: string): Promise<void> {
    await apiClient.post('/auth/send-verification-code', { email });
  }

  /**
   * Check the code the user typed. The api answers 400 for a wrong code; any other failure rejects,
   * so a network problem is not reported as "wrong code".
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const response = await apiClient.post<boolean>('/auth/verify-code', { email, code });
      return response.data !== false;
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 400) return false;
      throw error;
    }
  }

  // User profile endpoints
  async getUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/profile', data);
    return response.data;
  }

  /**
   * Deactivate the account on the server. The caller then calls `signOut()` to clear the device.
   */
  async deactivateAccount(confirmationText: string): Promise<void> {
    await apiClient.post('/users/deactivate', { confirmationText });
  }
}

export default new UserService();
