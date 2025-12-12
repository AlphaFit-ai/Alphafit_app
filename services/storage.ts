import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Platform-aware storage utility
 * - Mobile: Uses AsyncStorage (SecureStore-like behavior)
 * - Web: Uses localStorage as fallback
 */
class StorageService {
  private isWeb = Platform.OS === 'web';

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Web: Use localStorage
        window.localStorage.setItem(key, value);
      } else {
        // Mobile: Use AsyncStorage
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('StorageService setItem error:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Web: Use localStorage
        return window.localStorage.getItem(key);
      } else {
        // Mobile: Use AsyncStorage
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('StorageService getItem error:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Web: Use localStorage
        window.localStorage.removeItem(key);
      } else {
        // Mobile: Use AsyncStorage
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('StorageService removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Web: Clear localStorage
        window.localStorage.clear();
      } else {
        // Mobile: Clear AsyncStorage
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('StorageService clear error:', error);
      throw error;
    }
  }
}

export const storage = new StorageService();
