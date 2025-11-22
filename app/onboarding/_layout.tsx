import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

function OnboardingStack() {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
        <View style={styles.webContentWrapper}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="splash" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="age" />
            <Stack.Screen name="gender" />
            <Stack.Screen name="height" />
            <Stack.Screen name="fitness-level" />
            <Stack.Screen name="activity" />
            <Stack.Screen name="workouts" />
            <Stack.Screen name="equipment" />
            <Stack.Screen name="intro" />
          </Stack>
        </View>
      </View>
    );
  }
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="age" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="height" />
      <Stack.Screen name="fitness-level" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="workouts" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="intro" />
    </Stack>
  );
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingStack />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContentWrapper: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    overflow: 'hidden',
  },
});
