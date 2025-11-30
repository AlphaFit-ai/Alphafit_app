import apiClient from './apiClient';

/**
 * Food Scan API Response Types
 */
export interface NutritionInfo {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodPrediction {
  foodName: string;
  confidence: number;
  classId: number;
  nutrition: NutritionInfo;
  // Computed properties for backward compatibility
  food?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface NutritionSummary {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  itemCount: number;
}

export interface FoodScanDto {
  id: string;
  userId: string;
  imageUrl: string;
  predictions: FoodPrediction[];
  nutritionSummary?: NutritionSummary;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Food Scan Service - Handles food recognition API integration
 */
class FoodScanService {
  private readonly BASE_PATH = '/food-scans';

  /**
   * Create a new food scan
   * Uploads an image and initiates AI processing via Kafka
   */
  async createFoodScan(imageUrl: string): Promise<FoodScanDto> {
    const response = await apiClient.post<ApiResponse<FoodScanDto>>(
      this.BASE_PATH,
      { imageUrl },
      { timeout: 10000 }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to create food scan');
  }

  /**
   * Get a specific food scan by ID
   * Used for polling to check if AI processing is complete
   */
  async getFoodScan(scanId: string): Promise<FoodScanDto> {
    const response = await apiClient.get<ApiResponse<FoodScanDto>>(
      `${this.BASE_PATH}/${scanId}`,
      { timeout: 10000 }
    );

    if (response.data.success && response.data.data) {
      const scan = response.data.data;
      
      // Transform predictions to add flat properties for backward compatibility
      if (scan.predictions) {
        scan.predictions = scan.predictions.map(pred => ({
          ...pred,
          food: pred.foodName,
          calories: pred.nutrition?.calories || 0,
          protein: pred.nutrition?.proteinG || 0,
          carbs: pred.nutrition?.carbsG || 0,
          fat: pred.nutrition?.fatG || 0,
        }));
      }
      
      return scan;
    }

    throw new Error(response.data.message || 'Failed to get food scan');
  }

  /**
   * Get user's food scan history with pagination
   */
  async getUserFoodScans(
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<FoodScanDto>> {
    const response = await apiClient.get<ApiResponse<PageResponse<FoodScanDto>>>(
      `${this.BASE_PATH}/history`,
      {
        params: { page, size },
        timeout: 10000,
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get food scan history');
  }

  /**
   * Poll for food scan completion
   * Returns a promise that resolves when status is COMPLETED or FAILED
   * 
   * @param scanId - The food scan ID to poll
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   * @param intervalMs - Polling interval in milliseconds (default: 2000)
   */
  async pollForCompletion(
    scanId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<FoodScanDto> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const scan = await this.getFoodScan(scanId);

      if (scan.status === 'COMPLETED') {
        return scan;
      }

        if (scan.status === 'FAILED') {
          throw new Error(scan.errorMessage || 'Food scan processing failed');
        }
      } catch (error: any) {
        // If this is the last attempt or it's not a timeout, throw the error
        if (attempt === maxAttempts - 1 || !error.message?.includes('timeout')) {
          throw error;
        }
        // Otherwise, continue to next attempt
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Food scan processing timeout - please try again');
  }

  /**
   * Complete food scan workflow: upload, create scan, poll for results
   * This is the main method to use for the full food scan process
   * 
   * @param imageUri - Local image URI from camera or library
   * @param onProgress - Optional callback for progress updates
   */
  async scanFood(
    imageUri: string,
    onProgress?: (status: string, progress: number) => void
  ): Promise<FoodScanDto> {
    try {
      // Step 1: Upload image (already handled by imageService)
      onProgress?.('Uploading image...', 0.2);

      // Step 2: Create food scan (initiates Kafka processing)
      onProgress?.('Processing with AI...', 0.4);
      const scan = await this.createFoodScan(imageUri);

      // Step 3: Poll for completion
      const result = await this.pollForCompletion(
        scan.id,
        30,
        2000
      );

      onProgress?.('Analysis complete!', 1.0);
      return result;

    } catch (error: any) {
      // Re-throw with original message preserved (don't log to avoid console errors)
      throw error;
    }
  }
}

export const foodScanService = new FoodScanService();
