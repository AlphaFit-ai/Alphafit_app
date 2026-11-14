import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { PageHeader, Screen } from '../../src/ui';

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
  const { colors, tokens } = useTheme();

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
        return { title: t('profile.manageData'), data: [] };
    }
  };

  const { title, data } = getDataByType();

  const handleItemPress = (route: string) => {
    // Navigate to the screen and ensure it returns here after update
    router.push({
      pathname: route as any,
      params: { returnTo: 'profile' },
    });
  };

  const renderDataItem = (item: DataItem) => {
    return (
      <TouchableOpacity
        accessibilityRole="button"
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
          <View style={[styles.iconContainer, { backgroundColor: tokens.color.surfaceMuted }]}>
            <Ionicons
              name={item.icon}
              size={22}
              color={item.enabled ? colors.icon : colors.textSecondary}
            />
          </View>
          <View style={styles.dataText}>
            <Text
              style={[
                styles.dataTitle,
                { color: item.enabled ? colors.text : colors.textSecondary },
              ]}
            >
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.dataSubtitle, { color: colors.textSecondary }]}>
                {item.subtitle}
              </Text>
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
    <Screen padded={false}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.title}>
          <PageHeader title={title} />
        </View>
        <View style={[styles.dataList, { backgroundColor: tokens.color.bgSubtle }]}>
          {data.map(renderDataItem)}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  title: { paddingHorizontal: Spacing.screenPaddingHorizontal },
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
