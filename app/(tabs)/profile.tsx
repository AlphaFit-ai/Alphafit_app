import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Modal, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Alert, ImageUpload, LanguageSelector, ProPlanModal } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { firebaseAuthService, imageService, userService } from '../../services';
import type { UserProfile } from '../../services/userService';

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
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [showProModal, setShowProModal] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message?: string; buttons?: any[] }>({ visible: false, title: '' });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const currentLanguage = i18n.language || 'en';
  const languageNames = { en: 'English', es: 'Español', fr: 'Français' };

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const [profile, profilePic] = await Promise.all([
        userService.getUserProfile(),
        imageService.getProfilePicture()
      ]);
      setUserProfile(profile);
      setUserProfilePicture(profilePic);
    } catch (error: any) {
      const is404 = error?.response?.status === 404;
      const is401 = error?.response?.status === 401;

      if (is404 || is401) {
        // User doesn't exist or token expired - sign out and redirect to login
        await firebaseAuthService.signOut();
        router.replace('/onboarding/login');
      } else {
        console.error('Failed to load user data:', error);
      }
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = useCallback(() => {
    loadUserData(true);
  }, []);

  const handleProfilePictureUpdate = async (imageUrl: string) => {
    // Update local state immediately for instant feedback
    setUserProfilePicture(imageUrl);

    // Force immediate refresh to sync with backend
    await loadUserData(true);
  };

  const myDataSettings: SettingItem[] = [
    {
      icon: 'people-outline',
      title: t('profile.onboardingData'),
      subtitle: t('profile.onboardingDataSubtitle'),
      type: 'navigation',
      onPress: () => router.push('/profile/manage-data?type=onboarding'),
    },
    {
      icon: 'restaurant-outline',
      title: t('profile.dietData'),
      subtitle: t('profile.dietDataSubtitle'),
      type: 'navigation',
      onPress: () => router.push('/profile/manage-data?type=diet'),
    },
    {
      icon: 'analytics-outline',
      title: t('profile.projectionData'),
      subtitle: t('profile.projectionDataSubtitle'),
      type: 'navigation',
      onPress: () => router.push('/profile/manage-data?type=projection'),
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      icon: 'person-outline',
      title: t('profile.accountDetails'),
      subtitle: userProfile ? `${userProfile.fullName || 'User'} • ${userProfile.email || ''}` : 'Loading...',
      type: 'navigation',
      onPress: () => router.push('/profile/account-details'),
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
      title: t('profile.faq', 'FAQs'),
      subtitle: t('profile.faqSubtitle', 'Common questions & answers'),
      type: 'navigation',
      onPress: () => router.push('/profile/faq'),
    },
    {
      icon: 'information-circle-outline',
      title: t('profile.helpAndSupport', 'Help & Support'),
      subtitle: t('profile.helpAndSupportSubtitle', 'Privacy, Terms, Contact'),
      type: 'navigation',
      onPress: () => router.push('/profile/help-support'),
    },
  ];

  const handleLanguageSelect = (language: { code: string; name: string; flag: string }) => {
    i18n.changeLanguage(language.code);
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.signOut();
      // Navigate to login screen
      router.replace('/onboarding/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      setAlertConfig({
        visible: true,
        title: 'Logout Failed',
        message: error.message || 'Failed to logout. Please try again.',
        buttons: [{ text: 'OK', style: 'cancel' }]
      });
    }
  };

  const handleDeleteAccount = async () => {
    const trimmedConfirmation = deleteConfirmation.trim();
    if (trimmedConfirmation !== 'Delete my account') {
      setAlertConfig({
        visible: true,
        title: 'Invalid Confirmation',
        message: 'Please type "Delete my account" exactly to confirm.',
        buttons: [{ text: 'OK', style: 'cancel' }]
      });
      return;
    }

    try {
      setIsDeleting(true);
      console.log('Sending delete request with confirmation:', trimmedConfirmation);
      await userService.deactivateAccount(trimmedConfirmation);
      await firebaseAuthService.signOut();
      setShowDeleteModal(false);
      router.replace('/onboarding/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      setAlertConfig({
        visible: true,
        title: 'Delete Account Failed',
        message: error.message || 'Failed to delete account. Please try again.',
        buttons: [{ text: 'OK', style: 'cancel' }]
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation('');
    }
  };

  const appSettings: SettingItem[] = [
    {
      icon: 'language-outline',
      title: t('profile.language'),
      subtitle: languageNames[currentLanguage as keyof typeof languageNames],
      type: 'navigation',
      onPress: () => router.push('/profile/language'),
    },
    {
      icon: 'moon-outline',
      title: t('profile.darkMode'),
      type: 'toggle',
      value: isDarkMode,
      onToggle: toggleTheme,
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.title} style={[styles.settingItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
              <Ionicons name={item.icon} size={22} color={colors.icon} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
              {item.subtitle && (
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: Colors.gray[300], true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.title}
        style={[styles.settingItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
            <Ionicons name={item.icon} size={22} color={colors.icon} />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          <ImageUpload
            key={userProfilePicture || 'no-image'}
            currentImageUrl={userProfilePicture}
            onImageUploaded={handleProfilePictureUpdate}
            uploadType="profile"
            size={120}
            rounded={true}
          />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {userProfile?.fullName || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {userProfile?.email || 'user@example.com'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.accountSection')}</Text>
        <View style={[styles.settingsList, { backgroundColor: isDarkMode ? Colors.gray[900] : Colors.gray[50] }]}>
          {accountSettings.map(renderSettingItem)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.myDataSection')}</Text>
        <View style={[styles.settingsList, { backgroundColor: isDarkMode ? Colors.gray[900] : Colors.gray[50] }]}>
          {myDataSettings.map(renderSettingItem)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.supportSection')}</Text>
        <View style={[styles.settingsList, { backgroundColor: isDarkMode ? Colors.gray[900] : Colors.gray[50] }]}>
          {supportSettings.map(renderSettingItem)}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: Colors.red }]}
        activeOpacity={0.7}
        onPress={() => setAlertConfig({
          visible: true,
          title: 'Logout',
          message: 'Are you sure you want to logout?',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: handleLogout }
          ]
        })}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.red} />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, { borderColor: Colors.red, backgroundColor: Colors.red + '10' }]}
        activeOpacity={0.7}
        onPress={() => setShowDeleteModal(true)}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.red} />
        <Text style={styles.deleteText}>Delete Account</Text>
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

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              This will permanently delete your account and all your data. This action cannot be undone.
            </Text>

            <Text style={[styles.modalLabel, { color: colors.text }]}>Type "Delete my account" to confirm:</Text>
            <TextInput
              style={[styles.confirmationInput, {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                color: colors.text,
                borderColor: colors.border
              }]}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="Delete my account"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeleting}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={isDeleting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton, { backgroundColor: Colors.red }]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: Colors.white }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  avatarWrapper: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
    marginTop: 4,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  deleteText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.gray[600],
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.black,
    marginBottom: 8,
  },
  confirmationInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalDeleteButton: {
    backgroundColor: Colors.red,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
