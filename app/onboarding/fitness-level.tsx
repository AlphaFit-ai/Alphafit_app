import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionCard, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';

export default function FitnessLevelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedLevel] = useState<
    'beginner' | 'intermediate' | 'advanced' | null | null
  >(null);
  const selectedLevel: 'beginner' | 'intermediate' | 'advanced' | null | null =
    picked ?? onboardingData.fitnessLevel ?? null;

  const handleContinue = async () => {
    if (selectedLevel) {
      updateOnboardingData({ fitnessLevel: selectedLevel });
      if (!isUpdatingFromProfile) {
        setCurrentStep(5);
      }

      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ fitnessLevel: selectedLevel });
      } catch (error) {
        logError('onboarding.save-fitness-level', error);
      }

      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/activity');
      }
    }
  };

  return (
    <WizardStep
      step={5}
      totalSteps={10}
      title={t('onboarding.fitnessLevel.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedLevel}
    >
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
    </WizardStep>
  );
}
