import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService } from '../../services';

import SleepScreen from '../projection/sleep';
import StatisticsScreen from '../projection/statistics';
import StepsScreen from '../projection/steps';
import StressScreen from '../projection/stress';
import UploadPhotosScreen from '../projection/upload-photos';

export default function ProjectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentStep, goBack, setCurrentStep, loadProjectionData } = useProjection();
  const [isLoading, setIsLoading] = useState(true);

  // Check which projection screen is incomplete on mount
  useEffect(() => {
    findFirstIncompleteStep();
  }, []);

  const findFirstIncompleteStep = async () => {
    try {
      const data = await onboardingService.getProjectionOnboardingData();

      if (!data) {
        // No data at all, start from sleep screen
        setCurrentStep(1);
      } else {
        // Load saved data into context
        loadProjectionData(data);

        // Check each field and find first incomplete step
        if (!data.sleepHours) {
          setCurrentStep(1); // Sleep
        } else if (!data.dailySteps) {
          setCurrentStep(2); // Steps
        } else if (!data.stressLevel) {
          setCurrentStep(3); // Stress
        } else if (!data.frontPhotoUrl || !data.sidePhotoUrl || !data.backPhotoUrl) {
          setCurrentStep(4); // Upload photos (photos missing)
        } else {
          // All data complete, show statistics
          setCurrentStep(0); // Statistics
        }
      }
    } catch (error) {
      console.error('Failed to load projection onboarding data:', error);
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
