import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProPlanModal } from '../../components';

import { Colors, FEATURES } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useProfilePicture } from '../../hooks/queries';
import { ScanTabButton } from '../../src/scan/ScanTabButton';
import { AppImage, BrandLogo } from '../../src/ui';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [showProModal, setShowProModal] = useState(false);

  // Fetched once per session and shared, so moving between tabs does not request it again.
  const { uri: userProfilePicture } = useProfilePicture();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: tokens.color.border,
          },
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <BrandLogo height={28} />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.proIconButton}
                activeOpacity={0.7}
                onPress={() => setShowProModal(true)}
                accessibilityRole="button"
                accessibilityLabel={t('tabs.proPlan')}
              >
                <Ionicons name="trophy" size={24} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          ),
          headerTitle: '',
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: tokens.color.textSubtle,
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: tokens.color.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
          animation: 'shift',
          // Tabs are created the first time they are opened, not all at once at launch.
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.home'),
            tabBarAccessibilityLabel: t('tabs.home'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Feather name="home" size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: t('tabs.workouts'),
            tabBarAccessibilityLabel: t('tabs.workouts'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            // The app's main action in the centre: opens the food scan, never selected itself.
            title: t('tabs.scan'),
            tabBarButton: ({ style }) => <ScanTabButton style={style} />,
          }}
        />
        <Tabs.Screen
          name="projections"
          options={{
            // D2: not offered until the physique analysis exists (see constants/Features.ts).
            href: FEATURES.projections ? undefined : null,
            title: t('tabs.projections'),
            tabBarAccessibilityLabel: t('tabs.projections'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons name={focused ? 'body' : 'body-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="diet"
          options={{
            title: t('tabs.diet'),
            tabBarAccessibilityLabel: t('tabs.diet'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={focused ? 'restaurant' : 'restaurant-outline'}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarAccessibilityLabel: t('tabs.profile'),
            tabBarIcon: ({ color, focused }) =>
              userProfilePicture ? (
                <View
                  style={[
                    styles.profileAvatarWrapper,
                    focused && styles.profileAvatarWrapperActive,
                  ]}
                >
                  <AppImage
                    source={{ uri: userProfilePicture }}
                    style={styles.profileAvatar}
                    accessible={false}
                  />
                </View>
              ) : (
                <View style={[styles.profileIconContainer, focused && styles.iconWrapperActive]}>
                  <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
                </View>
              ),
          }}
        />
      </Tabs>
      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 16,
  },
  proIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    transform: [{ scale: 1.1 }],
  },
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileAvatarWrapperActive: {
    borderColor: Colors.primary,
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});
