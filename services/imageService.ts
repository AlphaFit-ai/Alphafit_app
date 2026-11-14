import * as ImagePicker from 'expo-image-picker';
import apiClient from './apiClient';
import { config } from '../config';
import { logError } from './apiError';
import { FOOD_SCAN_MAX_SIDE, PROFILE_MAX_SIDE, prepareImageForUpload } from './imagePrep';
import { imageFormData } from './uploadPart';

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    imageUrl: string;
    type?: string;
  };
}

class ImageService {
  /**
   * Upload profile picture
   */
  async uploadProfilePicture(originalUri: string): Promise<string> {
    const imageUri = await prepareImageForUpload(originalUri, PROFILE_MAX_SIDE);
    // A file part that works on a phone and in the browser preview (see uploadPart.ts).
    const formData = await imageFormData(imageUri, 'profile');

    const response = await apiClient.post<ImageUploadResponse>('/images/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload
    });

    if (response.data.success && response.data.data) {
      // Convert relative URL to absolute URL with backend base
      const imageUrl = response.data.data.imageUrl;
      const absoluteUrl = this.toAbsoluteUrl(imageUrl);
      if (!absoluteUrl) {
        throw new Error('Invalid image URL received');
      }
      return absoluteUrl;
    }

    throw new Error(response.data.message || 'Failed to upload profile picture');
  }

  /**
   * Upload progress photo (body transformation)
   * @param imageUri - Local image URI
   * @param type - Photo type: 'front', 'side', 'back'
   */
  async uploadProgressPhoto(
    imageUri: string,
    type: 'front' | 'side' | 'back' = 'front'
  ): Promise<string> {
    const formData = await imageFormData(imageUri, 'progress');

    const response = await apiClient.post<ImageUploadResponse>(
      `/images/progress?type=${type}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file upload
      }
    );

    if (response.data.success && response.data.data) {
      const absoluteUrl = this.toAbsoluteUrl(response.data.data.imageUrl);
      if (!absoluteUrl) {
        throw new Error('Invalid image URL received');
      }
      return absoluteUrl;
    }

    throw new Error(response.data.message || 'Failed to upload progress photo');
  }

  /**
   * Upload food scan image
   */
  async uploadFoodScanImage(originalUri: string): Promise<string> {
    // A smaller photo uploads faster and is all the model needs.
    const imageUri = await prepareImageForUpload(originalUri, FOOD_SCAN_MAX_SIDE);
    const formData = await imageFormData(imageUri, 'food');

    const response = await apiClient.post<ImageUploadResponse>('/images/food-scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload
    });

    if (response.data.success && response.data.data) {
      const absoluteUrl = this.toAbsoluteUrl(response.data.data.imageUrl);
      if (!absoluteUrl) {
        throw new Error('Invalid image URL received');
      }
      return absoluteUrl;
    }

    throw new Error(response.data.message || 'Failed to upload food scan image');
  }

  /**
   * Get user's profile picture URL. Screens read it through `useProfilePicture()`, which caches it.
   */
  async getProfilePicture(): Promise<string | null> {
    const response = await apiClient.get<ImageUploadResponse>('/images/profile');

    if (response.data.success && response.data.data) {
      return this.toAbsoluteUrl(response.data.data.imageUrl);
    }

    return null;
  }

  /**
   * Pick image from camera or gallery (helper method)
   */
  async pickImage(source: 'camera' | 'gallery' = 'gallery'): Promise<string | null> {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission is required');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Photo library permission is required');
        }
      }

      // Launch picker
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      logError('image.pick', error);
      throw error;
    }
  }

  /**
   * Convert relative URL to absolute URL with backend base
   */
  private toAbsoluteUrl(url: string | null): string | null {
    if (!url) return null;

    // If URL already starts with http:// or https://, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Ensure url starts with /
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${config.API_BASE_URL}${path}`;
  }
}

export default new ImageService();
