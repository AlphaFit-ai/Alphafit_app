import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { ErrorState } from '../../components';
import { StepTransition, WizardSkeleton } from '../../src/ui';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { useProjectionData } from '../../hooks/queries';
import { normalizeApiError } from '../../services/apiError';
import { getProjectionResumeStep } from '../../services/onboardingResume';

import SleepScreen from '../projection/sleep';
import StatisticsScreen from '../projection/statistics';
import StepsScreen from '../projection/steps';
import StressScreen from '../projection/stress';
import UploadPhotosScreen from '../projection/upload-photos';

export default function ProjectionsScreen() {
  const { colors } = useTheme();
  const { currentStep, goBack, setCurrentStep } = useProjection();
  const projection = useProjectionData();

  // Find the first unanswered step once, when the answers first arrive. A failed request shows a retry
  // and leaves the wizard alone.
  const positioned = useRef(false);
  useEffect(() => {
    if (positioned.current || projection.data === undefined) return;
    positioned.current = true;
    setCurrentStep(getProjectionResumeStep(projection.data));
  }, [projection.data, setCurrentStep]);

  const isLoading = projection.data === undefined && !projection.isError && !projection.isPaused;
  const loadError =
    projection.data !== undefined
      ? null
      : projection.isError
        ? normalizeApiError(projection.error)
        : projection.isPaused
          ? { kind: 'offline' as const }
          : null;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentStep > 0) {
          goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [currentStep, goBack])
  );

  // Show loading indicator while checking status
  if (isLoading) {
    return <WizardSkeleton />;
  }

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState kind={loadError.kind} onRetry={() => void projection.refetch()} />
      </View>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StatisticsScreen />;
      case 1:
        return <SleepScreen />;
      case 2:
        return <StepsScreen />;
      case 3:
        return <StressScreen />;
      case 4:
        return <UploadPhotosScreen />;
      default:
        return <StatisticsScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StepTransition step={currentStep}>{renderStep()}</StepTransition>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
