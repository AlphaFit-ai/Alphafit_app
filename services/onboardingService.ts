import apiClient from './apiClient';

export interface OnboardingData {
  source?: string;
  dateOfBirth?: {
    month: number;
    day: number;
    year: number;
  };
  gender?: string;
  height?: {
    value: number;
    unit: string;
    feet?: number;
    inches?: number;
    cm?: number;
  };
  weight?: {
    value: number;
    unit: string;
    lbs?: number;
    kg?: number;
  };
  fitnessLevel?: string;
  activityLevel?: string;
  workoutsPerWeek?: string;
  equipment?: string;
  goal?: string;
  currentPhysique?: number;
  projectedPhysique?: number;
  // Diet onboarding data
  dietPreference?: string;
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
  dietPreference?: string;
  allergies?: string;
  hasAllergies?: boolean;
  mealsPerDay?: number;
  supplements?: string;
  takesSupplements?: boolean;
  foodImage?: string;
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
   * Get diet onboarding data
   */
  async getDietOnboardingData(): Promise<DietOnboardingData | null> {
    try {
      const response = await apiClient.get('/onboarding/diet');
      return response.data.data;
    } catch (error) {
      return null;
    }
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
   * Get projection onboarding data
   */
  async getProjectionOnboardingData(): Promise<ProjectionOnboardingData | null> {
    try {
      const response = await apiClient.get('/onboarding/projection');
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user's onboarding data
   */
  async getOnboardingData(): Promise<OnboardingData> {
    const response = await apiClient.get('/onboarding');
    return response.data.data;
  }
}

export default new OnboardingService();
