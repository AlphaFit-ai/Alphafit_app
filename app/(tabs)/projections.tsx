import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService } from '../../services';
import ScanBodyScreen from '../projection/scan-body';
import SleepScreen from '../projection/sleep';
import StatisticsScreen from '../projection/statistics';
import StepsScreen from '../projection/steps';
import StressScreen from '../projection/stress';
import UploadPhotosScreen from '../projection/upload-photos';

export default function ProjectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentStep, goBack, setCurrentStep } = useProjection();
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectionCompleted, setIsProjectionCompleted] = useState(false);

  // Check projection onboarding completion status on mount
  useEffect(() => {
    checkProjectionOnboardingStatus();
  }, []);

  const checkProjectionOnboardingStatus = async () => {
    try {
      const completed = await onboardingService.isProjectionOnboardingCompleted();
      setIsProjectionCompleted(completed);
      
      // If NOT completed, start from sleep screen (step 1)
      // If completed, stay at statistics screen (step 0)
      if (!completed) {
        setCurrentStep(1); // Sleep screen - start onboarding
      } else {
        setCurrentStep(0); // Statistics screen - show results
      }
    } catch (error) {
      console.error('Failed to check projection onboarding status:', error);
      // On error, start onboarding from beginning
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" />
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
        return <ScanBodyScreen />;
      case 5:
        return <UploadPhotosScreen />;
      default:
        return <StatisticsScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
