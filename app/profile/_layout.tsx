import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="account-details"
        options={{
          title: 'Account Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="language"
        options={{
          title: 'Language',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
