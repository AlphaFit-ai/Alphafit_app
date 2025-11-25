import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { Colors } from '../constants';
import { userService } from '../services';

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
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = '@alphafit_ai_theme';

const lightTheme: ThemeColors = {
  background: Colors.white,
  backgroundSecondary: Colors.gray[50],
  text: Colors.black,
  textSecondary: Colors.gray[600],
  border: Colors.gray[200],
  card: Colors.white,
  primary: Colors.primary,
  icon: Colors.black,
};

const darkTheme: ThemeColors = {
  background: Colors.backgroundDark,
  backgroundSecondary: Colors.gray[800],
  text: Colors.white,
  textSecondary: Colors.gray[400],
  border: Colors.gray[700],
  card: Colors.gray[900],
  primary: Colors.primary,
  icon: Colors.white,
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // First, check if user is authenticated
      const isAuthenticated = await userService.isAuthenticated();
      
      if (isAuthenticated) {
        // Try to load from backend
        try {
          const profile = await userService.getUserProfile();
          if (profile.preferences?.theme) {
            const isDark = profile.preferences.theme === 'dark';
            setIsDarkMode(isDark);
            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem(THEME_STORAGE_KEY, profile.preferences.theme);
            return;
          }
        } catch (error: any) {
          // Only log unexpected errors (not 401/404)
          if (error?.response?.status !== 401 && error?.response?.status !== 404) {
            console.log('Could not load theme from backend:', error.message);
          }
        }
      }

      // Fallback to AsyncStorage
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Use device default if no saved preference
        const deviceTheme = Appearance.getColorScheme() === 'dark';
        setIsDarkMode(deviceTheme);
        
        // Save default to backend only if authenticated
        if (isAuthenticated) {
          try {
            await userService.updateUserProfile({
              preferences: {
                theme: deviceTheme ? 'dark' : 'light'
              }
            });
          } catch (error: any) {
            // Silently fail for authentication errors
            if (error?.response?.status !== 401 && error?.response?.status !== 404) {
              console.log('Could not save initial theme to backend:', error.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
      
      // Sync with backend only if authenticated
      const isAuthenticated = await userService.isAuthenticated();
      if (isAuthenticated) {
        try {
          await userService.updateUserProfile({
            preferences: {
              theme: newMode ? 'dark' : 'light'
            }
          });
        } catch (error: any) {
          // Only log unexpected errors (not authentication errors)
          if (error?.response?.status !== 401 && error?.response?.status !== 404) {
            console.error('Failed to sync theme with backend:', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = isDarkMode ? darkTheme : lightTheme;

  // Render children immediately with current theme (default or loaded)
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
