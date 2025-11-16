import { Stack } from 'expo-router';
import { Colors, Fonts } from '../../constants';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTitleStyle: {
          fontFamily: Fonts.bold,
          fontSize: 18,
          fontWeight: '700',
          color: Colors.black,
        },
        headerShadowVisible: false,
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="account-details"
        options={{
          title: 'Account Details',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="language"
        options={{
          title: 'Language',
        }}
      />
    </Stack>
  );
}
