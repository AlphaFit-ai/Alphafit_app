import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ImageUpload, ProPlanModal } from '../../components';
import { Colors, Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useProfile, useProfilePicture, useRefetchWhenStale } from '../../hooks/queries';
import { userService } from '../../services';
import { logError, normalizeApiError } from '../../services/apiError';
import { signOut } from '../../services/session';
import {
  Button,
  Dialog,
  ErrorState,
  Input,
  ListItem,
  Screen,
  Skeleton,
  SkeletonGroup,
  Text,
} from '../../src/ui';

/** The api requires exactly this text to deactivate an account (CONTRACTS section 2). */
const DELETE_CONFIRMATION_PHRASE = 'Delete my account';

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showBadge?: boolean;
}

interface AlertConfig {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [showProModal, setShowProModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, title: '' });
  // The profile and the picture come from the query cache: shown at once from the last known copy,
  // refreshed in the background. A session that cannot be renewed signs out inside the api client.
  const profileQuery = useProfile();
  const userProfile = profileQuery.data ?? null;
  // Nothing to show yet: a failed load, or no connection, is an error state with a retry.
  const loadError = userProfile
    ? null
    : profileQuery.isError
      ? normalizeApiError(profileQuery.error)
      : profileQuery.isPaused
        ? { kind: 'offline' as const }
        : null;
  const isLoading = profileQuery.isPending && !profileQuery.isPaused;
  const {
    uri: userProfilePicture,
    pending: avatarPending,
    refresh: refreshProfilePicture,
    setUri: setProfilePicture,
  } = useProfilePicture();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh a profile that is more than a minute old when the tab comes back into focus.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );
  useRefetchWhenStale(profileQuery, focused);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([profileQuery.refetch(), refreshProfilePicture()]);
    setIsRefreshing(false);
  }, [profileQuery, refreshProfilePicture]);

  const handleProfilePictureUpdate = (imageUrl: string) => {
    // Update the shared cache so the tab bar and the chat pick the new picture up immediately.
    setProfilePicture(imageUrl);
  };

  const myDataSettings: SettingItem[] = [
    {
      icon: 'people-outline',
      title: t('profile.onboardingData'),
      subtitle: t('profile.onboardingDataSubtitle'),
      onPress: () => router.push('/profile/manage-data?type=onboarding'),
    },
    {
      icon: 'restaurant-outline',
      title: t('profile.dietData'),
      subtitle: t('profile.dietDataSubtitle'),
      onPress: () => router.push('/profile/manage-data?type=diet'),
    },
    {
      icon: 'analytics-outline',
      title: t('profile.projectionData'),
      subtitle: t('profile.projectionDataSubtitle'),
      onPress: () => router.push('/profile/manage-data?type=projection'),
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      icon: 'person-outline',
      title: t('profile.accountDetails'),
      subtitle: userProfile
        ? `${userProfile.fullName || t('profile.defaultName')} • ${userProfile.email || ''}`
        : t('common.loading'),
      onPress: () => router.push('/profile/account-details'),
    },
    {
      icon: 'trophy-outline',
      title: t('profile.subscription'),
      subtitle: t('profile.subscriptionSubtitle'),
      onPress: () => setShowProModal(true),
      showBadge: true,
    },
    {
      icon: 'settings-outline',
      title: t('profile.settings'),
      subtitle: t('profile.settingsSubtitle'),
      onPress: () => router.push('/profile/settings'),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      icon: 'help-circle-outline',
      title: t('profile.faq'),
      subtitle: t('profile.faqSubtitle'),
      onPress: () => router.push('/profile/faq'),
    },
    {
      icon: 'information-circle-outline',
      title: t('profile.helpAndSupport'),
      subtitle: t('profile.helpAndSupportSubtitle'),
      onPress: () => router.push('/profile/help-support'),
    },
  ];

  const handleLogout = async () => {
    // One sign-out for every way out: token, stores, Firebase and Google are all cleared.
    await signOut();
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
    const trimmedConfirmation = deleteConfirmation.trim();
    if (trimmedConfirmation !== DELETE_CONFIRMATION_PHRASE) {
      setAlertConfig({
        visible: true,
        title: t('profile.deleteAccountInvalidTitle'),
        message: t('profile.deleteAccountInvalidMessage', { phrase: DELETE_CONFIRMATION_PHRASE }),
        buttons: [{ text: t('common.ok'), style: 'cancel' }],
      });
      return;
    }

    try {
      setIsDeleting(true);
      await userService.deactivateAccount(trimmedConfirmation);
      // The account is deactivated; clear this phone the same way a logout does.
      await signOut();
      setShowDeleteModal(false);
      router.replace('/');
    } catch (error: unknown) {
      logError('profile.delete', error);
      const normalized = normalizeApiError(error);
      setAlertConfig({
        visible: true,
        title: t('profile.deleteAccountFailedTitle'),
        message:
          normalized.kind === 'offline'
            ? t('errors.offline')
            : t('profile.deleteAccountFailedMessage'),
        buttons: [{ text: t('common.ok'), style: 'cancel' }],
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation('');
    }
  };

  const renderItems = (items: SettingItem[]) =>
    items.map((item) => (
      <ListItem
        key={item.title}
        icon={item.icon}
        title={item.title}
        subtitle={item.subtitle}
        onPress={item.onPress}
        trailing={
          item.showBadge ? (
            <View style={[styles.proBadge, { backgroundColor: tokens.color.premium }]}>
              <Text
                variant="caption"
                style={{ color: tokens.color.onPremium, fontFamily: Fonts.bold }}
              >
                PRO
              </Text>
            </View>
          ) : undefined
        }
      />
    ));

  if (isLoading) {
    return (
      <Screen scroll>
        <SkeletonGroup label={t('common.loading')} style={styles.skeleton}>
          <Skeleton width={120} height={120} radius={60} style={styles.center} />
          <Skeleton width="50%" height={24} style={styles.center} />
          <Skeleton height={64} radius={16} />
          <Skeleton height={64} radius={16} />
          <Skeleton height={64} radius={16} />
        </SkeletonGroup>
      </Screen>
    );
  }

  // The profile could not be loaded and there is nothing to show: say so and offer a retry.
  if (loadError && !userProfile) {
    return (
      <Screen>
        <ErrorState kind={loadError.kind} onRetry={() => void profileQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={tokens.color.accent}
        />
      }
    >
      <View style={styles.profileSection}>
        {avatarPending ? (
          // The picture is still being looked up: a placeholder, so the "Add photo" slot does not flash.
          <Skeleton width={120} height={120} radius={60} />
        ) : (
          <ImageUpload
            currentImageUrl={userProfilePicture}
            onImageUploaded={handleProfilePictureUpdate}
            uploadType="profile"
            size={120}
            rounded={true}
          />
        )}
        <Text variant="title" accessibilityRole="header" style={styles.center}>
          {userProfile?.fullName || t('profile.defaultName')}
        </Text>
        <Text tone="muted">{userProfile?.email || ''}</Text>
      </View>

      <Text variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {t('profile.accountSection')}
      </Text>
      {renderItems(accountSettings)}

      <Text variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {t('profile.myDataSection')}
      </Text>
      {renderItems(myDataSettings)}

      <Text variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {t('profile.supportSection')}
      </Text>
      {renderItems(supportSettings)}

      <View style={styles.dangerZone}>
        <Button
          variant="outline"
          icon="log-out-outline"
          iconPosition="left"
          title={t('profile.logout')}
          onPress={() =>
            setAlertConfig({
              visible: true,
              title: t('profile.logout'),
              message: t('profile.logoutConfirmMessage'),
              buttons: [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('profile.logout'), style: 'destructive', onPress: handleLogout },
              ],
            })
          }
        />
        <Button
          variant="dangerOutline"
          icon="trash-outline"
          iconPosition="left"
          title={t('profile.deleteAccount')}
          onPress={() => setShowDeleteModal(true)}
        />
      </View>

      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
      <Dialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.buttons?.map((b) => ({
          label: b.text,
          tone: b.style,
          onPress: b.onPress,
        }))}
        onClose={() => setAlertConfig({ visible: false, title: '' })}
      />

      {/* Deleting the account: the exact phrase is required (CONTRACTS section 2) */}
      <Dialog
        visible={showDeleteModal}
        title={t('profile.deleteAccount')}
        message={t('profile.deleteAccountMessage')}
        dismissable={!isDeleting}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        actions={[
          { label: t('common.cancel'), tone: 'cancel' },
          {
            label: t('common.delete'),
            tone: 'destructive',
            keepOpen: true,
            loading: isDeleting,
            onPress: handleDeleteAccount,
          },
        ]}
      >
        <Input
          label={t('profile.deleteAccountPrompt', { phrase: DELETE_CONFIRMATION_PHRASE })}
          value={deleteConfirmation}
          onChangeText={setDeleteConfirmation}
          placeholder={DELETE_CONFIRMATION_PHRASE}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isDeleting}
        />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  skeleton: { paddingTop: 8, gap: 16 },
  center: { alignSelf: 'center', textAlign: 'center' },
  profileSection: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  sectionTitle: { marginTop: 24, marginBottom: 4 },
  proBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dangerZone: { gap: 12, marginTop: 32 },
});
