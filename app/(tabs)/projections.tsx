import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import ScanBodyScreen from '../projection/scan-body';
import SleepScreen from '../projection/sleep';
import StatisticsScreen from '../projection/statistics';
import StepsScreen from '../projection/steps';
import StressScreen from '../projection/stress';
import UploadPhotosScreen from '../projection/upload-photos';

export default function ProjectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentStep, goBack } = useProjection();

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
