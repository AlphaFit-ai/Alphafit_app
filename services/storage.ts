import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from './apiError';

/**
 * Device key-value storage (AsyncStorage). WP-MOB-3 moves the auth token to expo-secure-store; keep
 * every read and write of the token going through this module so that move touches one file.
 */
class StorageService {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logError('storage.setItem', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logError('storage.getItem', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logError('storage.removeItem', error);
      throw error;
    }
  }
}

export const storage = new StorageService();
