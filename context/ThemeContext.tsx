import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Colors } from '../constants';

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const colors = isDarkMode ? darkTheme : lightTheme;

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
