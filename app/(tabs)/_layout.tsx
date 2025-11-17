import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GradientText, ProPlanModal } from '../../components';
import { Colors, Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

export default function TabsLayout() {
  const isWeb = Platform.OS === 'web';
  const pathname = usePathname();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [showProModal, setShowProModal] = useState(false);

  const navItems = [
    { name: 'home', route: '/(tabs)/home', label: 'Home', icon: 'home' as const, iconSet: 'feather' as const },
    { name: 'workouts', route: '/(tabs)/workouts', label: 'Workouts', icon: 'barbell-outline' as const, iconSet: 'ionicons' as const },
    { name: 'projections', route: '/(tabs)/projections', label: 'Scan', icon: 'scan-outline' as const, iconSet: 'ionicons' as const },
    { name: 'diet', route: '/(tabs)/diet', label: 'Diet', icon: 'restaurant-outline' as const, iconSet: 'ionicons' as const },
    { name: 'profile', route: '/(tabs)/profile', label: 'Profile', icon: 'person-outline' as const, iconSet: 'ionicons' as const },
  ];

  return (
    <>
      {isWeb && (
        <View style={styles.webSidebar as any}>
          <View style={styles.webSidebarHeader as any}>
            <GradientText text="FORGE AI" style={styles.webLogoText as any} />
            <TouchableOpacity style={styles.webNotificationButton as any} activeOpacity={0.7}>
              <View style={styles.webNotificationContainer as any}>
                <Ionicons name="notifications-outline" size={24} color={Colors.black} />
                <View style={styles.webNotificationBadge as any} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.webNavContainer as any}>
            {navItems.map((item) => {
              const isActive = pathname === item.route || pathname.startsWith(`/${item.name}`);
              return (
                <Pressable
                  key={item.name}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [
                    styles.webNavItem as any,
                    isActive && (styles.webNavItemActive as any),
                    pressed && (styles.webNavItemPressed as any),
                  ]}
                >
                  {item.iconSet === 'feather' ? (
                    <Feather name={item.icon} size={24} color={isActive ? Colors.black : Colors.gray[400]} />
                  ) : (
                    <Ionicons name={item.icon} size={24} color={isActive ? Colors.black : Colors.gray[400]} />
                  )}
                  <Text style={[
                    styles.webNavLabel as any,
                    { color: isActive ? Colors.black : Colors.gray[400] }
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      <Tabs
        screenOptions={{
          headerShown: !isWeb,
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? Colors.gray[700] : Colors.gray[100],
          },
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <GradientText text="FORGE AI" style={styles.logoText} />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
                <View style={styles.notificationContainer}>
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
                  <View style={styles.notificationBadge} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.proIconButton} activeOpacity={0.7} onPress={() => setShowProModal(true)}>
                <Ionicons name="trophy" size={24} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          ),
          headerTitle: '',
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: Colors.gray[400],
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: isWeb ? { display: 'none' } : {
            backgroundColor: colors.background,
            borderTopColor: isDarkMode ? Colors.gray[700] : Colors.gray[100],
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontFamily: Fonts.semiBold,
            fontSize: 11,
            marginTop: 2,
          },
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
                size={isWeb ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
          ...(isWeb && {
            tabBarLabel: ({ color }) => <Text style={[styles.webLabel, { color }]}>Home</Text>,
          }),
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
                size={isWeb ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
          ...(isWeb && {
            tabBarLabel: ({ color }) => <Text style={[styles.webLabel, { color }]}>Workouts</Text>,
          }),
        }}
      />
      <Tabs.Screen
        name="projections"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.scanIconWrapper}>
              <View style={[styles.scanIconContainer, focused && styles.scanIconContainerActive, isWeb && styles.webScanIcon]}>
                <Ionicons 
                  name="scan" 
                  size={isWeb ? 24 : 32} 
                  color={Colors.white} />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
          tabBarItemStyle: {
            top: 0,
          },
          ...(isWeb && {
            tabBarLabel: ({ color }) => <Text style={[styles.webLabel, { color }]}>Scan</Text>,
          }),
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
                size={isWeb ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
          ...(isWeb && {
            tabBarLabel: ({ color }) => <Text style={[styles.webLabel, { color }]}>Diet</Text>,
          }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.profileIconContainer, focused && styles.profileIconContainerActive, isWeb && styles.webProfileIcon]}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={isWeb ? 24 : 20} 
                color={color} 
              />
            </View>
          ),
          ...(isWeb && {
            tabBarLabel: ({ color }) => <Text style={[styles.webLabel, { color }]}>Profile</Text>,
          }),
        }}
        />
      </Tabs>
      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}const styles = StyleSheet.create({
  headerLeft: {
    marginLeft: 16,
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
  notificationButton: {
    padding: 4,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconContainerActive: {
    backgroundColor: Colors.black,
  },
  // Web-specific styles
  webTabBar: {
    position: 'fixed' as any,
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    height: '100vh' as any,
    flexDirection: 'column',
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[100],
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  webTabBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    width: '100%',
  },
  webTabBarLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginLeft: 16,
  },
  webLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginLeft: 16,
  },
  webScanIcon: {
    marginTop: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  webProfileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  webSidebar: {
    position: 'fixed' as any,
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[100],
    zIndex: 1000,
  },
  webSidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  webLogoText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    fontWeight: '700' as any,
  },
  webNavContainer: {
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  webNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  webNavItemActive: {
    backgroundColor: Colors.gray[100],
  },
  webNavItemPressed: {
    opacity: 0.7,
  },
  webNavLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginLeft: 16,
  },
  webNotificationButton: {
    padding: 4,
  },
  webNotificationContainer: {
    position: 'relative',
  },
  webNotificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  webScanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webScanIconContainerActive: {
    backgroundColor: Colors.primary,
  },
  webProfileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  webProfileIconContainerActive: {
    backgroundColor: Colors.black,
  },
});
