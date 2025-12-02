import * as ImagePicker from 'expo-image-picker';
import apiClient from './apiClient';
import { config } from '../config';

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    imageUrl: string;
    type?: string;
  };
}

export interface ProgressPhoto {
  url: string;
  fileName: string;
  type: string;
  uploadedAt: string;
}

export interface ProgressPhotosResponse {
  progressPhotos: ProgressPhoto[];
  totalCount: number;
}

class ImageService {
  /**
   * Upload profile picture
   */
  async uploadProfilePicture(imageUri: string): Promise<string> {
    const formData = new FormData();

    // Create file object from URI
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<ImageUploadResponse>(
      '/images/profile',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file upload
      }
    );

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
  async uploadProgressPhoto(imageUri: string, type: 'front' | 'side' | 'back' = 'front'): Promise<string> {
    const formData = new FormData();

    const filename = imageUri.split('/').pop() || 'progress.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: fileType,
    } as any);

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
  async uploadFoodScanImage(imageUri: string): Promise<string> {
    const formData = new FormData();

    const filename = imageUri.split('/').pop() || 'food.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<ImageUploadResponse>(
      '/images/food-scan',
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

    throw new Error(response.data.message || 'Failed to upload food scan image');
  }

  /**
   * Get user's profile picture URL
   */
  async getProfilePicture(): Promise<string | null> {
    const response = await apiClient.get<ImageUploadResponse>('/images/profile');

    if (response.data.success && response.data.data) {
      return this.toAbsoluteUrl(response.data.data.imageUrl);
    }

    return null;
  }

  /**
   * Get user's progress photos
   */
  async getProgressPhotos(): Promise<ProgressPhotosResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: ProgressPhotosResponse;
    }>('/images/progress');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return { progressPhotos: [], totalCount: 0 };
  }

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/images/${imageId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete image');
    }
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
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'Images' as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'Images' as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
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

    // Remove '/api' from base URL since we'll add it with the path
    const baseUrl = config.API_BASE_URL.replace('/api', '');

    // Ensure url starts with /
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${baseUrl}${path}`;
  }
}

export default new ImageService();
