import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants';
import { darkTokens, lightTokens, Tokens } from '../src/theme/tokens';
import { logError } from '../services/apiError';
import {
  pushPreferencesToServer,
  storeTheme,
  ThemeName,
  ThemePreference,
} from '../services/preferences';
import { registerSessionResetter } from '../services/session';

/** The older flat palette. New code reads `tokens`; this stays for screens not moved yet. */
interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  primary: string;
  icon: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  /** What the user picked: follow the phone, or fixed light or dark. */
  preference: ThemePreference;
  /** Switches between light and dark (a fixed choice). */
  toggleTheme: () => void;
  /**
   * Set the theme. `sync: false` applies a value that came from the server without writing it back.
   * `system` is kept on this device only; the server only ever hears `light` or `dark`.
   */
  setTheme: (theme: ThemePreference, options?: { sync?: boolean }) => void;
  colors: ThemeColors;
  /** Semantic design tokens for the active theme. */
  tokens: Tokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function toLegacyColors(tokens: Tokens): ThemeColors {
  const c = tokens.color;
  return {
    background: c.bg,
    backgroundSecondary: c.bgSubtle,
    text: c.text,
    textSecondary: c.textMuted,
    border: c.border,
    card: c.surface,
    primary: Colors.primary,
    icon: c.text,
  };
}

const lightColors = toLegacyColors(lightTokens);
const darkColors = toLegacyColors(darkTokens);

interface ThemeProviderProps {
  children: ReactNode;
  /** The preference saved on this device, read before the first render so there is no flash. */
  initialTheme?: ThemePreference | null;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme = null }) => {
  const [preference, setPreference] = useState<ThemePreference>(initialTheme ?? 'system');
  // Follows the phone's appearance live while the preference is `system`.
  const deviceScheme = useColorScheme();
  const isDarkMode = preference === 'system' ? deviceScheme === 'dark' : preference === 'dark';

  const setTheme = useCallback((theme: ThemePreference, options: { sync?: boolean } = {}) => {
    const { sync = true } = options;
    setPreference(theme);
    storeTheme(theme).catch((error) => logError('theme.store', error));
    // The server copy is updated only when the user changed the setting, and only with a real theme.
    if (sync && theme !== 'system') void pushPreferencesToServer({ theme: theme as ThemeName });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, setTheme]);

  // After sign-out the theme goes back to following the phone. (`signOut()` removes the saved value;
  // this resets what is on screen.)
  useEffect(() => registerSessionResetter(() => setPreference('system')), []);

  const value = useMemo<ThemeContextType>(
    () => ({
      isDarkMode,
      preference,
      toggleTheme,
      setTheme,
      colors: isDarkMode ? darkColors : lightColors,
      tokens: isDarkMode ? darkTokens : lightTokens,
    }),
    [isDarkMode, preference, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
