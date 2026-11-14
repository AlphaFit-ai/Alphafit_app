import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

/**
 * The Profile screens. No navigator bar (the owner wants no header): each screen opens with its own
 * `PageHeader` (round back button and large title) at the top of its scrolling content.
 */
function ProfileStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="account-details" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="language" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="manage-data" />
    </Stack>
  );
}

export default function ProfileLayout() {
  return <ProfileStack />;
}
