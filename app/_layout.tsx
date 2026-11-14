import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import { useFonts } from 'expo-font';
import { type ErrorBoundaryProps, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
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
import { sessionStore, useSession } from '../services/sessionStore';

// DEV ONLY: a navigation trace in the Metro log (route changes, back presses, session status). A build
// without __DEV__ drops the require and the file (scripts/check-bundle.js checks it).
const devTrace: typeof import('../src/dev/NavigationTrace') | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a require so a release build drops it
    require('../src/dev/NavigationTrace')
  : null;

// Keep the splash screen up until the fonts and the saved language and theme are ready.
SplashScreen.preventAutoHideAsync();

/**
 * The system bars, following the theme. Where the app draws edge-to-edge (development and release
 * builds) both bars are transparent over the app. Where the host does not (Expo Go on some phones),
 * the area behind the bars is the window's root view, white by default: it gets the theme background,
 * so the bars blend with the screen in light and dark. Icons are dark on light and light on dark.
 */
function SystemBars() {
  const { tokens } = useTheme();
  const background = tokens.color.bg;
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(background).catch((error) =>
      logError('systemBars.background', error)
    );
  }, [background]);
  const icons = tokens.mode === 'dark' ? 'light' : 'dark';
  return (
    <>
      <StatusBar style={icons} />
      <NavigationBar style={icons} />
    </>
  );
}

/** Expo Router shows this when a screen throws while rendering; "Reload" renders the route again. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    logError('route', error);
  }, [error]);
  return <ErrorFallback error={error} onReload={retry} />;
}

/** The navigator under the providers. Exported for tests. */
export function RootContent() {
  const { colors } = useTheme();
  const { setCurrentStep } = useOnboarding();
  const session = useSession();
  // Once the navigator is shown it stays mounted: replacing it (with the launch screen) would throw
  // away the navigation history, and Android back would then close the app.
  const [navigatorShown, setNavigatorShown] = useState(false);
  if (!navigatorShown && session.status !== 'loading') setNavigatorShown(true);

  const check = useCallback(async () => {
    const result = await runLaunchCheck();
    if (result) setCurrentStep(result.step);
  }, [setCurrentStep]);

  // The launch check runs once; "Try again" runs it again.
  useEffect(() => {
    connectSessionToApi();
    setupQueryEnvironment();
    // A remount (Fast Refresh in development) does not check a known session again.
    if (sessionStore.getState().status === 'loading') void check();
  }, [check]);

  const screen = { contentStyle: { backgroundColor: colors.background } };

  return (
    <>
      <SystemBars />
      {devTrace ? <devTrace.NavigationTrace /> : null}
      {!navigatorShown ? (
        <LaunchScreen error={session.launchError} onRetry={check} />
      ) : (
        <Stack
          screenOptions={{
            // No navigator bar anywhere (the owner's choice): each screen draws its own title and
            // back button in its content (`PageHeader`).
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
            {/* A saved scan's result: a sheet over Home or History (app/scan-result.tsx). */}
            <Stack.Screen
              name="scan-result"
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
