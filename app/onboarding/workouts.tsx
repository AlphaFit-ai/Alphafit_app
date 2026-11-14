import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { OptionCard, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { tokens } = useTheme();
  const selectedBar = { backgroundColor: tokens.color.onAction };
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedWorkouts] = useState<'0-2' | '3-5' | '6+' | null | null>(null);
  const selectedWorkouts: '0-2' | '3-5' | '6+' | null | null =
    picked ?? onboardingData.workoutsPerWeek ?? null;

  const handleContinue = async () => {
    if (selectedWorkouts) {
      updateOnboardingData({ workoutsPerWeek: selectedWorkouts });
      if (!isUpdatingFromProfile) {
        setCurrentStep(7);
      }

      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ workoutsPerWeek: selectedWorkouts });
      } catch (error) {
        logError('onboarding.save-workouts', error);
      }

      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/equipment');
      }
    }
  };

  return (
    <WizardStep
      step={7}
      totalSteps={10}
      title={t('onboarding.workouts.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedWorkouts}
    >
      <>
        <OptionCard
          title="0 - 2"
          subtitle={t('onboarding.workouts.subtitle')}
          selected={selectedWorkouts === '0-2'}
          onPress={() => setSelectedWorkouts('0-2')}
          icon={
            <View
              style={[
                styles.iconContainer,
                selectedWorkouts === '0-2' && styles.iconContainerSelected,
              ]}
            >
              <View style={styles.barChart}>
                <View
                  style={[styles.bar, styles.barLow, selectedWorkouts === '0-2' && selectedBar]}
                />
              </View>
            </View>
          }
        />
        <OptionCard
          title="3 - 5"
          subtitle={t('onboarding.workouts.subtitle')}
          selected={selectedWorkouts === '3-5'}
          onPress={() => setSelectedWorkouts('3-5')}
          icon={
            <View
              style={[
                styles.iconContainer,
                selectedWorkouts === '3-5' && styles.iconContainerSelected,
              ]}
            >
              <View style={styles.barChart}>
                <View
                  style={[styles.bar, styles.barLow, selectedWorkouts === '3-5' && selectedBar]}
                />
                <View
                  style={[styles.bar, styles.barMedium, selectedWorkouts === '3-5' && selectedBar]}
                />
                <View
                  style={[styles.bar, styles.barLow, selectedWorkouts === '3-5' && selectedBar]}
                />
              </View>
            </View>
          }
        />
        <OptionCard
          title="6+"
          subtitle={t('onboarding.workouts.subtitle')}
          selected={selectedWorkouts === '6+'}
          onPress={() => setSelectedWorkouts('6+')}
          icon={
            <View
              style={[
                styles.iconContainer,
                selectedWorkouts === '6+' && styles.iconContainerSelected,
              ]}
            >
              <View style={styles.barChart}>
                <View
                  style={[styles.bar, styles.barMedium, selectedWorkouts === '6+' && selectedBar]}
                />
                <View
                  style={[styles.bar, styles.barHigh, selectedWorkouts === '6+' && selectedBar]}
                />
                <View
                  style={[styles.bar, styles.barMedium, selectedWorkouts === '6+' && selectedBar]}
                />
              </View>
            </View>
          }
        />
      </>
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(128,128,128,0.15)',
    paddingBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: 'transparent',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 24,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#6B7280',
  },
  barLow: {
    height: 8,
  },
  barMedium: {
    height: 16,
  },
  barHigh: {
    height: 24,
  },
});
