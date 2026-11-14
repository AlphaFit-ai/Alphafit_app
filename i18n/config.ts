import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  LanguageCode,
  pushPreferencesToServer,
  readStoredPreferences,
  resolveDeviceLanguage,
  storeLanguage,
  StoredPreferences,
} from '../services/preferences';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

// One instance for the whole app (react-i18next picks it up through `initReactI18next`).
const i18n = createInstance();

// Starts in the phone's language. `restoreStoredPreferences()` then applies the language the user
// chose earlier, before the first screen is shown. Nothing here talks to the server.
i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLanguage(),
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Apply the language saved on this device, if any, and return what is saved (the theme goes to the
 * ThemeProvider). Local storage only: no request is made, so launching the app writes nothing to
 * the server.
 */
export async function restoreStoredPreferences(): Promise<StoredPreferences> {
  const stored = await readStoredPreferences();
  if (stored.language && stored.language !== i18n.language) {
    await i18n.changeLanguage(stored.language);
  }
  return stored;
}

/**
 * Change the language. Every screen that lets the user pick a language calls this (never
 * `i18n.changeLanguage` directly). The choice is saved on the device; it is sent to the server
 * only when `sync` is true and someone is signed in, so applying a saved or server value does not
 * write back.
 */
export async function setLanguage(
  language: LanguageCode,
  options: { sync?: boolean } = {}
): Promise<void> {
  const { sync = true } = options;
  await i18n.changeLanguage(language);
  await storeLanguage(language);
  if (sync) await pushPreferencesToServer({ language });
}

export default i18n;
