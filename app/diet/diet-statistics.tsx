import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

interface NutrientInfo {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
  percentage: number;
}

export default function DietStatisticsScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { dietData, setCurrentStep } = useDiet();

  // Redirect to food scan if no food image data
  useEffect(() => {
    if (!dietData.foodImage) {
      setCurrentStep(4); // Redirect to food scan screen
    }
  }, [dietData.foodImage, setCurrentStep]);

  // If no data, return null (will redirect via useEffect)
  if (!dietData.foodImage) {
    return null;
  }

  const handleScanAnother = () => {
    setCurrentStep(4); // Go back to food scan screen
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
          <View style={styles.headerTop}>
            <Ionicons name="restaurant" size={28} color={Colors.success} />
            <Text style={[styles.title, { color: colors.text }]}>
              {t('diet.statistics.title', 'Meal Analysis')}
            </Text>
          </View>
          <Text style={[styles.mealType, { color: colors.textSecondary }]}>
            {mealType}
          </Text>
        </View>

        {/* Food Image */}
        <View style={styles.foodImageCard}>
          <Image
            source={{ uri: dietData.foodImage }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        </View>

        {/* Empty state - AI analysis coming soon */}
        <View style={styles.section}>
          <View style={[
            styles.emptyStateCard,
            {
              backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
              borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
            },
          ]}>
            <Ionicons name="sparkles" size={48} color={Colors.warning} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {t('diet.statistics.analyzing', 'AI Analysis Coming Soon')}
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {t('diet.statistics.analyzeMessage', 'Your meal has been uploaded. AI nutritional analysis will be available soon!')}
            </Text>
          </View>
        </View>

        {/* Scan Another Button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            {
              backgroundColor: Colors.primary,
            },
          ]}
          onPress={handleScanAnother}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={20} color={Colors.white} />
          <Text style={styles.scanButtonText}>
            {t('diet.statistics.scanAnother', 'Scan Another Meal')}
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
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
  },
  mealType: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    marginLeft: 40,
  },
  foodImageCard: {
    width: '100%',
    height: 400,
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
    marginBottom: 32,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  nutrientCard: {
    width: '48%',
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  nutrientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  nutrientValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  nutrientValue: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
  },
  nutrientUnit: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    marginLeft: 4,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recommendationsCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 20,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  recommendationText: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Spacing.radius.full,
    gap: 8,
    marginBottom: 20,
  },
  scanButtonText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  emptyStateCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
