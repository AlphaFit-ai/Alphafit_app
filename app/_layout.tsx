import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import { useFonts } from 'expo-font';
import { type ErrorBoundaryProps, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary, ErrorFallback } from '../components/ErrorBoundary';
import { LaunchScreen } from '../components/LaunchScreen';
import { useOnboarding } from '../context/OnboardingContext';
import { AppProviders } from '../context/AppProviders';
import { useTheme } from '../context/ThemeContext';
import { restoreStoredPreferences } from '../i18n/config';
import { logError } from '../services/apiError';
import { runLaunchCheck, connectSessionToApi } from '../services/launch';
import { StoredPreferences } from '../services/preferences';
import { setupQueryEnvironment } from '../services/queryClient';
import { useSession } from '../services/sessionStore';

// Keep the splash screen up until the fonts and the saved language and theme are ready.
SplashScreen.preventAutoHideAsync();

/** Expo Router shows this when a screen throws while rendering; "Reload" renders the route again. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    logError('route', error);
  }, [error]);
  return <ErrorFallback error={error} onReload={retry} />;
}

function RootContent() {
  const { colors, tokens } = useTheme();
  const { setCurrentStep } = useOnboarding();
  const session = useSession();

  const check = useCallback(async () => {
    const result = await runLaunchCheck();
    if (result) setCurrentStep(result.step);
  }, [setCurrentStep]);

  // The launch check runs once; "Try again" runs it again.
  useEffect(() => {
    connectSessionToApi();
    setupQueryEnvironment();
    void check();
  }, [check]);

  const screen = { contentStyle: { backgroundColor: colors.background } };

  return (
    <>
      <StatusBar
        style={tokens.mode === 'dark' ? 'light' : 'dark'}
        backgroundColor={colors.background}
      />
      {session.status === 'loading' ? (
        <LaunchScreen error={session.launchError} onRetry={check} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
            animationDuration: 200,
          }}
        >
          <Stack.Screen name="index" options={screen} />
          {/* The onboarding folder guards its own screens (signed out: login; signed in: questions). */}
          <Stack.Screen name="onboarding" options={screen} />
          {/* Everything else needs a signed-in user who finished onboarding. */}
          <Stack.Protected guard={session.status === 'ready'}>
            <Stack.Screen name="(tabs)" options={screen} />
            <Stack.Screen name="diet" options={screen} />
            <Stack.Screen name="projection" options={screen} />
            <Stack.Screen name="history" options={screen} />
            <Stack.Screen name="chatbot" options={screen} />
            <Stack.Screen name="profile" options={screen} />
            <Stack.Screen
              name="diet/diet-statistics"
              options={{
                presentation: 'transparentModal',
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_bottom',
              }}
            />
          </Stack.Protected>
        </Stack>
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });
  const [preferences, setPreferences] = useState<StoredPreferences | null>(null);

  // The saved language is applied and the saved theme read before anything is drawn, so the app does
  // not flash the wrong language or theme. This reads local storage only.
  useEffect(() => {
    let active = true;
    restoreStoredPreferences()
      .catch((error) => {
        logError('startup.preferences', error);
        return { language: null, theme: null } as StoredPreferences;
      })
      .then((stored) => {
        if (active) setPreferences(stored);
      });
    return () => {
      active = false;
    };
  }, []);

  const ready = (fontsLoaded || !!fontError) && preferences !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AppProviders initialTheme={preferences.theme}>
          <RootContent />
        </AppProviders>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
