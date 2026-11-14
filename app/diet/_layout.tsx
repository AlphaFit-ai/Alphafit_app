import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

// The diet data lives in the DietProvider mounted once in the root layout, so the Diet tab and these
// routes (opened from the profile) share one copy.
export default function DietLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="diet-preference" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="meals" />
      <Stack.Screen name="supplements" />

      <Stack.Screen name="barcode-result" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
