import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const [selectedWorkouts, setSelectedWorkouts] = useState<'0-2' | '3-5' | '6+' | null>(null);

  const handleContinue = () => {
    if (selectedWorkouts) {
      updateOnboardingData({ workoutsPerWeek: selectedWorkouts });
      setCurrentStep(7);
      router.push('/onboarding/equipment');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ProgressBar currentStep={7} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.workouts.title')}</Text>

        <View style={styles.optionsContainer}>
          <OptionCard
            title="0 - 2"
            subtitle={t('onboarding.workouts.subtitle')}
            selected={selectedWorkouts === '0-2'}
            onPress={() => setSelectedWorkouts('0-2')}
            icon={
              <View style={[styles.iconContainer, selectedWorkouts === '0-2' && styles.iconContainerSelected]}>
                <View style={styles.barChart}>
                  <View style={[styles.bar, styles.barLow, selectedWorkouts === '0-2' && styles.barSelected]} />
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
              <View style={[styles.iconContainer, selectedWorkouts === '3-5' && styles.iconContainerSelected]}>
                <View style={styles.barChart}>
                  <View style={[styles.bar, styles.barLow, selectedWorkouts === '3-5' && styles.barSelected]} />
                  <View style={[styles.bar, styles.barMedium, selectedWorkouts === '3-5' && styles.barSelected]} />
                  <View style={[styles.bar, styles.barLow, selectedWorkouts === '3-5' && styles.barSelected]} />
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
              <View style={[styles.iconContainer, selectedWorkouts === '6+' && styles.iconContainerSelected]}>
                <View style={styles.barChart}>
                  <View style={[styles.bar, styles.barMedium, selectedWorkouts === '6+' && styles.barSelected]} />
                  <View style={[styles.bar, styles.barHigh, selectedWorkouts === '6+' && styles.barSelected]} />
                  <View style={[styles.bar, styles.barMedium, selectedWorkouts === '6+' && styles.barSelected]} />
                </View>
              </View>
            }
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedWorkouts} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
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
    backgroundColor: Colors.gray[400],
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
  barSelected: {
    backgroundColor: Colors.white,
  },
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 40,
  },
});
