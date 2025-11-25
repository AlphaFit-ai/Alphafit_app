import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { SharedStyles } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService } from '../../services';

export default function ActivityLevelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  const handleContinue = async () => {
    if (selectedLevel) {
      updateOnboardingData({ activityLevel: selectedLevel });
      setCurrentStep(6);
      
      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ activityLevel: selectedLevel });
      } catch (error) {
        console.error('Failed to save activity level:', error);
      }
      
      router.push('/onboarding/workouts');
    }
  };

  return (
    <View style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={SharedStyles.header}>
        <ProgressBar currentStep={6} totalSteps={10} />
      </View>

      <View style={SharedStyles.content}>
        <Text style={[SharedStyles.title, { color: colors.text }]}>{t('onboarding.activity.title')}</Text>

        <View style={SharedStyles.optionsContainer}>
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

      <View style={SharedStyles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedLevel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
