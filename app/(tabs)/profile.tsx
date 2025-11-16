import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Alert, LanguageSelector, ProPlanModal } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  showBadge?: boolean;
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const [showProModal, setShowProModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message?: string; buttons?: any[] }>({ visible: false, title: '' });

  const currentLanguage = i18n.language || 'en';
  const languageNames = { en: 'English', es: 'Español', fr: 'Français' };

  const accountSettings: SettingItem[] = [
    {
      icon: 'person-outline',
      title: t('profile.accountDetails'),
      subtitle: 'John Doe • john@example.com',
      type: 'navigation',
      onPress: () => router.push('/profile/account-details'),
    },
    {
      icon: 'notifications-outline',
      title: t('profile.notifications'),
      subtitle: t('profile.notificationsSubtitle'),
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      icon: 'trophy-outline',
      title: t('profile.subscription'),
      subtitle: t('profile.subscriptionSubtitle'),
      type: 'navigation',
      onPress: () => setShowProModal(true),
      showBadge: true,
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'Language, Theme',
      type: 'navigation',
      onPress: () => router.push('/profile/settings'),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      icon: 'help-circle-outline',
      title: t('profile.support'),
      subtitle: t('profile.supportSubtitle'),
      type: 'navigation',
      onPress: () => setAlertConfig({ visible: true, title: 'Support', message: 'Contact us at support@forgeai.com', buttons: [{ text: 'OK' }] }),
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('profile.privacyPolicy'),
      type: 'navigation',
      onPress: () => setAlertConfig({ visible: true, title: 'Privacy Policy', message: 'View our privacy policy', buttons: [{ text: 'OK' }] }),
    },
    {
      icon: 'document-text-outline',
      title: t('profile.termsOfService'),
      type: 'navigation',
      onPress: () => setAlertConfig({ visible: true, title: 'Terms of Service', message: 'View our terms of service', buttons: [{ text: 'OK' }] }),
    },
  ];

  const handleLanguageSelect = (language: { code: string; name: string; flag: string }) => {
    i18n.changeLanguage(language.code);
  };

  const appSettings: SettingItem[] = [
    {
      icon: 'language-outline',
      title: t('profile.language'),
      subtitle: 'English',
      type: 'navigation',
      onPress: () => router.push('/profile/language'),
    },
    {
      icon: 'moon-outline',
      title: t('profile.darkMode'),
      type: 'toggle',
      value: darkMode,
      onToggle: setDarkMode,
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.title} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={22} color={Colors.black} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: Colors.gray[300], true: Colors.black }}
            thumbColor={Colors.white}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.title}
        style={styles.settingItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon} size={22} color={Colors.black} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <View style={styles.settingRight}>
          {item.showBadge && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <Ionicons name="camera" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>John Doe</Text>
        <Text style={styles.userEmail}>john@example.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.accountSection')}</Text>
        <View style={styles.settingsList}>
          {accountSettings.map(renderSettingItem)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.supportSection')}</Text>
        <View style={styles.settingsList}>
          {supportSettings.map(renderSettingItem)}
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.7}
        onPress={() => setAlertConfig({ 
          visible: true, 
          title: 'Logout', 
          message: 'Are you sure you want to logout?',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => console.log('Logged out') }
          ]
        })}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.red} />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
      <Alert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ visible: false, title: '' })} 
      />
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onSelect={handleLanguageSelect}
        selectedLanguage={currentLanguage}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray[200],
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  section: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  settingsList: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.black,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.red,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.red,
  },
});
