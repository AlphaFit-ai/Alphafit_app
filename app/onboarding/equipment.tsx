import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

export default function EquipmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors } = useTheme();
  const [selectedEquipment, setSelectedEquipment] = useState<'full-gym' | 'dumbbells-barbell' | 'bodyweight-only' | null>(null);

  const handleContinue = () => {
    if (selectedEquipment) {
      updateOnboardingData({ equipment: selectedEquipment });
      setCurrentStep(8);
      router.push('/onboarding/goal');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ProgressBar currentStep={8} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.equipment.title')}</Text>

        <View style={styles.optionsContainer}>
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
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedEquipment} />
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
