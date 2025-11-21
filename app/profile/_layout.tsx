import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileLayout() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: Fonts.bold,
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        headerTitleAlign: 'center',
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerShown: true,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen
        name="account-details"
        options={{
          title: t('profile.accountDetails'),
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: t('profile.appSettings'),
        }}
      />
      <Stack.Screen
        name="language"
        options={{
          title: t('profile.language'),
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          title: t('profile.faq', 'FAQs'),
        }}
      />
      <Stack.Screen
        name="help-support"
        options={{
          title: t('profile.helpAndSupport', 'Help & Support'),
        }}
      />
    </Stack>
  );
}
