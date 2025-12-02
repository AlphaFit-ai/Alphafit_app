import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DietProvider } from '../context/DietContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { ProjectionProvider } from '../context/ProjectionContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '../i18n/config';

// Suppress non-critical warnings, errors, and logs
const originalLog = console.log;
console.log = (message: any, ...args: any[]) => {
  if (typeof message === 'string') {
    // Only allow important logs (app lifecycle, critical operations)
    const isImportantLog =
      message.includes('Starting') ||
      message.includes('Initialized') ||
      message.includes('Successfully') ||
      message.includes('Completed') ||
      message.includes('User logged in') ||
      message.includes('User registered');

    // Suppress non-critical logs
    if (!isImportantLog && (
      message.includes('Could not load') ||
      message.includes('Could not sync') ||
      message.includes('Could not save') ||
      message.includes('Failed to load') ||
      message.includes('Failed to sync') ||
      message.includes('Failed to save') ||
      message.includes('using local storage') ||
      message.includes('Authentication expired') ||
      message.includes('saved to backend') ||
      message.includes('data saved') ||
      message.includes('Resource not found') ||
      message.includes('request for user'))) {
      return;
    }
  }
  originalLog(message, ...args);
};

const originalWarn = console.warn;
console.warn = (message: any, ...args: any[]) => {
  if (typeof message === 'string' && message.includes('keep awake')) {
    return;
  }
  originalWarn(message, ...args);
};

const originalError = console.error;
console.error = (message: any, ...args: any[]) => {
  // Suppress expected/non-critical errors
  if (typeof message === 'string') {
    // Network errors (expected when backend is down or no internet)
    if (message.includes('Network error') ||
      message.includes('ERR_NETWORK') ||
      message.includes('network_XMLHttpRequest') ||
      message.includes('Host unreachable')) {
      return;
    }

    // Backend sync failures (expected when not authenticated or offline)
    if (message.includes('Failed to sync') ||
      message.includes('Could not load') ||
      message.includes('Could not sync') ||
      message.includes('Failed to load onboarding data') ||
      message.includes('Failed to load theme') ||
      message.includes('Failed to load language')) {
      return;
    }

    // Authentication errors (expected)
    if (message.includes('Request failed with status code 404') ||
      message.includes('Request failed with status code 401')) {
      return;
    }

    // Keep awake errors (non-critical)
    if (message.includes('keep awake') || message.includes('Unable to activate keep awake')) {
      return;
    }
  }

  // Check if error object contains network error
  if (typeof message === 'object' && message !== null) {
    const errorStr = JSON.stringify(message);
    if (errorStr.includes('ERR_NETWORK') ||
      errorStr.includes('Host unreachable') ||
      errorStr.includes('Network error')) {
      return;
    }
  }

  originalError(message, ...args);
};

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { isDarkMode, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="onboarding" options={{ contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="diet" options={{ contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="projection" options={{ contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen name="history" options={{ contentStyle: { backgroundColor: colors.background } }} />
        <Stack.Screen
          name="diet/diet-statistics"
          options={{
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: colors.background } }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const content = (
    <SafeAreaProvider>
      <ThemeProvider>
        <OnboardingProvider>
          <DietProvider>
            <ProjectionProvider>
              <RootContent />
            </ProjectionProvider>
          </DietProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return content;
}
