import { Stack } from 'expo-router';
import { DietProvider } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

function DietStack() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="diet-preference" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="meals" />
      <Stack.Screen name="supplements" />
    </Stack>
  );
}

export default function DietLayout() {
  return (
    <DietProvider>
      <DietStack />
    </DietProvider>
  );
}
