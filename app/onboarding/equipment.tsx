import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionCard, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';

export default function EquipmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedEquipment] = useState<
    'full-gym' | 'dumbbells-barbell' | 'bodyweight-only' | null | null
  >(null);
  const selectedEquipment: 'full-gym' | 'dumbbells-barbell' | 'bodyweight-only' | null | null =
    picked ?? onboardingData.equipment ?? null;

  const handleContinue = async () => {
    if (selectedEquipment) {
      updateOnboardingData({ equipment: selectedEquipment });
      if (!isUpdatingFromProfile) {
        setCurrentStep(8);
      }

      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ equipment: selectedEquipment });
      } catch (error) {
        logError('onboarding.save-equipment', error);
      }

      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/goal');
      }
    }
  };

  return (
    <WizardStep
      step={8}
      totalSteps={10}
      title={t('onboarding.equipment.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedEquipment}
    >
      <OptionCard
        title={t('onboarding.equipment.fullGym')}
        selected={selectedEquipment === 'full-gym'}
        onPress={() => setSelectedEquipment('full-gym')}
      />
      <OptionCard
        title={t('onboarding.equipment.dumbbellsBarbell')}
        selected={selectedEquipment === 'dumbbells-barbell'}
        onPress={() => setSelectedEquipment('dumbbells-barbell')}
      />
      <OptionCard
        title={t('onboarding.equipment.bodyweightOnly')}
        selected={selectedEquipment === 'bodyweight-only'}
        onPress={() => setSelectedEquipment('bodyweight-only')}
      />
    </WizardStep>
  );
}
