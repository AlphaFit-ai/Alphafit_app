import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionCard, useDialog, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';
import { sessionStore } from '../../services/sessionStore';

export default function GoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { tokens } = useTheme();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedGoal] = useState<
    'lose-fat' | 'get-stronger' | 'build-muscle' | 'stay-fit' | null | null
  >(null);
  const selectedGoal: 'lose-fat' | 'get-stronger' | 'build-muscle' | 'stay-fit' | null | null =
    picked ?? onboardingData.goal ?? null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show, dialog } = useDialog();

  // Onboarding is complete: the app becomes reachable, then `/` sends the user to Home.
  const finishOnboarding = () => {
    sessionStore.setReady();
    router.replace('/');
  };

  const handleContinue = async () => {
    if (selectedGoal && !isSubmitting) {
      setIsSubmitting(true);

      try {
        // Update local state
        updateOnboardingData({ goal: selectedGoal });

        if (!isUpdatingFromProfile) {
          setCurrentStep(9);
        }

        // Save to backend (real-time)
        await onboardingService.saveOnboardingData({ goal: selectedGoal });

        // Navigate based on context
        if (isUpdatingFromProfile) {
          navigateAfterUpdate();
        } else {
          finishOnboarding();
        }
      } catch (error) {
        logError('onboarding.saveGoal', error);
        // `t()` returns the key itself when a translation is missing, so `t(key) || 'text'` never
        // falls back to the text; the keys exist in every language instead.
        show({
          title: t('onboarding.error.title'),
          message: t('onboarding.error.message'),
          feedback: 'error',
          actions: [
            { label: t('onboarding.error.retry'), onPress: handleContinue },
            {
              label: t('onboarding.error.continue'),
              tone: 'cancel',
              onPress: () => {
                if (isUpdatingFromProfile) {
                  navigateAfterUpdate();
                } else {
                  finishOnboarding();
                }
              },
            },
          ],
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getIconColor = (isSelected: boolean) =>
    isSelected ? tokens.color.onAction : tokens.color.text;

  return (
    <WizardStep
      step={9}
      totalSteps={10}
      title={t('onboarding.goal.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedGoal || isSubmitting}
      continueLabel={isSubmitting ? t('onboarding.saving') : t('onboarding.continue')}
    >
      <OptionCard
        title={t('onboarding.goal.loseFat')}
        selected={selectedGoal === 'lose-fat'}
        onPress={() => setSelectedGoal('lose-fat')}
        icon={
          <Ionicons
            name="scale-outline"
            size={24}
            color={getIconColor(selectedGoal === 'lose-fat')}
          />
        }
      />
      <OptionCard
        title={t('onboarding.goal.getStronger')}
        selected={selectedGoal === 'get-stronger'}
        onPress={() => setSelectedGoal('get-stronger')}
        icon={
          <Ionicons
            name="barbell-outline"
            size={24}
            color={getIconColor(selectedGoal === 'get-stronger')}
          />
        }
      />
      <OptionCard
        title={t('onboarding.goal.buildMuscle')}
        selected={selectedGoal === 'build-muscle'}
        onPress={() => setSelectedGoal('build-muscle')}
        icon={
          <Ionicons
            name="fitness-outline"
            size={24}
            color={getIconColor(selectedGoal === 'build-muscle')}
          />
        }
      />
      <OptionCard
        title={t('onboarding.goal.stayFit')}
        selected={selectedGoal === 'stay-fit'}
        onPress={() => setSelectedGoal('stay-fit')}
        icon={
          <Ionicons
            name="walk-outline"
            size={24}
            color={getIconColor(selectedGoal === 'stay-fit')}
          />
        }
      />
      {dialog}
    </WizardStep>
  );
}
