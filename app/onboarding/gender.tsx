import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <ProgressBar currentStep={3} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.gender.title')}</Text>

        <View style={styles.optionsContainer}>
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

      <View style={styles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedGender} />
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
