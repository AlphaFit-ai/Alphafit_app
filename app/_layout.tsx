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
import { ProjectionProvider } from '../context/ProjectionContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '../i18n/config';

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
        <DietProvider>
          <ProjectionProvider>
            <RootContent />
          </ProjectionProvider>
        </DietProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return content;
}
