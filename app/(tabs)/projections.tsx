import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import SleepScreen from '../projection/sleep';
import StepsScreen from '../projection/steps';
import StressScreen from '../projection/stress';

export default function ProjectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentStep, setCurrentStep } = useProjection();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [currentStep, setCurrentStep])
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <SleepScreen />;
      case 1:
        return <StepsScreen />;
      case 2:
        return <StressScreen />;
      default:
        return <SleepScreen />;
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
