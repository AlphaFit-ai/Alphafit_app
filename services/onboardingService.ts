import apiClient from './apiClient';

export interface OnboardingData {
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
  // Diet onboarding data
  dietPreference?: 'vegetarian' | 'vegan' | 'non-veg' | 'flexible';
  allergies?: string;
  hasAllergies?: boolean;
  mealsPerDay?: number;
  supplements?: string;
  takesSupplements?: boolean;
  foodImage?: string;
  // Projection onboarding data
  sleepHours?: string;
  dailySteps?: string;
  stressLevel?: string;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
}

export interface DietOnboardingData {
  dietPreference?: 'vegetarian' | 'vegan' | 'non-veg' | 'flexible';
  allergies?: string;
  hasAllergies?: boolean;
  mealsPerDay?: number;
  supplements?: string;
  takesSupplements?: boolean;
  foodImage?: string;
  scanId?: string;
}

export interface ProjectionOnboardingData {
  sleepHours?: string;
  dailySteps?: string;
  stressLevel?: string;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
}

class OnboardingService {
  /**
   * Save onboarding data (partial updates during main onboarding flow)
   */
  async saveOnboardingData(data: OnboardingData): Promise<void> {
    const response = await apiClient.post('/onboarding', data);
    return response.data;
  }

  // ==================== DIET ONBOARDING ====================

  /**
   * Save diet onboarding data (partial updates)
   */
  async saveDietOnboardingData(data: DietOnboardingData): Promise<void> {
    const response = await apiClient.post('/onboarding/diet', data);
    return response.data;
  }

  /**
   * Get diet onboarding data. Resolves to null when the user has not answered anything yet; a failed
   * request rejects, so the caller can show a retry instead of restarting the wizard.
   */
  async getDietOnboardingData(): Promise<DietOnboardingData | null> {
    const response = await apiClient.get<{ data: DietOnboardingData | null }>('/onboarding/diet');
    return response.data.data ?? null;
  }

  // ==================== PROJECTION ONBOARDING ====================

  /**
   * Save projection onboarding data (partial updates)
   */
  async saveProjectionOnboardingData(data: ProjectionOnboardingData): Promise<void> {
    const response = await apiClient.post('/onboarding/projection', data);
    return response.data;
  }

  /**
   * Get projection onboarding data. Resolves to null when nothing is saved yet; a failed request
   * rejects (see `getDietOnboardingData`).
   */
  async getProjectionOnboardingData(): Promise<ProjectionOnboardingData | null> {
    const response = await apiClient.get<{ data: ProjectionOnboardingData | null }>(
      '/onboarding/projection'
    );
    return response.data.data ?? null;
  }

  /**
   * Get user's onboarding data. Resolves to null when nothing is saved yet; a failed request rejects.
   * `timeout` (ms) overrides the client default for the launch check, where a slow network should
   * reach the retry screen quickly.
   */
  async getOnboardingData(options: { timeout?: number } = {}): Promise<OnboardingData | null> {
    const response = await apiClient.get<{ data: OnboardingData | null }>('/onboarding', {
      timeout: options.timeout,
    });
    return response.data.data ?? null;
  }
}

export default new OnboardingService();
