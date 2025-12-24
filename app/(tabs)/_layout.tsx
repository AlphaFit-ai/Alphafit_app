import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientText, ProPlanModal } from '../../components';

import { Colors, Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { imageService } from '../../services';

export default function TabsLayout() {
  const pathname = usePathname();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [showProModal, setShowProModal] = useState(false);

  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);

  const loadUserProfilePicture = useCallback(async () => {
    try {
      const profilePicUrl = await imageService.getProfilePicture();
      setUserProfilePicture(profilePicUrl);
    } catch (error) {
      console.log('No profile picture found');
    }
  }, []);

  useEffect(() => {
    loadUserProfilePicture();
  }, [loadUserProfilePicture]);

  // Refresh profile picture when navigating between tabs
  useEffect(() => {
    if (pathname) {
      loadUserProfilePicture();
    }
  }, [pathname, loadUserProfilePicture]);

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
            borderBottomColor: isDarkMode ? Colors.gray[700] : Colors.gray[100],
          },
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.faviconImage}
              />
              <GradientText text="ALPHAFIT AI" style={styles.logoText} />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.proIconButton} activeOpacity={0.7} onPress={() => setShowProModal(true)}>
                <Ionicons name="trophy" size={24} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          ),
          headerTitle: '',
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: Colors.gray[400],
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: isDarkMode ? Colors.gray[700] : Colors.gray[100],
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
          animation: 'shift',
          lazy: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Feather
                  name="home"
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={focused ? "barbell" : "barbell-outline"}
                  size={24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="projections"
          options={{
            title: '',
            tabBarIcon: ({ focused }) => (
              <View style={styles.scanIconWrapper}>
                <View style={[styles.scanIconContainer, focused && styles.scanIconContainerActive]}>
                  <Ionicons
                    name="scan"
                    size={32}
                    color={Colors.white} />
                </View>
              </View>
            ),
            tabBarLabel: () => null,
            tabBarItemStyle: {
              top: 0,
            },
          }}
        />
        <Tabs.Screen
          name="diet"
          options={{
            title: 'Diet',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={focused ? "restaurant" : "restaurant-outline"}
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
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              userProfilePicture ? (
                <View style={[styles.profileAvatarWrapper, focused && styles.profileAvatarWrapperActive]}>
                  <Image
                    key={userProfilePicture}
                    source={{ uri: userProfilePicture, cache: 'reload' }}
                    style={styles.profileAvatar}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={[styles.profileIconContainer, focused && styles.iconWrapperActive]}>
                  <Ionicons
                    name={focused ? "person" : "person-outline"}
                    size={20}
                    color={color}
                  />
                </View>
              )
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
  logoText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700' as any,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 16,
  },
  proIconButton: {
    padding: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    transform: [{ scale: 1.1 }],
  },
  scanIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  scanIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 35,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIconContainerActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.05 }],
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
  faviconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
});
