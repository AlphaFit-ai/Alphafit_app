import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="age" />
        <Stack.Screen name="gender" />
        <Stack.Screen name="height" />
        <Stack.Screen name="fitness-level" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="workouts" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="intro" />
      </Stack>
    </OnboardingProvider>
  );
}
