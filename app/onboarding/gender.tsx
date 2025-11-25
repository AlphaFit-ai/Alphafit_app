import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, SharedStyles } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService } from '../../services';

export default function GenderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors, isDarkMode } = useTheme();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleContinue = async () => {
    if (selectedGender) {
      updateOnboardingData({ gender: selectedGender });
      setCurrentStep(3);
      
      // Save to backend in real-time
      try {
        await onboardingService.saveOnboardingData({ gender: selectedGender });
      } catch (error) {
        console.error('Failed to save gender:', error);
      }
      
      router.push('/onboarding/height');
    }
  };

  const getIconColor = (isSelected: boolean) => {
    if (isSelected) return Colors.white;
    return isDarkMode ? Colors.white : Colors.black;
  };

  return (
    <View style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={SharedStyles.header}>
        <ProgressBar currentStep={3} totalSteps={10} />
      </View>

      <View style={SharedStyles.content}>
        <Text style={[SharedStyles.title, { color: colors.text }]}>{t('onboarding.gender.title')}</Text>

        <View style={SharedStyles.optionsContainer}>
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
            icon={<Ionicons name="female" size={26} color={getIconColor(selectedGender === 'female')} />}
          />
        </View>
      </View>

      <View style={SharedStyles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedGender} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
