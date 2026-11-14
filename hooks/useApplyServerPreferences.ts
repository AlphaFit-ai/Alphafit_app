import { useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { setLanguage } from '../i18n/config';
import { isSupportedLanguage, isThemeName } from '../services/preferences';
import type { UserPreferences } from '../services/userService';

/**
 * After a sign-in, use the language and theme saved on the account on this phone. It changes the
 * app only; it does not send them back to the server (that happens when the user changes a setting).
 * An account with nothing saved leaves the phone's own choices alone.
 */
export function useApplyServerPreferences() {
  const { setTheme } = useTheme();

  return useCallback(
    (preferences?: UserPreferences | null) => {
      if (!preferences) return;
      if (isThemeName(preferences.theme)) setTheme(preferences.theme, { sync: false });
      if (isSupportedLanguage(preferences.language)) {
        void setLanguage(preferences.language, { sync: false });
      }
    },
    [setTheme]
  );
}
