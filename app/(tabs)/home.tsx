import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';

interface QuickStatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  route: string;
}

interface WorkoutCard {
  name: string;
  duration: string;
  calories: string;
  image: string;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { onboardingData } = useOnboarding();
  const { projectionData } = useProjection();
  const { dietData } = useDiet();

  // Get user's name or default greeting
  const userName = onboardingData.email?.split('@')[0] || 'User';
  const userGoal = onboardingData.goal || 'Build Muscle';
  const fitnessLevel = onboardingData.fitnessLevel || 'Intermediate';

  // Mock data - will be replaced with actual user data
  const quickStats: QuickStatCard[] = [
    {
      label: 'Physique Score',
      value: '97',
      icon: 'trophy',
      color: Colors.warning,
      route: '/(tabs)/projections',
    },
    {
      label: 'Calories Today',
      value: '1,850',
      icon: 'flame',
      color: Colors.error,
      route: '/(tabs)/diet',
    },
    {
      label: 'Workouts',
      value: '12/20',
      icon: 'barbell',
      color: Colors.primary,
      route: '/(tabs)/workouts',
    },
    {
      label: 'Body Fat',
      value: '18%',
      icon: 'analytics',
      color: Colors.success,
      route: '/(tabs)/projections',
    },
  ];

  const todayWorkouts: WorkoutCard[] = [
    {
      name: 'Upper Body Strength',
      duration: '45 min',
      calories: '320 kcal',
      image: '../../assets/images/home/goal-banner.png',
    },
    {
      name: 'Core & Abs',
      duration: '30 min',
      calories: '180 kcal',
      image: '../../assets/images/home/goal-banner.png',
    },
  ];

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  // Motivational quotes based on user's goal
  const motivationalQuotes = {
    'Build Muscle': [
      'Strength doesn\'t come from what you can do. It comes from overcoming the things you thought you couldn\'t.',
      'The pain you feel today will be the strength you feel tomorrow.',
      'Your body can stand almost anything. It\'s your mind you have to convince.',
    ],
    'Lose Weight': [
      'Don\'t wish for it, work for it.',
      'The only bad workout is the one that didn\'t happen.',
      'Success is the sum of small efforts repeated day in and day out.',
    ],
    'Get Fit': [
      'Take care of your body. It\'s the only place you have to live.',
      'Fitness is not about being better than someone else. It\'s about being better than you used to be.',
      'The only way to define your limits is by going beyond them.',
    ],
    'Stay Healthy': [
      'Health is wealth. Invest in yourself.',
      'Every workout is progress. Keep moving forward.',
      'Your health is an investment, not an expense.',
    ],
  };

