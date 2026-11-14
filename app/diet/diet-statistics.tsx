import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDiet } from '../../context/DietContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { chatbotService, foodScanService, userService } from '../../services';
import type { FoodScanDto } from '../../services';
import type { ScanEditBody } from '../../services/foodScanService';
import { itemsFromScan, totals } from '../../src/scan/items';
import { applyScanToCaches, saveScanEdits } from '../../src/scan/saveEdits';
import { ScanResult } from '../../src/scan/ScanResult';
import { ErrorState } from '../../components';
import { logError, normalizeApiError, NormalizedError } from '../../services/apiError';

export default function DietStatisticsScreen() {
  const { t: tr } = useTranslation();
  const { dietData, setCurrentStep } = useDiet();
  const { onboardingData } = useOnboarding();
  const { colors } = useTheme();
  // The latest answers, read when recommendations are requested. Not a dependency: a change to the
  // answers must not ask the coach for new recommendations.
  const onboardingRef = useRef(onboardingData);
  useEffect(() => {
    onboardingRef.current = onboardingData;
  }, [onboardingData]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const client = useQueryClient();
  const [scanResult, setScanResult] = useState<FoodScanDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<NormalizedError | null>(null);

  const generateRecommendations = useCallback(async (scanData: FoodScanDto) => {
    setLoadingRecommendations(true);

    try {
      // Fetch complete user profile from MongoDB
      const userProfile = await userService.getUserProfile();
      const userData = userProfile.onboardingData || onboardingRef.current;

      // Build context about the user and their meal
      // The api names the fields foodName and nutrition.proteinG; itemsFromScan reads both spellings.
      const scanItems = itemsFromScan(scanData);
      const foodItems = scanItems.map((item) => item.name).join(', ');
      const totalNutrition = totals(scanItems);

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
        es: 'Spanish',
      };
      const responseLang = languageNames[currentLanguage] || 'English';

      // Create prompt for LLM with full user context
      const prompt = `As a nutrition expert, analyze this meal and provide 3 concise, actionable recommendations for this specific user. IMPORTANT: Respond in ${responseLang}.
      
User Profile:
${userContext || 'Limited user data available.'}

Meal Analysis:
- Foods: ${foodItems}
- Total Calories: ${Math.round(totalNutrition.calories)} cal
- Protein: ${totalNutrition.protein.toFixed(1)}g
- Carbs: ${totalNutrition.carbs.toFixed(1)}g
- Fat: ${totalNutrition.fat.toFixed(1)}g

Provide exactly 3 personalized recommendations in ${responseLang}.
CRITICAL INSTRUCTIONS:
- Address the user directly using "you" (e.g., "You should...", "Your goal...").
- Keep each recommendation SHORT and CLEAR (maximum 15 words per recommendation).
- OUTPUT FORMAT: Return ONLY 3 lines of text. Do NOT use numbers, bullets, dashes, or introductory phrases.
- Do NOT include any headers or labels like "First Recommendation:".
- Do NOT say "Here are your recommendations". Just start with the first recommendation.

1. Strategic advice based on goal (${userData.goal}).
2. Practical advice for this meal.
3. General wellness advice.`;

      // Call chatbot service
      const response = await chatbotService.sendMessage(prompt, [], false);

      // Parse recommendations from response
      if (response.message) {
        const lines = response.message
          .split('\n')
          .map((line) => line.trim().replace(/^[-*•\d\s.)]+/, '')) // Remove bullets, numbers, and leading symbols
          .filter(
            (line) =>
              line.length > 10 &&
              !line.match(
                /^(here|based|recommendation|sure|certainly|ok|okay|these|following|please)/i
              ) &&
              !line.includes(':') // Filter out lines that look like headers (e.g., "Recommendation 1:")
          );

        // Take up to 3 recommendations
        const parsedRecommendations = lines.slice(0, 3);
        setRecommendations(
          parsedRecommendations.length > 0
            ? parsedRecommendations
            : [
                'Consider balancing your meal with more vegetables.',
                'Stay hydrated by drinking water with your meal.',
                'Monitor your portion sizes to align with your fitness goals.',
              ]
        );
      }
    } catch (error) {
      logError('diet.recommendations', error);
      // Set default recommendations on error
      setRecommendations([
        'Consider balancing your meal with more vegetables for added nutrients.',
        'Stay hydrated by drinking water with your meal.',
        'Monitor your portion sizes to align with your fitness goals.',
      ]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const loadScanResults = useCallback(
    async (id?: string) => {
      const targetId = id || dietData.scanId;
      if (!targetId) return;

      try {
        setLoading(true);
        setLoadError(null);
        const result = await foodScanService.getFoodScan(targetId);
        setScanResult(result);

        // Generate recommendations after loading scan results
        if (result && result.predictions && result.predictions.length > 0) {
          void generateRecommendations(result);
        }
      } catch (error) {
        logError('diet.loadScan', error);
        setLoadError(normalizeApiError(error));
      } finally {
        setLoading(false);
      }
    },
    [dietData.scanId, generateRecommendations]
  );

  // Load barcode data from route params or scan results from backend
  useEffect(() => {
    if (params.barcodeData && typeof params.barcodeData === 'string') {
      try {
        const barcodeResult = JSON.parse(params.barcodeData);
        setScanResult(barcodeResult);
        if (barcodeResult.predictions.length > 0) {
          void generateRecommendations(barcodeResult);
        }
      } catch (error) {
        logError('diet.parseBarcode', error);
      }
    } else if (params.scanId && typeof params.scanId === 'string') {
      void loadScanResults(params.scanId);
    } else if (dietData.scanId) {
      void loadScanResults(dietData.scanId);
    } else if (!dietData.foodImage) {
      // Redirect to food scan if no data at all
      setCurrentStep(4);
    }
  }, [
    params.barcodeData,
    params.scanId,
    dietData.scanId,
    dietData.foodImage,
    setCurrentStep,
    loadScanResults,
    generateRecommendations,
  ]);

  // If no data, return null (will redirect via useEffect)
  const hasTarget = !!params.scanId || !!params.barcodeData;
  if (!dietData.foodImage && !scanResult && !hasTarget) {
    return null;
  }

  /** Saves a correction; a saved scan replaces the one on screen and in the Home and History caches. */
  const saveEdits = async (body: ScanEditBody) => {
    if (!scanResult) return { kind: 'failed', reason: 'server' } as const;
    const outcome = await saveScanEdits(scanResult.id, body);
    if (outcome.kind === 'saved') {
      setScanResult(outcome.scan);
      applyScanToCaches(client, outcome.scan);
    }
    return outcome;
  };

  const handleScanAnother = () => {
    setCurrentStep(4); // Go back to food scan screen
  };

  const isModal = !!params.scanId;

  // The scan could not be loaded: say so with a retry instead of an empty sheet.
  if (loadError && !scanResult) {
    const retry = () =>
      void loadScanResults(typeof params.scanId === 'string' ? params.scanId : undefined);
    return isModal ? (
      <View style={styles.modalContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={tr('common.close')}
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => router.back()}
        />
        <View style={[styles.errorSheet, { backgroundColor: colors.background }]}>
          <ErrorState kind={loadError.kind} onRetry={retry} />
        </View>
      </View>
    ) : (
      <ErrorState kind={loadError.kind} onRetry={retry} />
    );
  }

  const content = (
    <ScanResult
      scanResult={scanResult}
      loading={loading || (hasTarget && !scanResult && !loadError)}
      recommendations={recommendations}
      loadingRecommendations={loadingRecommendations}
      onClose={() => router.back()}
      onScanAnother={handleScanAnother}
      onSave={params.barcodeData ? undefined : saveEdits}
      isModal={isModal}
    />
  );

  if (isModal) {
    return (
      <View style={styles.modalContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={tr('common.close')}
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
  errorSheet: {
    height: 320,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});
