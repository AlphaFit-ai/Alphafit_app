import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionCard, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';

export default function GenderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { tokens } = useTheme();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedGender] = useState<'male' | 'female' | null | null>(null);
  const selectedGender: 'male' | 'female' | null | null = picked ?? onboardingData.gender ?? null;

  const handleContinue = async () => {
    if (selectedGender) {
      updateOnboardingData({ gender: selectedGender });
      setCurrentStep(3);

      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ gender: selectedGender });
      } catch (error) {
        logError('onboarding.save-gender', error);
      }

      router.push('/onboarding/height');
    }
  };

  const getIconColor = (isSelected: boolean) =>
    isSelected ? tokens.color.onAction : tokens.color.text;

  return (
    <WizardStep
      step={3}
      totalSteps={10}
      title={t('onboarding.gender.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedGender}
    >
      <OptionCard
        title={t('onboarding.gender.male')}
        selected={selectedGender === 'male'}
        onPress={() => setSelectedGender('male')}
        icon={<Ionicons name="male" size={26} color={getIconColor(selectedGender === 'male')} />}
      />
      <OptionCard
        title={t('onboarding.gender.female')}
        selected={selectedGender === 'female'}
        onPress={() => setSelectedGender('female')}
        icon={
          <Ionicons name="female" size={26} color={getIconColor(selectedGender === 'female')} />
        }
      />
    </WizardStep>
  );
}
