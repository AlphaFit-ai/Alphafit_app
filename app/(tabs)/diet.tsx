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
  const [isDietCompleted, setIsDietCompleted] = useState(false);

  // Check diet onboarding completion status on mount
  useEffect(() => {
    checkDietOnboardingStatus();
  }, []);

  const checkDietOnboardingStatus = async () => {
    try {
      const completed = await onboardingService.isDietOnboardingCompleted();
      setIsDietCompleted(completed);
      
      // If completed, go to food scan screen
      if (completed) {
        setCurrentStep(4); // Food scan screen
      }
    } catch (error) {
      console.error('Failed to check diet onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button during onboarding
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If in onboarding and not at first step, go to previous step
        if (!dietData.isCompleted && currentStep > 0) {
          setCurrentStep(currentStep - 1);
          return true; // Prevent default back behavior
        }
        // Otherwise, allow default back behavior (exit tab)
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [dietData.isCompleted, currentStep, setCurrentStep])
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
