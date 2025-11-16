import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';

export default function ActivityLevelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  const handleContinue = () => {
    if (selectedLevel) {
      updateOnboardingData({ activityLevel: selectedLevel });
      setCurrentStep(6);
      router.push('/onboarding/workouts');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ProgressBar currentStep={6} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.activity.title')}</Text>

        <View style={styles.optionsContainer}>
          <OptionCard
            title={t('onboarding.activity.low')}
            selected={selectedLevel === 'low'}
            onPress={() => setSelectedLevel('low')}
          />
          <OptionCard
            title={t('onboarding.activity.medium')}
            selected={selectedLevel === 'medium'}
            onPress={() => setSelectedLevel('medium')}
          />
          <OptionCard
            title={t('onboarding.activity.high')}
            selected={selectedLevel === 'high'}
            onPress={() => setSelectedLevel('high')}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedLevel} />
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
    marginBottom: Spacing.lg,
  },
  optionsContainer: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 40,
  },
});
