import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService } from '../../services';

export default function FitnessLevelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);

  const handleContinue = async () => {
    if (selectedLevel) {
      updateOnboardingData({ fitnessLevel: selectedLevel });
      setCurrentStep(5);
      
      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ fitnessLevel: selectedLevel });
      } catch (error) {
        console.error('Failed to save fitness level:', error);
      }
      
      router.push('/onboarding/activity');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ProgressBar currentStep={5} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.fitnessLevel.title')}</Text>

        <View style={styles.optionsContainer}>
          <OptionCard
            title={t('onboarding.fitnessLevel.beginner')}
            selected={selectedLevel === 'beginner'}
            onPress={() => setSelectedLevel('beginner')}
          />
          <OptionCard
            title={t('onboarding.fitnessLevel.intermediate')}
            selected={selectedLevel === 'intermediate'}
            onPress={() => setSelectedLevel('intermediate')}
          />
          <OptionCard
            title={t('onboarding.fitnessLevel.advanced')}
            selected={selectedLevel === 'advanced'}
            onPress={() => setSelectedLevel('advanced')}
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
