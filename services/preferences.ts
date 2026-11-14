import * as Localization from 'expo-localization';
import { logError } from './apiError';
import { storage } from './storage';
import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY } from './storageKeys';
import { tokenStore } from './tokenStore';
import userService from './userService';

/**
 * Language and theme.
 *
 * They live on the device and are read from local storage only: starting the app makes no request
 * and writes nothing to the server. The server copy (`PUT /users/profile` `preferences`) is updated
 * only when the user changes the setting, and applied locally when someone signs in.
 */

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
export type ThemeName = 'light' | 'dark';
/** What the user picked on this device; `system` follows the phone (never sent to the server). */
export type ThemePreference = ThemeName | 'system';

export function isSupportedLanguage(value: unknown): value is LanguageCode {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark';
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || isThemeName(value);
}

/** The phone's language if the app has it, English otherwise. */
export function resolveDeviceLanguage(): LanguageCode {
  const code = Localization.getLocales()[0]?.languageCode;
  return isSupportedLanguage(code) ? code : 'en';
}

export interface StoredPreferences {
  language: LanguageCode | null;
  theme: ThemePreference | null;
}

/** Local read only. Anything missing or unreadable is null, never an error. */
export async function readStoredPreferences(): Promise<StoredPreferences> {
  const [language, theme] = await Promise.all([
    storage.getItem(LANGUAGE_STORAGE_KEY),
    storage.getItem(THEME_STORAGE_KEY),
  ]);
  return {
    language: isSupportedLanguage(language) ? language : null,
    theme: isThemePreference(theme) ? theme : null,
  };
}

export async function storeLanguage(language: LanguageCode): Promise<void> {
  await storage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export async function storeTheme(theme: ThemePreference): Promise<void> {
  await storage.setItem(THEME_STORAGE_KEY, theme);
}

export async function clearStoredTheme(): Promise<void> {
  await storage.removeItem(THEME_STORAGE_KEY);
}

/**
 * Save a setting the user just changed to their profile. Does nothing when nobody is signed in
 * (the login screen has a language switch). A failure is logged and does not undo the local change.
 */
export async function pushPreferencesToServer(preferences: {
  language?: LanguageCode;
  theme?: ThemeName;
}): Promise<void> {
  try {
    if (!(await tokenStore.hasToken())) return;
    await userService.updateUserProfile({ preferences });
  } catch (error) {
    logError('preferences.sync', error);
  }
}
