import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';

export default function GoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<'lose-fat' | 'get-stronger' | 'build-muscle' | 'stay-fit' | null>(null);

  const handleContinue = () => {
    if (selectedGoal) {
      updateOnboardingData({ goal: selectedGoal });
      setCurrentStep(9);
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ProgressBar currentStep={9} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.goal.title')}</Text>

        <View style={styles.optionsContainer}>
          <OptionCard
            title={t('onboarding.goal.loseFat')}
            selected={selectedGoal === 'lose-fat'}
            onPress={() => setSelectedGoal('lose-fat')}
            icon={<Ionicons name="scale-outline" size={24} color={selectedGoal === 'lose-fat' ? Colors.white : Colors.black} />}
          />
          <OptionCard
            title={t('onboarding.goal.getStronger')}
            selected={selectedGoal === 'get-stronger'}
            onPress={() => setSelectedGoal('get-stronger')}
            icon={<Ionicons name="barbell-outline" size={24} color={selectedGoal === 'get-stronger' ? Colors.white : Colors.black} />}
          />
          <OptionCard
            title={t('onboarding.goal.buildMuscle')}
            selected={selectedGoal === 'build-muscle'}
            onPress={() => setSelectedGoal('build-muscle')}
            icon={<Ionicons name="fitness-outline" size={24} color={selectedGoal === 'build-muscle' ? Colors.white : Colors.black} />}
          />
          <OptionCard
            title={t('onboarding.goal.stayFit')}
            selected={selectedGoal === 'stay-fit'}
            onPress={() => setSelectedGoal('stay-fit')}
            icon={<Ionicons name="walk-outline" size={24} color={selectedGoal === 'stay-fit' ? Colors.white : Colors.black} />}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedGoal} />
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
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 40,
  },
});
