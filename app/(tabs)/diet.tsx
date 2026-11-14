import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, View } from 'react-native';
import { ErrorState } from '../../components';
import { StepTransition, WizardSkeleton } from '../../src/ui';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { useDietData } from '../../hooks/queries';
import { normalizeApiError } from '../../services/apiError';
import { dietBackStep, getDietResumeStep } from '../../services/onboardingResume';
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

  // Android back inside the tab: the previous question, or from a result back to the scan. The first
  // question and the scan leave the tab through the tab bar's history (dietBackStep).
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const previous = dietBackStep(currentStep);
        if (previous === null) return false;
        setCurrentStep(previous);
        return true;
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
