import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDiet } from '../context/DietContext';
import { useOnboarding } from '../context/OnboardingContext';
import { chatbotService, foodScanService, userService } from '../services';
import type { FoodScanDto } from '../services';
import FoodScanDetails from '../components/FoodScanDetails';

export default function DietStatisticsScreen() {
  const { dietData, setCurrentStep } = useDiet();
  const { onboardingData } = useOnboarding();
  const router = useRouter();
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
    } else if (params.scanId && typeof params.scanId === 'string') {
      loadScanResults(params.scanId);
    } else if (dietData.scanId) {
      loadScanResults(dietData.scanId);
    } else if (!dietData.foodImage) {
      // Redirect to food scan if no data at all
      setCurrentStep(4);
    }
  }, [params.barcodeData, params.scanId, dietData.scanId, dietData.foodImage, setCurrentStep]);

  const loadScanResults = async (id?: string) => {
    const targetId = id || dietData.scanId;
    if (!targetId) return;

    try {
      setLoading(true);
      const result = await foodScanService.getFoodScan(targetId);
      setScanResult(result);

      // Generate recommendations after loading scan results
      if (result && result.predictions && result.predictions.length > 0) {
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
      const response = await chatbotService.sendMessage(prompt, [], false);

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

  const isModal = !!params.scanId;

  const content = (
    <FoodScanDetails
      scanResult={scanResult}
      loading={loading}
      recommendations={recommendations}
      loadingRecommendations={loadingRecommendations}
      onClose={() => router.back()}
      onScanAnother={handleScanAnother}
      isModal={isModal}
    />
  );

  if (isModal) {
    return (
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => router.back()}
        />
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
