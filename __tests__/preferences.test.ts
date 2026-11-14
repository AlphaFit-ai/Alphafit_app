import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n, { restoreStoredPreferences, setLanguage } from '../i18n/config';
import {
  pushPreferencesToServer,
  readStoredPreferences,
  resolveDeviceLanguage,
  storeLanguage,
  storeTheme,
} from '../services/preferences';
import { AUTH_TOKEN_KEY, LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY } from '../services/storageKeys';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

beforeEach(async () => {
  jest.clearAllMocks();
  mockApi.put.mockResolvedValue({ data: {} });
  (Localization.getLocales as jest.Mock).mockReturnValue([{ languageCode: 'en' }]);
  await i18n.changeLanguage('en');
});

describe('starting the app', () => {
  it('reads the saved language and theme from local storage and makes no request at all', async () => {
    await storeLanguage('fr');
    await storeTheme('dark');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'a-signed-in-user'); // even for a signed-in user

    const stored = await restoreStoredPreferences();

    expect(stored).toEqual({ language: 'fr', theme: 'dark' });
    expect(i18n.language).toBe('fr');
    expect(mockApi.get).not.toHaveBeenCalled();
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(mockApi.put).not.toHaveBeenCalled(); // in particular no PUT /users/profile
  });

  it('does not write anything to the server when nothing is saved either', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'a-signed-in-user');
    const stored = await restoreStoredPreferences();
    expect(stored).toEqual({ language: null, theme: null });
    expect(mockApi.put).not.toHaveBeenCalled();
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('ignores a saved value it does not know', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'klingon');
    await AsyncStorage.setItem(THEME_STORAGE_KEY, 'blue');
    expect(await readStoredPreferences()).toEqual({ language: null, theme: null });
  });

  it('uses the phone language when it is one of ours, English otherwise', () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageCode: 'es' }]);
    expect(resolveDeviceLanguage()).toBe('es');
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageCode: 'de' }]);
    expect(resolveDeviceLanguage()).toBe('en');
  });
});

describe('changing the language', () => {
  it('saves it on the phone and sends it to the account, once, when someone is signed in', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'token');

    await setLanguage('es');

    expect(i18n.language).toBe('es');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    expect(mockApi.put).toHaveBeenCalledTimes(1);
    expect(mockApi.put).toHaveBeenCalledWith('/users/profile', { preferences: { language: 'es' } });
  });

  it('only saves it on the phone when nobody is signed in (the login screen has a language switch)', async () => {
    await setLanguage('fr');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(mockApi.put).not.toHaveBeenCalled();
  });

  it('does not write back a value that came from the server', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'token');
    await setLanguage('fr', { sync: false });
    expect(i18n.language).toBe('fr');
    expect(mockApi.put).not.toHaveBeenCalled();
  });

  it('keeps the change when the server cannot be reached', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'token');
    mockApi.put.mockRejectedValueOnce(new Error('offline'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(setLanguage('es')).resolves.toBeUndefined();

    expect(i18n.language).toBe('es');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    consoleError.mockRestore();
  });
});

describe('pushPreferencesToServer', () => {
  it('sends only what changed', async () => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'token');
    await pushPreferencesToServer({ theme: 'dark' });
    expect(mockApi.put).toHaveBeenCalledWith('/users/profile', { preferences: { theme: 'dark' } });
  });
});
