import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useSession } from '../../services/sessionStore';

// The onboarding data lives in the query cache and the wizard state in the OnboardingProvider mounted
// once in the root layout; mounting another provider here would hide them from screens outside it.
export default function OnboardingLayout() {
  const { colors } = useTheme();
  const { status } = useSession();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* The fallback when a guard turns someone away from a screen below: back to `/`. */}
      <Stack.Screen name="index" />
      {/* Only for someone who is not signed in. */}
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="intro" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      {/* The question screens: while onboarding, and later when a profile screen edits an answer. */}
      <Stack.Protected guard={status === 'onboarding' || status === 'ready'}>
        <Stack.Screen name="source" />
        <Stack.Screen name="age" />
        <Stack.Screen name="gender" />
        <Stack.Screen name="height" />
        <Stack.Screen name="fitness-level" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="workouts" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="goal" />
      </Stack.Protected>
    </Stack>
  );
}
