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

/** `GET /barcodes/lookup/{barcode}` data, as the api sends it (camelCase, every field optional). */
interface BarcodeLookupData {
  scanId?: string;
  imageUrl?: string;
  predictions?: {
    food?: string;
    confidence?: number;
    portionSize?: string;
    portionWeightG?: number;
  }[];
  totalNutrition?: Partial<Record<keyof BarcodeNutrition, number>>;
  timestamp?: string;
  source?: string;
}

/** The product is not in any database the api queries (HTTP 404 or an empty answer). */
export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found');
    this.name = 'ProductNotFoundError';
  }
}

/** True for the "not found" answer, also if the class identity is lost by the JavaScript engine. */
export function isProductNotFound(error: unknown): boolean {
  return (
    error instanceof ProductNotFoundError ||
    (error as { name?: string } | null)?.name === 'ProductNotFoundError'
  );
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
   * @throws ProductNotFoundError when the api does not know the product
   */
  async lookupBarcode(barcode: string): Promise<BarcodeProductDto> {
    let body: ApiResponse<BarcodeLookupData | null>;
    try {
      const response = await apiClient.get<ApiResponse<BarcodeLookupData | null>>(
        // The value comes from a camera and can hold any character (QR codes are free text).
        `${this.BASE_PATH}/lookup/${encodeURIComponent(barcode)}`,
        { timeout: 15000 } // Allow more time for multiple API calls
      );
      body = response.data;
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        throw new ProductNotFoundError();
      }
      throw error;
    }

    if (!body.success || !body.data) {
      throw new ProductNotFoundError();
    }

    // Transform camelCase from backend to snake_case for frontend
    // Handle missing fields gracefully with default values
    const data = body.data;
    const nutrition = data.totalNutrition ?? {};
    return {
      scan_id: data.scanId || '',
      image_url: data.imageUrl || '',
      predictions: (data.predictions ?? []).map((pred) => ({
        food: pred.food || 'Unknown',
        confidence: pred.confidence || 0,
        portion_size: pred.portionSize || 'N/A',
        portion_weight_g: pred.portionWeightG || 0,
      })),
      total_nutrition: {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        sugar: nutrition.sugar || 0,
      },
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'Unknown',
    };
  }
}

export const barcodeService = new BarcodeService();
