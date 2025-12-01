import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { chatbotService, foodScanService, userService } from '../../services';
import type { FoodScanDto } from '../../services';

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
  const { onboardingData } = useOnboarding();
  const params = useLocalSearchParams();
  const [scanResult, setScanResult] = useState<FoodScanDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);

  // Load barcode data from route params or scan results from backend
  useEffect(() => {
    if (params.barcodeData && typeof params.barcodeData === 'string') {
      try {
        const barcodeResult = JSON.parse(params.barcodeData);
        setScanResult(barcodeResult);
        if (barcodeResult.predictions.length > 0) {
          generateRecommendations(barcodeResult);
        }
      } catch (error) {
        console.error('Failed to parse barcode data:', error);
      }
    } else if (dietData.scanId) {
      loadScanResults();
    } else if (!dietData.foodImage) {
      // Redirect to food scan if no data at all
      setCurrentStep(4);
    }
  }, [params.barcodeData, dietData.scanId, dietData.foodImage, setCurrentStep]);

  const loadScanResults = async () => {
    if (!dietData.scanId) return;
    
    try {
      setLoading(true);
      const result = await foodScanService.getFoodScan(dietData.scanId);
      setScanResult(result);
      
      // Generate recommendations after loading scan results
      if (result && result.predictions.length > 0) {
        generateRecommendations(result);
      }
    } catch (error) {
      console.error('Failed to load scan results:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (scanData: FoodScanDto) => {
    setLoadingRecommendations(true);
    
    try {
      // Fetch complete user profile from MongoDB
      const userProfile = await userService.getUserProfile();
      const userData = userProfile.onboardingData || onboardingData;

      // Build context about the user and their meal
      const foodItems = scanData.predictions.map(p => p.food).join(', ');
      const totalNutrition = scanData.predictions.reduce(
        (acc, pred) => ({
          calories: acc.calories + (pred.calories || 0),
          protein: acc.protein + (pred.protein || 0),
          carbs: acc.carbs + (pred.carbs || 0),
          fat: acc.fat + (pred.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Build comprehensive user context from MongoDB profile
      let userContext = '';
      if (userData.goal) {
        userContext += `Fitness Goal: ${userData.goal.replace('-', ' ')}. `;
      }
      if (userData.activityLevel) {
        userContext += `Activity Level: ${userData.activityLevel}. `;
      }
      if (userData.fitnessLevel) {
        userContext += `Fitness Level: ${userData.fitnessLevel}. `;
      }
      if (userData.weight?.value) {
        userContext += `Current Weight: ${userData.weight.value}${userData.weight.unit === 'imperial' ? 'lbs' : 'kg'}. `;
      }
      if (userData.height?.value) {
        userContext += `Height: ${userData.height.value}${userData.height.unit === 'imperial' ? 'ft' : 'cm'}. `;
      }
      if (userData.workoutsPerWeek) {
        userContext += `Workouts per week: ${userData.workoutsPerWeek}. `;
      }
      if (userData.equipment) {
        userContext += `Equipment access: ${userData.equipment}. `;
      }

      // Get current language
      const currentLanguage = i18n.language || 'en';
      const languageNames: { [key: string]: string } = {
        en: 'English',
        fr: 'French',
        es: 'Spanish'
      };
      const responseLang = languageNames[currentLanguage] || 'English';

      // Create prompt for LLM with full user context
      const prompt = `As a nutrition expert, analyze this meal and provide 3 concise, actionable recommendations for this specific user. IMPORTANT: Respond in ${responseLang}.

User Profile:
${userContext || 'Limited user data available.'}

Meal Analysis:
- Foods: ${foodItems}
- Total Calories: ${Math.round(totalNutrition.calories)} kcal
- Protein: ${totalNutrition.protein.toFixed(1)}g
- Carbs: ${totalNutrition.carbs.toFixed(1)}g
- Fat: ${totalNutrition.fat.toFixed(1)}g

Provide exactly 3 personalized recommendations in ${responseLang}:

1. FIRST RECOMMENDATION (MOST IMPORTANT): Analyze how this meal aligns with their specific fitness goal (${userData.goal || 'their goal'}). Provide a strategic recommendation about how they can improve their nutrition plan to better achieve their goal. Focus on overall dietary strategy, macronutrient distribution for their goal, or meal planning improvements.

2. SECOND RECOMMENDATION: Provide practical advice about this specific meal - suggest complementary foods, portion adjustments, or meal timing to optimize results.

3. THIRD RECOMMENDATION: Give general wellness advice related to hydration, meal frequency, or nutrient diversity that supports their fitness journey.

Each recommendation should be one clear, actionable sentence. Format as a simple list without numbering or bullet points.`;

      // Call chatbot service
      const response = await chatbotService.sendMessage(prompt, []);
      
      // Parse recommendations from response
      if (response.message) {
        const lines = response.message
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10 && !line.match(/^(recommendation|here|based)/i));
        
        // Take up to 3 recommendations
        const parsedRecommendations = lines.slice(0, 3);
        setRecommendations(parsedRecommendations.length > 0 ? parsedRecommendations : [
          'Consider balancing your meal with more vegetables for added nutrients.',
          'Stay hydrated by drinking water with your meal.',
          'Monitor your portion sizes to align with your fitness goals.'
        ]);
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      // Set default recommendations on error
      setRecommendations([
        'Consider balancing your meal with more vegetables for added nutrients.',
        'Stay hydrated by drinking water with your meal.',
        'Monitor your portion sizes to align with your fitness goals.'
      ]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // If no data, return null (will redirect via useEffect)
  if (!dietData.foodImage && !scanResult) {
    return null;
  }

  const handleScanAnother = () => {
    setCurrentStep(4); // Go back to food scan screen
  };

  const getTotalNutrition = () => {
    if (!scanResult?.predictions || scanResult.predictions.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return scanResult.predictions.reduce(
      (acc, pred) => ({
        calories: acc.calories + (pred.calories || 0),
        protein: acc.protein + (pred.protein || 0),
        carbs: acc.carbs + (pred.carbs || 0),
        fat: acc.fat + (pred.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Show loading state while fetching results
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 16 }]}>
          {t('diet.statistics.loadingResults')}
        </Text>
      </View>
    );
  }

  const totalNutrition = getTotalNutrition();
  const topPrediction = scanResult?.predictions?.[0];
  const imageUrl = scanResult?.imageUrl || dietData.foodImage;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >

        {/* Food Image */}
        <View style={styles.foodImageCard}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.foodImage}
            resizeMode="cover"
          />
          {scanResult && scanResult.predictions && scanResult.predictions.length > 0 && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {scanResult.predictions.map(p => p.food).join(' + ')}
              </Text>
            </View>
          )}
        </View>

        {/* Show AI Results or Empty State */}
        {scanResult && scanResult.predictions.length > 0 ? (
          <>
            {/* Nutrition Facts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('diet.statistics.nutritionFacts', 'Nutrition Facts')}
              </Text>
              <View style={styles.nutrientsGrid}>
                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                    <Ionicons name="flame" size={24} color={Colors.primary} />
                  </View>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.calories')}</Text>
                  <View style={styles.nutrientValueContainer}>
                    <Text style={[styles.nutrientValue, { color: colors.text }]}>
                      {Math.round(totalNutrition.calories)}
                    </Text>
                    <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>kcal</Text>
                  </View>
                </View>

                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.error + '20' }]}>
                    <Ionicons name="fitness" size={24} color={Colors.error} />
                  </View>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.protein')}</Text>
                  <View style={styles.nutrientValueContainer}>
                    <Text style={[styles.nutrientValue, { color: colors.text }]}>
                      {totalNutrition.protein.toFixed(1)}
                    </Text>
                    <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>g</Text>
                  </View>
                </View>

                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.warning + '20' }]}>
                    <Ionicons name="nutrition" size={24} color={Colors.warning} />
                  </View>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.carbs')}</Text>
                  <View style={styles.nutrientValueContainer}>
                    <Text style={[styles.nutrientValue, { color: colors.text }]}>
                      {totalNutrition.carbs.toFixed(1)}
                    </Text>
                    <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>g</Text>
                  </View>
                </View>

                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.info + '20' }]}>
                    <Ionicons name="water" size={24} color={Colors.info} />
                  </View>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.fat')}</Text>
                  <View style={styles.nutrientValueContainer}>
                    <Text style={[styles.nutrientValue, { color: colors.text }]}>
                      {totalNutrition.fat.toFixed(1)}
                    </Text>
                    <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>g</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* All Detected Items */}
            {scanResult.predictions.length > 1 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('diet.statistics.allDetectedItems')}
                </Text>
                <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {scanResult.predictions.map((prediction, index) => (
                    <View key={index} style={styles.recommendationRow}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.recommendationText, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                          {prediction.food}
                        </Text>
                        <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                          {Math.round(prediction.calories || 0)} {t('diet.statistics.caloriesUnit')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* AI Recommendations */}
            <View style={styles.section}>
              <View style={styles.recommendationsHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                  {t('diet.statistics.personalizedRecommendations')}
                </Text>
              </View>
              
              {loadingRecommendations ? (
                <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', padding: 32 }]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                    {t('diet.statistics.analyzingMeal')}
                  </Text>
                </View>
              ) : (
                <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationRow}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      <Text style={[styles.recommendationText, { color: colors.text }]}>
                        {recommendation}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          /* Empty state - Still processing or no results */
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
                {t('diet.statistics.analyzing', 'AI Analysis in Progress')}
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t('diet.statistics.analyzeMessage', 'Your meal is being analyzed by AI. Results will appear shortly!')}
              </Text>
            </View>
          </View>
        )}

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
  title: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
  },
  foodImageCard: {
    width: '100%',
    height: 300,
    borderBottomLeftRadius: Spacing.radius.full,
    borderBottomRightRadius: Spacing.radius.full,
    overflow: 'hidden',
    marginBottom: 32,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
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
    marginBottom: 4,
  },
  nutrientValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    borderRadius: Spacing.radius.full,
    gap: 8,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 16,
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
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  card: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  foodName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  confidenceContainer: {
    gap: 8,
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
});
