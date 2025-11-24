import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { useDiet } from '../../context/DietContext';
import { onboardingService } from '../../services';
import AllergiesScreen from '../diet/allergies';
import DietPreferenceScreen from '../diet/diet-preference';
import DietStatisticsScreen from '../diet/diet-statistics';
import FoodScanScreen from '../diet/food-scan';
import MealsScreen from '../diet/meals';
import SupplementsScreen from '../diet/supplements';

export default function DietScreen() {
  const { dietData, currentStep, setCurrentStep } = useDiet();
  const [isLoading, setIsLoading] = useState(true);

  // Check which diet screen is incomplete on mount
  useEffect(() => {
    findFirstIncompleteStep();
  }, []);

  const findFirstIncompleteStep = async () => {
    try {
      const data = await onboardingService.getDietOnboardingData();
      
      if (!data) {
        // No data at all, start from beginning
        setCurrentStep(0);
      } else {
        // Check each field and find first incomplete step
        if (!data.dietPreference) {
          setCurrentStep(0); // Diet preference
        } else if (data.hasAllergies === undefined || (data.hasAllergies && !data.allergies)) {
          setCurrentStep(1); // Allergies
        } else if (!data.mealsPerDay) {
          setCurrentStep(2); // Meals per day
        } else if (data.takesSupplements === undefined || (data.takesSupplements && !data.supplements)) {
          setCurrentStep(3); // Supplements
        } else if (!data.foodImage) {
          setCurrentStep(4); // Food scan
        } else {
          // All data complete, show statistics
          setCurrentStep(5); // Diet statistics
        }
      }
    } catch (error) {
      console.error('Failed to load diet onboarding data:', error);
      setCurrentStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button during onboarding
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If not at statistics screen and not at first step, go to previous step
        if (currentStep > 0 && currentStep < 5) {
          setCurrentStep(currentStep - 1);
          return true; // Prevent default back behavior
        }
        // Otherwise, allow default back behavior (exit tab)
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [currentStep, setCurrentStep])
  );

  // Show loading indicator while checking status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show onboarding steps (or food scan if completed)
  switch (currentStep) {
    case 0:
      return <DietPreferenceScreen />;
    case 1:
      return <AllergiesScreen />;
    case 2:
      return <MealsScreen />;
    case 3:
      return <SupplementsScreen />;
    case 4:
      return <FoodScanScreen />;
    case 5:
      return <DietStatisticsScreen />;
    default:
      return <DietPreferenceScreen />;
  }
}
