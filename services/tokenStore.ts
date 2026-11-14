import * as SecureStore from 'expo-secure-store';
import { logError } from './apiError';
import { storage } from './storage';
import { AUTH_TOKEN_KEY, USER_ID_KEY } from './storageKeys';

/**
 * The api token and user id of the signed-in user. The token lives in the platform's secure storage
 * (Keychain on iOS, Keystore-backed storage on Android), not in AsyncStorage.
 *
 * Builds before WP-MOB-3 kept both in AsyncStorage. The first read moves them across (copy to secure
 * storage, then delete the AsyncStorage copy), so an update keeps the user signed in.
 */
let migration: Promise<void> | null = null;

async function migrateFromAsyncStorage(): Promise<void> {
  try {
    for (const key of [AUTH_TOKEN_KEY, USER_ID_KEY]) {
      const legacy = await storage.getItem(key);
      if (legacy === null) continue;
      if ((await SecureStore.getItemAsync(key)) === null) {
        await SecureStore.setItemAsync(key, legacy);
      }
      await storage.removeItem(key);
    }
  } catch (error) {
    // Keep the legacy copy: the next read tries again.
    logError('tokenStore.migrate', error);
    migration = null;
  }
}

function ready(): Promise<void> {
  if (!migration) migration = migrateFromAsyncStorage();
  return migration;
}

export const tokenStore = {
  async getToken(): Promise<string | null> {
    await ready();
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },

  async hasToken(): Promise<boolean> {
    return !!(await tokenStore.getToken());
  },

  async save(token: string, userId?: string): Promise<void> {
    await ready();
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    if (userId) await SecureStore.setItemAsync(USER_ID_KEY, userId);
  },

  /** Forget the token and the user id, in both stores. Every removal is attempted; the first failure is rethrown. */
  async clear(): Promise<void> {
    const results = await Promise.allSettled([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
      storage.removeItem(AUTH_TOKEN_KEY),
      storage.removeItem(USER_ID_KEY),
    ]);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed && failed.status === 'rejected') throw failed.reason;
  },

  /** Test helper: forget that the migration ran. */
  _resetMigration(): void {
    migration = null;
  },
};
