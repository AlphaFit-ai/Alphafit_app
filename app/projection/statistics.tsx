import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';

interface StatCard {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}

interface Recommendation {
  title: string;
  description: string;
  icon: string;
  category: 'diet' | 'workout' | 'rest';
}

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { setCurrentStep } = useProjection();

  // Mock data - will be replaced with actual backend data
  const stats: StatCard[] = [
    {
      label: 'Physique Score',
      value: '78',
      unit: '/100',
      icon: 'trophy',
      color: Colors.warning,
    },
    {
      label: 'Body Fat',
      value: '18',
      unit: '%',
      icon: 'analytics',
      color: Colors.primary,
    },
    {
      label: 'Muscle Mass',
      value: '42',
      unit: '%',
      icon: 'fitness',
      color: Colors.success,
    },
    {
      label: 'BMI',
      value: '24.3',
      unit: '',
      icon: 'speedometer',
      color: Colors.info,
    },
  ];

  const recommendations: Recommendation[] = [
    {
      title: 'Increase Protein Intake',
      description: 'Aim for 1.6-2.2g per kg of body weight to support muscle growth',
      icon: 'restaurant',
      category: 'diet',
    },
    {
      title: 'Focus on Upper Body',
      description: 'Add 2 more chest and shoulder exercises to balance your physique',
      icon: 'barbell',
      category: 'workout',
    },
    {
      title: 'Improve Sleep Quality',
      description: 'Target 7-9 hours of sleep for optimal muscle recovery',
      icon: 'moon',
      category: 'rest',
    },
    {
      title: 'Reduce Caloric Deficit',
      description: 'Consider a smaller deficit to preserve muscle while losing fat',
      icon: 'nutrition',
      category: 'diet',
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diet':
        return Colors.success;
      case 'workout':
        return Colors.primary;
      case 'rest':
        return Colors.info;
      default:
        return Colors.gray[500];
    }
  };

  const handleRescan = () => {
    setCurrentStep(4); // Go to scan-body screen
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('statistics.title', 'Body Analysis')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('statistics.lastScan', 'Last scan: Today')}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                {
                  backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                  borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                },
              ]}
            >
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: stat.color + '20' },
                ]}
              >
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              <View style={styles.statValueContainer}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statUnit, { color: colors.textSecondary }]}>
                  {stat.unit}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI Recommendations Section */}
        <View style={styles.recommendationsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color={Colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('statistics.aiRecommendations', 'AI Recommendations')}
            </Text>
          </View>

          <View style={styles.recommendationsList}>
            {recommendations.map((rec, index) => (
              <View
                key={index}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                    borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                  },
                ]}
              >
                <View style={styles.recommendationHeader}>
                  <View
                    style={[
                      styles.recommendationIconContainer,
                      { backgroundColor: getCategoryColor(rec.category) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={rec.icon as any}
                      size={20}
                      color={getCategoryColor(rec.category)}
                    />
                  </View>
                  <Text style={[styles.recommendationTitle, { color: colors.text }]}>
                    {rec.title}
                  </Text>
                </View>
                <Text style={[styles.recommendationDescription, { color: colors.textSecondary }]}>
                  {rec.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rescan Button */}
        <TouchableOpacity
          style={[
            styles.rescanButton,
            {
              backgroundColor: Colors.primary,
            },
          ]}
          onPress={handleRescan}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={20} color={Colors.white} />
          <Text style={styles.rescanButtonText}>
            {t('statistics.rescan', 'Rescan Body')}
          </Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: Fonts.sizes['3xl'],
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    marginBottom: 8,
    textAlign: 'center',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: Fonts.sizes['3xl'],
    fontFamily: Fonts.bold,
  },
  statUnit: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    marginLeft: 2,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  recommendationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  recommendationDescription: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginLeft: 48,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Spacing.radius.full,
    gap: 8,
  },
  rescanButtonText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});
