import apiClient from './apiClient';
import { normalizeApiError } from './apiError';

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
  /** Weight of the portion the nutrition is for (CONTRACTS 3.6); omitted when the scan has none. */
  portionWeightG?: number;
  alternatives?: { foodName: string; confidence?: number }[];
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
  /** The scan asks the user to check it (CONTRACTS 3.6); omitted when false. */
  needsConfirmation?: boolean;
  /** The user corrected portions or names. */
  userEdited?: boolean;
}

/** One corrected item of `PATCH /food-scans/{id}`. */
export interface ScanEditItem {
  classId: number;
  /** 1 to 5000. */
  grams: number;
  foodName?: string;
}

export interface ScanEditBody {
  items?: ScanEditItem[];
  confirmed?: boolean;
}

/** The flat names older screens read (`food`, `protein`...), added to every prediction. */
export function withFlatFields(scan: FoodScanDto): FoodScanDto {
  if (!scan.predictions) return scan;
  return {
    ...scan,
    predictions: scan.predictions.map((pred) => ({
      ...pred,
      food: pred.foodName,
      calories: pred.nutrition?.calories || 0,
      protein: pred.nutrition?.proteinG || 0,
      carbs: pred.nutrition?.carbsG || 0,
      fat: pred.nutrition?.fatG || 0,
    })),
  };
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

/** The stage `scanFood` reports; the screen turns it into text in the user's language. */
export type ScanStage = 'uploading' | 'analyzing' | 'complete';

/** A pause that ends early, with a `cancelled` rejection, when the signal aborts. */
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancelled = () =>
      Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' });
    if (signal?.aborted) return reject(cancelled());
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(cancelled());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
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
  async createFoodScan(imageUrl: string, signal?: AbortSignal): Promise<FoodScanDto> {
    const response = await apiClient.post<ApiResponse<FoodScanDto>>(
      this.BASE_PATH,
      { imageUrl },
      { timeout: 10000, signal }
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
  async getFoodScan(scanId: string, signal?: AbortSignal): Promise<FoodScanDto> {
    const response = await apiClient.get<ApiResponse<FoodScanDto>>(`${this.BASE_PATH}/${scanId}`, {
      timeout: 10000,
      signal,
    });

    if (response.data.success && response.data.data) {
      return withFlatFields(response.data.data);
    }

    throw new Error(response.data.message || 'Failed to get food scan');
  }

  /**
   * Save the user's corrections (CONTRACTS 3.6): portions in grams, renamed foods, or `confirmed`.
   * Resolves with the updated scan. Failures are rethrown as they came: 404 = the route is missing on an
   * older server, 409 = the scan changed or cannot be rescaled, 400 = a value the api refused.
   */
  async updateFoodScan(
    scanId: string,
    body: ScanEditBody,
    signal?: AbortSignal
  ): Promise<FoodScanDto> {
    const response = await apiClient.patch<ApiResponse<FoodScanDto>>(
      `${this.BASE_PATH}/${scanId}`,
      body,
      { timeout: 10000, signal }
    );
    if (response.data.success && response.data.data) return withFlatFields(response.data.data);
    throw new Error(response.data.message || 'Failed to update food scan');
  }

  /**
   * Get user's food scan history with pagination
   */
  async getUserFoodScans(page: number = 0, size: number = 10): Promise<PageResponse<FoodScanDto>> {
    const response = await apiClient.get<ApiResponse<PageResponse<FoodScanDto>>>(this.BASE_PATH, {
      params: { page, size },
      timeout: 10000,
    });

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
   * @param signal - Abort to stop polling: the pending request and the wait end at once, and the
   *   promise rejects with a `cancelled` error (see `normalizeApiError`)
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   * @param intervalMs - Polling interval in milliseconds (default: 2000)
   */
  async pollForCompletion(
    scanId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000,
    signal?: AbortSignal
  ): Promise<FoodScanDto> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const scan = await this.getFoodScan(scanId, signal);

        if (scan.status === 'COMPLETED') {
          return scan;
        }

        if (scan.status === 'FAILED') {
          throw new Error(scan.errorMessage || 'Food scan processing failed');
        }
      } catch (error: unknown) {
        // If this is the last attempt or it's not a timeout, throw the error
        if (attempt === maxAttempts - 1 || normalizeApiError(error).kind !== 'timeout') {
          throw error;
        }
        // Otherwise, continue to next attempt
      }

      // Wait before next poll
      await abortableDelay(intervalMs, signal);
    }

    throw new Error('Food scan processing timeout - please try again');
  }

  /**
   * Complete food scan workflow: upload, create scan, poll for results
   * This is the main method to use for the full food scan process
   *
   * @param imageUri - URL of the image already uploaded with `imageService`
   * @param onProgress - Optional callback: the stage and progress from 0 to 1
   */
  async scanFood(
    imageUri: string,
    onProgress?: (stage: ScanStage, progress: number) => void,
    signal?: AbortSignal
  ): Promise<FoodScanDto> {
    // Step 1: Image is already uploaded (handled by imageService)
    onProgress?.('uploading', 0.2);

    // Step 2: Create food scan (initiates Kafka processing)
    onProgress?.('analyzing', 0.4);
    const scan = await this.createFoodScan(imageUri, signal);

    // Step 3: Poll for completion
    const result = await this.pollForCompletion(scan.id, 30, 2000, signal);

    onProgress?.('complete', 1);
    return result;
  }
}

export const foodScanService = new FoodScanService();
