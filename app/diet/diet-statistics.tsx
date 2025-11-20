import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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

interface Ingredient {
  name: string;
  amount: string;
}

export default function DietStatisticsScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { dietData, setCurrentStep } = useDiet();

  // Mock data - will be replaced with actual AI analysis
  const foodName = 'Grilled Chicken Salad';
  const totalCalories = 450;
  const mealType = 'Lunch';

  const nutrients: NutrientInfo[] = [
    {
      label: 'Protein',
      value: '45',
      unit: 'g',
      icon: 'fitness',
      color: Colors.success,
      percentage: 85,
    },
    {
      label: 'Carbs',
      value: '32',
      unit: 'g',
      icon: 'nutrition',
      color: Colors.warning,
      percentage: 60,
    },
    {
      label: 'Fats',
      value: '18',
      unit: 'g',
      icon: 'water',
      color: Colors.primary,
      percentage: 45,
    },
    {
      label: 'Fiber',
      value: '8',
      unit: 'g',
      icon: 'leaf',
      color: Colors.success,
      percentage: 70,
    },
  ];

  const ingredients: Ingredient[] = [
    { name: 'Grilled Chicken Breast', amount: '200g' },
    { name: 'Mixed Greens', amount: '100g' },
    { name: 'Cherry Tomatoes', amount: '50g' },
    { name: 'Cucumber', amount: '50g' },
    { name: 'Olive Oil Dressing', amount: '30ml' },
  ];

  const recommendations = [
    'Add more vegetables for extra fiber',
    'Consider reducing dressing for lower fat',
    'Perfect protein amount for muscle building',
  ];

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
        {dietData.foodImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: dietData.foodImage }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Food Name & Calories Card */}
        <View
          style={[
            styles.caloriesCard,
            {
              backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
              borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
            },
          ]}
        >
          <Text style={[styles.foodName, { color: colors.text }]}>
            {foodName}
          </Text>
          <View style={styles.caloriesContainer}>
            <Text style={[styles.caloriesValue, { color: Colors.primary }]}>
              {totalCalories}
            </Text>
            <Text style={[styles.caloriesUnit, { color: colors.textSecondary }]}>
              kcal
            </Text>
          </View>
        </View>

        {/* Nutrients Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('diet.statistics.nutrients', 'Nutritional Information')}
          </Text>
          <View style={styles.nutrientsGrid}>
            {nutrients.map((nutrient, index) => (
              <View
                key={index}
                style={[
                  styles.nutrientCard,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                    borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                  },
                ]}
              >
                <View
                  style={[
                    styles.nutrientIconContainer,
                    { backgroundColor: nutrient.color + '20' },
                  ]}
                >
                  <Ionicons name={nutrient.icon as any} size={24} color={nutrient.color} />
                </View>
                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                  {nutrient.label}
                </Text>
                <View style={styles.nutrientValueContainer}>
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {nutrient.value}
                  </Text>
                  <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>
                    {nutrient.unit}
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${nutrient.percentage}%`,
                        backgroundColor: nutrient.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('diet.statistics.ingredients', 'Ingredients')}
          </Text>
          <View
            style={[
              styles.ingredientsCard,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
              },
            ]}
          >
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={[styles.ingredientName, { color: colors.text }]}>
                  {ingredient.name}
                </Text>
                <Text style={[styles.ingredientAmount, { color: colors.textSecondary }]}>
                  {ingredient.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <View style={styles.recommendationsHeader}>
            <Ionicons name="sparkles" size={24} color={Colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('diet.statistics.recommendations', 'AI Recommendations')}
            </Text>
          </View>
          <View
            style={[
              styles.recommendationsCard,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
              },
            ]}
          >
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={[styles.recommendationText, { color: colors.text }]}>
                  {rec}
                </Text>
              </View>
            ))}
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
  imageContainer: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
    marginBottom: 24,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  caloriesCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  foodName: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  caloriesValue: {
    fontSize: Fonts.sizes['4xl'],
    fontFamily: Fonts.bold,
  },
  caloriesUnit: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.regular,
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
  ingredientsCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  ingredientName: {
    flex: 1,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
  ingredientAmount: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.medium,
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
});
