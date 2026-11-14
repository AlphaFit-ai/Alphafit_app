import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AUTH_TOKEN_KEY, USER_ID_KEY } from '../services/storageKeys';
import { tokenStore } from '../services/tokenStore';

describe('tokenStore', () => {
  it('keeps the token in secure storage and never in AsyncStorage', async () => {
    await tokenStore.save('secret-token', 'user-1');
    expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBe('secret-token');
    expect(await SecureStore.getItemAsync(USER_ID_KEY)).toBe('user-1');
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(await tokenStore.getToken()).toBe('secret-token');
  });

  describe('migration of a token saved by an older build', () => {
    it('moves it to secure storage on the first read, so an update keeps the user signed in', async () => {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'legacy-token');
      await AsyncStorage.setItem(USER_ID_KEY, 'legacy-user');

      expect(await tokenStore.getToken()).toBe('legacy-token');

      expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBe('legacy-token');
      expect(await SecureStore.getItemAsync(USER_ID_KEY)).toBe('legacy-user');
      expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull(); // the plain copy is gone
      expect(await AsyncStorage.getItem(USER_ID_KEY)).toBeNull();
    });

    it('does not overwrite a newer token already in secure storage', async () => {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'new-token');
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'old-token');
      expect(await tokenStore.getToken()).toBe('new-token');
      expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('keeps the old copy and tries again when secure storage fails, instead of signing the user out', async () => {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'legacy-token');
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keystore locked'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await tokenStore.getToken(); // the first read fails to migrate
      expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBe('legacy-token');

      expect(await tokenStore.getToken()).toBe('legacy-token'); // the next read succeeds
      expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      consoleError.mockRestore();
    });
  });

  it('clear removes the token from both stores', async () => {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'a');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'b');
    await AsyncStorage.setItem(USER_ID_KEY, 'u');
    await tokenStore.clear();
    expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_ID_KEY)).toBeNull();
    expect(await tokenStore.hasToken()).toBe(false);
  });
});
