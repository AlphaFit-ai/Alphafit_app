import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, SharedStyles } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';

export default function GenderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleContinue = () => {
    if (selectedGender) {
      updateOnboardingData({ gender: selectedGender });
      setCurrentStep(3);
      router.push('/onboarding/height');
    }
  };

  return (
    <View style={SharedStyles.container}>
      <View style={SharedStyles.header}>
        <ProgressBar currentStep={3} totalSteps={10} />
      </View>

      <View style={SharedStyles.content}>
        <Text style={SharedStyles.title}>{t('onboarding.gender.title')}</Text>

        <View style={SharedStyles.optionsContainer}>
          <OptionCard
            title={t('onboarding.gender.male')}
            selected={selectedGender === 'male'}
            onPress={() => setSelectedGender('male')}
            icon={<Ionicons name="male" size={26} color={selectedGender === 'male' ? Colors.white : Colors.black} />}
          />
          <OptionCard
            title={t('onboarding.gender.female')}
            selected={selectedGender === 'female'}
            onPress={() => setSelectedGender('female')}
            icon={<Ionicons name="female" size={26} color={selectedGender === 'female' ? Colors.white : Colors.black} />}
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