  const getRandomQuote = () => {
    const quotes = motivationalQuotes[userGoal as keyof typeof motivationalQuotes] || motivationalQuotes['Get Fit'];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const motivationalQuote = getRandomQuote();

  // Calculate age from date of birth
  const calculateAge = (dob: { month: number; day: number; year: number } | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob.year, dob.month - 1, dob.day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = calculateAge(onboardingData.dateOfBirth);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motivational Banner */}
        <View
          style={[
            styles.motivationalBanner,
            {
              backgroundColor: isDarkMode ? Colors.gray[800] : Colors.primary + '15',
            },
          ]}
        >
          <View style={styles.quoteIconContainer}>
            <Ionicons name="barbell" size={24} color={Colors.primary} />
          </View>
          <Text style={[styles.motivationalQuote, { color: colors.text }]}>
            {motivationalQuote}
          </Text>
        </View>

        {/* User Stats Summary */}
        <View
          style={[
            styles.userStatsSummary,
            {
              backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
              borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
            },
          ]}
        >
          <View style={styles.statsSummaryHeader}>
            <Text style={[styles.statsSummaryTitle, { color: colors.text }]}>
              {t('home.yourJourney', 'Your Journey')}
            </Text>
            <View style={[styles.goalBadge, { backgroundColor: Colors.primary + '20' }]}>
              <Text style={[styles.goalBadgeText, { color: Colors.primary }]}>
                {userGoal}
              </Text>
            </View>
          </View>
          <View style={styles.userStatsGrid}>
            {userAge && (
              <View style={styles.userStatItem}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.userStatValue, { color: colors.text }]}>{userAge} years</Text>
              </View>
            )}
            {onboardingData.fitnessLevel && (
              <View style={styles.userStatItem}>
                <Ionicons name="fitness-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.userStatValue, { color: colors.text }]}>{onboardingData.fitnessLevel}</Text>
              </View>
            )}
            {onboardingData.workoutsPerWeek && (
              <View style={styles.userStatItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.userStatValue, { color: colors.text }]}>{onboardingData.workoutsPerWeek}x per week</Text>
              </View>
            )}
            {onboardingData.activityLevel && (
              <View style={styles.userStatItem}>
                <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.userStatValue, { color: colors.text }]}>{onboardingData.activityLevel}</Text>
              </View>
            )}
            {projectionData.sleepHours && (
              <View style={styles.userStatItem}>
                <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.userStatValue, { color: colors.text }]}>{projectionData.sleepHours} hrs sleep</Text>
              </View>
            )}
            {onboardingData.height && (
              <View style={styles.userStatItem}>
                <Ionicons name="resize-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.userStatValue, { color: colors.text }]}>
                  {onboardingData.height.unit === 'metric' 
                    ? `${onboardingData.height.cm} cm` 
                    : `${onboardingData.height.feet}'${onboardingData.height.inches}"`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.quickStats', 'Quick Stats')}
          </Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                    borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                  },
                ]}
                onPress={() => handleNavigate(stat.route)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: stat.color + '20' },
                  ]}
                >
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {stat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.todayWorkouts', "Today's Workouts")}
            </Text>
            <TouchableOpacity onPress={() => handleNavigate('/(tabs)/workouts')}>
              <Text style={[styles.seeAll, { color: Colors.primary }]}>
                {t('home.seeAll', 'See All')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.workoutsList}>
            {todayWorkouts.map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.workoutCard,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                    borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.workoutImageContainer}>
                  <Image
                    source={require('../../assets/images/home/goal-banner.png')}
                    style={styles.workoutImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={[styles.workoutName, { color: colors.text }]}>
                    {workout.name}
                  </Text>
                  <View style={styles.workoutMeta}>
                    <View style={styles.workoutMetaItem}>
                      <Ionicons name="time" size={14} color={colors.textSecondary} />
                      <Text style={[styles.workoutMetaText, { color: colors.textSecondary }]}>
                        {workout.duration}
                      </Text>
                    </View>
                    <View style={styles.workoutMetaItem}>
                      <Ionicons name="flame" size={14} color={Colors.error} />
                      <Text style={[styles.workoutMetaText, { color: colors.textSecondary }]}>
                        {workout.calories}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.progressOverview', 'Progress Overview')}
          </Text>
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
              },
            ]}
          >
            <View style={styles.progressHeader}>
              <View>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  {t('home.weeklyProgress', 'Weekly Progress')}
                </Text>
                <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                  {t('home.workoutsCompleted', '12 of 20 workouts completed')}
                </Text>
              </View>
              <View style={styles.progressPercentage}>
                <Text style={[styles.progressValue, { color: Colors.success }]}>60%</Text>
              </View>
            </View>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: isDarkMode ? Colors.gray[700] : Colors.gray[200] },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: '60%', backgroundColor: Colors.success },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.quickActions', 'Quick Actions')}
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: Colors.primary },
              ]}
              onPress={() => handleNavigate('/(tabs)/diet')}
              activeOpacity={0.8}
            >
              <Ionicons name="restaurant" size={24} color={Colors.white} />
              <Text style={styles.actionText}>{t('home.scanMeal', 'Scan Meal')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: Colors.success },
              ]}
              onPress={() => handleNavigate('/(tabs)/projections')}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={24} color={Colors.white} />
              <Text style={styles.actionText}>{t('home.scanBody', 'Scan Body')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.nutritionToday', 'Nutrition Today')}
          </Text>
          <View
            style={[
              styles.nutritionCard,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
              },
            ]}
          >
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: Colors.success }]}>142g</Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                  {t('home.protein', 'Protein')}
                </Text>
              </View>
              <View style={styles.nutritionDivider} />
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: Colors.warning }]}>185g</Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                  {t('home.carbs', 'Carbs')}
                </Text>
              </View>
              <View style={styles.nutritionDivider} />
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: Colors.primary }]}>62g</Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                  {t('home.fats', 'Fats')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 20,
  },
  motivationalBanner: {
    borderRadius: Spacing.radius.lg,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  quoteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  motivationalQuote: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    lineHeight: 24,
  },
  userStatsSummary: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 20,
    marginBottom: 32,
  },
  statsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsSummaryTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.radius.md,
  },
  goalBadgeText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
  },
  userStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  userStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  userStatValue: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  goalBanner: {
    borderRadius: Spacing.radius.lg,
    padding: 20,
    marginBottom: 32,
  },
  goalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  goalSubtitle: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  goalImage: {
    width: 80,
    height: 80,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  workoutImageContainer: {
    width: 60,
    height: 60,
    borderRadius: Spacing.radius.md,
    overflow: 'hidden',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutMetaText: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
  },
  progressCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  progressPercentage: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.success + '20',
  },
  progressValue: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: Spacing.radius.lg,
    gap: 8,
  },
  actionText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  nutritionCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  nutritionDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray[300],
  },
});
