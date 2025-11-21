import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

function OnboardingStack() {
  const { colors } = useTheme();
  
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
