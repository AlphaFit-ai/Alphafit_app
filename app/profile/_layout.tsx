import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

function ProfileStack() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  const stackContent = (
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
      <Stack.Screen
        name="manage-data"
        options={{
          title: t('profile.myDataSection'),
        }}
      />
    </Stack>
  );

  if (isWeb) {
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
        <View style={styles.webContentWrapper}>
          {stackContent}
        </View>
      </View>
    );
  }

  return stackContent;
}

export default function ProfileLayout() {
  return <ProfileStack />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContentWrapper: {
    width: '100%',
    maxWidth: 800,
    height: '100%',
    overflow: 'hidden',
  },
});
