import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, View } from 'react-native';
import { ErrorState } from '../../components';
import { StepTransition, WizardSkeleton } from '../../src/ui';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { useDietData } from '../../hooks/queries';
import { normalizeApiError } from '../../services/apiError';
import { getDietResumeStep } from '../../services/onboardingResume';
import AllergiesScreen from '../diet/allergies';
import BarcodeResultScreen from '../diet/barcode-result';
import DietPreferenceScreen from '../diet/diet-preference';
import DietStatisticsScreen from '../diet/diet-statistics';
import FoodScanScreen from '../diet/food-scan';
import MealsScreen from '../diet/meals';
import SupplementsScreen from '../diet/supplements';

export default function DietScreen() {
  const { currentStep, setCurrentStep } = useDiet();
  const { colors } = useTheme();
  const diet = useDietData();

  // Find the first unanswered step once, when the answers first arrive. A request that fails shows a
  // retry: it never restarts the wizard, because "could not load" is not the same as "no answers yet".
  const positioned = useRef(false);
  useEffect(() => {
    if (positioned.current || diet.data === undefined) return;
    positioned.current = true;
    setCurrentStep(getDietResumeStep(diet.data));
  }, [diet.data, setCurrentStep]);

  const isLoading = diet.data === undefined && !diet.isError && !diet.isPaused;
  const loadError =
    diet.data !== undefined
      ? null
      : diet.isError
        ? normalizeApiError(diet.error)
        : diet.isPaused
          ? { kind: 'offline' as const }
          : null;

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
    return <WizardSkeleton />;
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState kind={loadError.kind} onRetry={() => void diet.refetch()} />
      </View>
    );
  }

  // Show onboarding steps (or food scan if completed)
  const renderStep = () => {
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
      case 6:
        return <BarcodeResultScreen />;
      default:
        return <DietPreferenceScreen />;
    }
  };

  return <StepTransition step={currentStep}>{renderStep()}</StepTransition>;
}
