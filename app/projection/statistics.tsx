import { Ionicons, Octicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { AppImage } from '../../src/ui';

interface BodyPartScore {
  label: string;
  score: number;
}

interface Recommendation {
  title: string;
  description: string;
  icon: string;
  category: 'diet' | 'workout' | 'rest';
}

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();
  const { setCurrentStep } = useProjection();

  // Mock data - will be replaced with actual backend data
  const generalScore = 97;
  const physiqueLevel = 'Intermediate';

  const bodyPartScores: BodyPartScore[] = [
    { label: 'chest', score: 96 },
    { label: 'abs', score: 97 },
    { label: 'shoulders', score: 93 },
    { label: 'arms', score: 45 },
    { label: 'back', score: 97 },
    { label: 'legs', score: 61 },
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return Colors.info;
      case 'intermediate':
        return Colors.warning;
      case 'advanced':
        return Colors.success;
      default:
        return Colors.primary;
    }
  };

  const handleRescan = () => {
    // Start from sleep screen (step 1) for full onboarding flow
    setCurrentStep(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Physique Rating Card */}
        <View style={styles.sectionHeader}>
          <Octicons name="goal" size={24} color={Colors.warning} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('statistics.physiqueRating')}
          </Text>
        </View>

        <View
          style={[
            styles.physiqueCard,
            {
              backgroundColor: tokens.color.surface,
              borderColor: tokens.color.border,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.physiqueImageContainer}>
                <View style={[styles.imageCircle, { borderColor: colors.text }]}>
                  <AppImage
                    source={require('../../assets/images/projection/physique.png')}
                    noPlaceholder
                    accessible={false}
                    tintColor={colors.text}
                    contentFit="contain"
                    style={[styles.physiqueImage, { backgroundColor: 'transparent' }]}
                  />
                </View>
              </View>

              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(physiqueLevel) }]}>
                <Text style={styles.levelBadgeText}>{physiqueLevel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bodyPartsContainer}>
            <View style={styles.bodyPartsGrid}>
              {bodyPartScores.map((part, index) => (
                <View key={index} style={styles.bodyPartItem}>
                  <Text style={[styles.bodyPartLabel, { color: colors.text }]}>
                    {t(`statistics.${part.label}`)}
                  </Text>
                  <Text style={[styles.bodyPartScore, { color: colors.text }]}>{part.score}</Text>
                  <View
                    style={[
                      styles.progressBarContainer,
                      {
                        backgroundColor: tokens.color.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${part.score}%`,
                          backgroundColor: getScoreColor(part.score),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.generalScoreContainer}>
              <Text style={[styles.generalScoreLabel, { color: colors.text }]}>
                {t('statistics.generalScore')}
              </Text>
              <Text style={[styles.generalScoreValue, { color: colors.text }]}>
                {generalScore}/100
              </Text>
              <View
                style={[
                  styles.generalProgressBar,
                  {
                    backgroundColor: tokens.color.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.generalProgressFill,
                    {
                      width: `${generalScore}%`,
                      backgroundColor: getScoreColor(generalScore),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* AI Recommendations Section */}
        <View style={styles.recommendationsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color={Colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('statistics.aiRecommendations')}
            </Text>
          </View>

          <View style={styles.recommendationsList}>
            {recommendations.map((rec, index) => (
              <View
                key={index}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: tokens.color.surface,
                    borderColor: tokens.color.border,
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
          accessibilityRole="button"
          style={[
            styles.rescanButton,
            {
              backgroundColor: Colors.primary,
            },
          ]}
          onPress={handleRescan}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={20} color={Colors.gray[900]} />
          <Text style={styles.rescanButtonText}>{t('statistics.rescan')}</Text>
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
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Spacing.radius.full,
  },
  levelBadgeText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  physiqueCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 24,
    marginBottom: 32,
  },
  physiqueImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageCircle: {
    width: 100,
    height: 100,
    borderRadius: 90,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  physiqueImage: {
    width: '100%',
    height: '100%',
  },
  bodyPartsContainer: {
    gap: 24,
  },
  bodyPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  bodyPartItem: {
    width: '48%',
  },
  bodyPartLabel: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  bodyPartScore: {
    fontSize: Fonts.sizes['3xl'],
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  generalScoreContainer: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[700],
  },
  generalScoreLabel: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  generalScoreValue: {
    fontSize: Fonts.sizes['4xl'],
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  generalProgressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  generalProgressFill: {
    height: '100%',
    borderRadius: 6,
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
    paddingHorizontal: 32,
    borderRadius: Spacing.radius.full,
    gap: 8,
    marginHorizontal: Spacing.screenPaddingHorizontal,
  },
  rescanButtonText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    color: Colors.gray[900],
  },
});
