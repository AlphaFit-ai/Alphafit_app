import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface DataItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  route: string;
  enabled: boolean;
}

export default function ManageDataScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();

  const onboardingData: DataItem[] = [
    {
      icon: 'flag-outline',
      title: t('manageData.goal'),
      subtitle: t('manageData.goalSubtitle'),
      route: '/onboarding/goal',
      enabled: true,
    },
    {
      icon: 'resize-outline',
      title: t('manageData.heightWeight'),
      subtitle: t('manageData.heightWeightSubtitle'),
      route: '/onboarding/height',
      enabled: true,
    },
    {
      icon: 'walk-outline',
      title: t('manageData.activity'),
      subtitle: t('manageData.activitySubtitle'),
      route: '/onboarding/activity',
      enabled: true,
    },
    {
      icon: 'barbell-outline',
      title: t('manageData.workouts'),
      subtitle: t('manageData.workoutsSubtitle'),
      route: '/onboarding/workouts',
      enabled: true,
    },
    {
      icon: 'fitness-outline',
      title: t('manageData.fitnessLevel'),
      subtitle: t('manageData.fitnessLevelSubtitle'),
      route: '/onboarding/fitness-level',
      enabled: true,
    },
    {
      icon: 'hardware-chip-outline',
      title: t('manageData.equipment'),
      subtitle: t('manageData.equipmentSubtitle'),
      route: '/onboarding/equipment',
      enabled: true,
    },
    {
      icon: 'location-outline',
      title: t('manageData.source'),
      subtitle: t('manageData.sourceSubtitle'),
      route: '/onboarding/source',
      enabled: true,
    },
  ];

  const dietData: DataItem[] = [
    {
      icon: 'restaurant-outline',
      title: t('manageData.dietPreference'),
      subtitle: t('manageData.dietPreferenceSubtitle'),
      route: '/diet/diet-preference',
      enabled: true,
    },
    {
      icon: 'fast-food-outline',
      title: t('manageData.mealsPerDay'),
      subtitle: t('manageData.mealsPerDaySubtitle'),
      route: '/diet/meals',
      enabled: true,
    },
    {
      icon: 'warning-outline',
      title: t('manageData.allergies'),
      subtitle: t('manageData.allergiesSubtitle'),
      route: '/diet/allergies',
      enabled: true,
    },
    {
      icon: 'medical-outline',
      title: t('manageData.supplements'),
      subtitle: t('manageData.supplementsSubtitle'),
      route: '/diet/supplements',
      enabled: true,
    },
  ];

  const projectionData: DataItem[] = [
    {
      icon: 'moon-outline',
      title: t('manageData.sleep'),
      subtitle: t('manageData.sleepSubtitle'),
      route: '/projection/sleep',
      enabled: true,
    },
    {
      icon: 'footsteps-outline',
      title: t('manageData.steps'),
      subtitle: t('manageData.stepsSubtitle'),
      route: '/projection/steps',
      enabled: true,
    },
    {
      icon: 'heart-outline',
      title: t('manageData.stress'),
      subtitle: t('manageData.stressSubtitle'),
      route: '/projection/stress',
      enabled: true,
    },
  ];

  const getDataByType = () => {
    switch (type) {
      case 'onboarding':
        return { title: t('manageData.onboardingTitle'), data: onboardingData };
      case 'diet':
        return { title: t('manageData.dietTitle'), data: dietData };
      case 'projection':
        return { title: t('manageData.projectionTitle'), data: projectionData };
      default:
        return { title: 'Manage Data', data: [] };
    }
  };

  const { title, data } = getDataByType();

  // Set dynamic screen title
  useEffect(() => {
    navigation.setOptions({
      title: title,
    });
  }, [navigation, title]);

  const handleItemPress = (route: string) => {
    // Navigate to the screen and ensure it returns here after update
    router.push({
      pathname: route as any,
      params: { returnTo: 'profile' }
    });
  };

  const renderDataItem = (item: DataItem) => {
    return (
      <TouchableOpacity
        key={item.title}
        style={[
          styles.dataItem,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            opacity: item.enabled ? 1 : 0.5,
          },
        ]}
        onPress={() => item.enabled && handleItemPress(item.route)}
        activeOpacity={item.enabled ? 0.7 : 1}
        disabled={!item.enabled}
      >
        <View style={styles.dataLeft}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
            <Ionicons name={item.icon} size={22} color={item.enabled ? colors.icon : colors.textSecondary} />
          </View>
          <View style={styles.dataText}>
            <Text style={[styles.dataTitle, { color: item.enabled ? colors.text : colors.textSecondary }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.dataSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <View style={styles.dataRight}>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('manageData.infoMessage')}
          </Text>
        </View>

        <View style={[styles.dataList, { backgroundColor: isDarkMode ? Colors.gray[900] : Colors.gray[50] }]}>
          {data.map(renderDataItem)}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  dataList: {
    marginHorizontal: Spacing.md,
    borderRadius: Spacing.radius.md,
    overflow: 'hidden',
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  dataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataText: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  dataSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  dataRight: {
    marginLeft: Spacing.sm,
  },
});
