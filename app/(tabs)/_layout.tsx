import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ColorValue, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FEATURES } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useProfilePicture } from '../../hooks/queries';
import { ScanTabButton } from '../../src/scan/ScanTabButton';
import { AppImage } from '../../src/ui';

/**
 * The tab bar hands each icon a `ColorValue` (RN 0.88 types it as string, number or a platform colour);
 * ours are always the plain token strings set as the tint colours, which is what the icon fonts take.
 */
const tint = (color: ColorValue): string | undefined =>
  typeof color === 'string' ? color : undefined;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();
  const insets = useSafeAreaInsets();

  // Fetched once per session and shared, so moving between tabs does not request it again.
  const { uri: userProfilePicture } = useProfilePicture();

  return (
    <Tabs
      // Android back returns to the tab visited before (not always Home); on Home with nothing behind
      // it, back leaves the app.
      backBehavior="history"
      screenOptions={{
        // No bar above the tabs (the owner wants no header): each screen starts under the status
        // bar. The logo and the Pro plan entry are the first row of Home's content.
        headerShown: false,
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
              <Feather name="home" size={24} color={tint(color)} />
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
              <Ionicons
                name={focused ? 'barbell' : 'barbell-outline'}
                size={24}
                color={tint(color)}
              />
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
              <Ionicons name={focused ? 'body' : 'body-outline'} size={24} color={tint(color)} />
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
                color={tint(color)}
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
                style={[styles.profileAvatarWrapper, focused && styles.profileAvatarWrapperActive]}
              >
                <AppImage
                  source={{ uri: userProfilePicture }}
                  style={styles.profileAvatar}
                  accessible={false}
                />
              </View>
            ) : (
              <View style={[styles.profileIconContainer, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={20}
                  color={tint(color)}
                />
              </View>
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
