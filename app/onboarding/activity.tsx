import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionCard, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';

export default function ActivityLevelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedLevel] = useState<'low' | 'medium' | 'high' | null | null>(null);
  const selectedLevel: 'low' | 'medium' | 'high' | null | null =
    picked ?? onboardingData.activityLevel ?? null;

  const handleContinue = async () => {
    if (selectedLevel) {
      updateOnboardingData({ activityLevel: selectedLevel });
      if (!isUpdatingFromProfile) {
        setCurrentStep(6);
      }

      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ activityLevel: selectedLevel });
      } catch (error) {
        logError('onboarding.save-activity', error);
      }

      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/workouts');
      }
    }
  };

  return (
    <WizardStep
      step={6}
      totalSteps={10}
      title={t('onboarding.activity.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedLevel}
    >
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
    </WizardStep>
  );
}
