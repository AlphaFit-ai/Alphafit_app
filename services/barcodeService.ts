import apiClient from './apiClient';

/**
 * Barcode Product Response Types
 */
export interface BarcodeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface BarcodePrediction {
  food: string;
  confidence: number;
  portion_size: string;
  portion_weight_g: number;
}

export interface BarcodeProductDto {
  scan_id: string;
  image_url: string;
  predictions: BarcodePrediction[];
  total_nutrition: BarcodeNutrition;
  timestamp: string;
  source: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Barcode Service - Handles barcode product lookup
 */
class BarcodeService {
  private readonly BASE_PATH = '/barcodes';

  /**
   * Lookup product by barcode
   * Tries multiple databases (Open Food Facts, UPC Database, etc.)
   * 
   * @param barcode - The barcode number to lookup
   * @returns Product information with nutrition data
   */
  async lookupBarcode(barcode: string): Promise<BarcodeProductDto> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.BASE_PATH}/lookup/${barcode}`,
        { timeout: 15000 } // Allow more time for multiple API calls
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Transform camelCase from backend to snake_case for frontend
        // Handle missing fields gracefully with default values
        return {
          scan_id: data.scanId || '',
          image_url: data.imageUrl || '',
          predictions: (data.predictions || []).map((pred: any) => ({
            food: pred.food || 'Unknown',
            confidence: pred.confidence || 0,
            portion_size: pred.portionSize || 'N/A',
            portion_weight_g: pred.portionWeightG || 0
          })),
          total_nutrition: data.totalNutrition ? {
            calories: data.totalNutrition.calories || 0,
            protein: data.totalNutrition.protein || 0,
            carbs: data.totalNutrition.carbs || 0,
            fat: data.totalNutrition.fat || 0,
            fiber: data.totalNutrition.fiber || 0,
            sugar: data.totalNutrition.sugar || 0
          } : {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0
          },
          timestamp: data.timestamp || new Date().toISOString(),
          source: data.source || 'Unknown'
        };
      }

      // Response not successful or no data
      throw new Error('Product not found');
    } catch (error: any) {
      // If it's already our custom error, re-throw it
      if (error.message === 'Product not found') {
        throw error;
      }
      
      // Handle 404 and other API errors
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      }
      
      // Re-throw with proper message
      throw error;
    }
  }
}

export const barcodeService = new BarcodeService();
