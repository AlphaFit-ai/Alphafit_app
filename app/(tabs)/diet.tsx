import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useDiet } from '../../context/DietContext';
import AllergiesScreen from '../diet/allergies';
import DietPreferenceScreen from '../diet/diet-preference';
import FoodScanScreen from '../diet/food-scan';
import MealsScreen from '../diet/meals';
import SupplementsScreen from '../diet/supplements';

export default function DietScreen() {
  const { dietData, currentStep, setCurrentStep } = useDiet();

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
    default:
      return <DietPreferenceScreen />;
  }
}
