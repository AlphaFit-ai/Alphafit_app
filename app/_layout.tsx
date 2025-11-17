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
import { LogBox, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DietProvider } from '../context/DietContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '../i18n/config';

// Suppress SafeAreaView deprecation warning from expo-router
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="diet" />
        <Stack.Screen name="index" />
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
          <RootContent />
        </DietProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  // @ts-ignore - Web-specific Platform.OS check
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webContent}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  webContent: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
  },
});
