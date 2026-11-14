import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { AppImage, OptionCard, WizardStep } from '../../src/ui';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';

export default function SourceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { tokens } = useTheme();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  // The saved answer is preselected when this question is opened to change it.
  const [picked, setSelectedSource] = useState<
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'threads'
    | 'x'
    | 'youtube'
    | 'google'
    | 'others'
    | null
    | null
  >(null);
  const selectedSource:
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'threads'
    | 'x'
    | 'youtube'
    | 'google'
    | 'others'
    | null
    | null = picked ?? onboardingData.source ?? null;

  const handleContinue = async () => {
    if (selectedSource) {
      updateOnboardingData({ source: selectedSource });
      if (!isUpdatingFromProfile) {
        setCurrentStep(1);
      }

      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ source: selectedSource });
      } catch (error) {
        logError('onboarding.save-source', error);
      }

      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/age');
      }
    }
  };

  const getIconColor = (isSelected: boolean) =>
    isSelected ? tokens.color.onAction : tokens.color.text;

  return (
    <WizardStep
      step={1}
      totalSteps={10}
      scroll
      title={t('onboarding.source.title')}
      onContinue={handleContinue}
      continueDisabled={!selectedSource}
    >
      <>
        <OptionCard
          title="Instagram"
          selected={selectedSource === 'instagram'}
          onPress={() => setSelectedSource('instagram')}
          icon={
            <AppImage
              noPlaceholder
              contentFit="contain"
              source={require('../../assets/images/logo/instagram.png')}
              style={styles.logoImage}
            />
          }
        />
        <OptionCard
          title="Facebook"
          selected={selectedSource === 'facebook'}
          onPress={() => setSelectedSource('facebook')}
          icon={<Ionicons name="logo-facebook" size={24} color="#1877F2" />}
        />
        <OptionCard
          title="TikTok"
          selected={selectedSource === 'tiktok'}
          onPress={() => setSelectedSource('tiktok')}
          icon={
            <Ionicons
              name="logo-tiktok"
              size={24}
              color={getIconColor(selectedSource === 'tiktok')}
            />
          }
        />
        <OptionCard
          title="Threads"
          selected={selectedSource === 'threads'}
          onPress={() => setSelectedSource('threads')}
          icon={
            <Ionicons
              name="logo-threads"
              size={24}
              color={getIconColor(selectedSource === 'threads')}
            />
          }
        />
        <OptionCard
          title="X"
          selected={selectedSource === 'x'}
          onPress={() => setSelectedSource('x')}
          icon={<Ionicons name="logo-x" size={24} color={getIconColor(selectedSource === 'x')} />}
        />
        <OptionCard
          title="YouTube"
          selected={selectedSource === 'youtube'}
          onPress={() => setSelectedSource('youtube')}
          icon={<Ionicons name="logo-youtube" size={24} color="#FF0000" />}
        />
        <OptionCard
          title="Google"
          selected={selectedSource === 'google'}
          onPress={() => setSelectedSource('google')}
          icon={
            <AppImage
              noPlaceholder
              contentFit="contain"
              source={require('../../assets/images/logo/google.png')}
              style={styles.logoImage}
            />
          }
        />
        <OptionCard
          title={t('onboarding.source.others')}
          selected={selectedSource === 'others'}
          onPress={() => setSelectedSource('others')}
          icon={
            <Ionicons name="people" size={24} color={getIconColor(selectedSource === 'others')} />
          }
        />
      </>
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  logoImage: {
    width: 24,
    height: 24,
  },
});
