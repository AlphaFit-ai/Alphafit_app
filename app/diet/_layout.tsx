import { Stack } from 'expo-router';
import { DietProvider } from '../../context/DietContext';

export default function DietLayout() {
  return (
    <DietProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="diet-preference" />
        <Stack.Screen name="allergies" />
        <Stack.Screen name="meals" />
        <Stack.Screen name="supplements" />
      </Stack>
    </DietProvider>
  );
}
