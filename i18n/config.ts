import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

const LANGUAGE_KEY = 'user_language';

// Check if we're running in a native environment (not web SSR)
const isNativeEnvironment = typeof window !== 'undefined' || Platform.OS !== 'web';

// Get stored language or use device language
const initLanguage = async () => {
  try {
    if (!isNativeEnvironment) {
      return 'en';
    }
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (storedLanguage) {
      return storedLanguage;
    }
    // Get device language
    const locales = Localization.getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'en';
    // Check if device language is supported
    return ['en', 'es', 'fr'].includes(deviceLanguage) ? deviceLanguage : 'en';
  } catch (error) {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Will be overridden by stored/device language
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });

// Initialize language on app start (only in native environment)
if (isNativeEnvironment) {
  initLanguage().then((language) => {
    i18n.changeLanguage(language);
  });

  // Save language preference when changed
  i18n.on('languageChanged', (lng) => {
    AsyncStorage.setItem(LANGUAGE_KEY, lng);
  });
}

export default i18n;
