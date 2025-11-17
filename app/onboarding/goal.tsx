import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, SharedStyles } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

export default function GoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors, isDarkMode } = useTheme();
  const [selectedGoal, setSelectedGoal] = useState<'lose-fat' | 'get-stronger' | 'build-muscle' | 'stay-fit' | null>(null);

  const handleContinue = () => {
    if (selectedGoal) {
      updateOnboardingData({ goal: selectedGoal });
      setCurrentStep(9);
      router.replace('/(tabs)/home');
    }
  };

  const getIconColor = (isSelected: boolean) => {
    if (isSelected) return Colors.white;
    return isDarkMode ? Colors.white : Colors.black;
  };

  return (
    <View style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={SharedStyles.header}>
        <ProgressBar currentStep={9} totalSteps={10} />
      </View>

      <View style={SharedStyles.content}>
        <Text style={[SharedStyles.title, { color: colors.text }]}>{t('onboarding.goal.title')}</Text>

        <View style={SharedStyles.optionsContainer}>
          <OptionCard
            title={t('onboarding.goal.loseFat')}
            selected={selectedGoal === 'lose-fat'}
            onPress={() => setSelectedGoal('lose-fat')}
            icon={<Ionicons name="scale-outline" size={24} color={getIconColor(selectedGoal === 'lose-fat')} />}
          />
          <OptionCard
            title={t('onboarding.goal.getStronger')}
            selected={selectedGoal === 'get-stronger'}
            onPress={() => setSelectedGoal('get-stronger')}
            icon={<Ionicons name="barbell-outline" size={24} color={getIconColor(selectedGoal === 'get-stronger')} />}
          />
          <OptionCard
            title={t('onboarding.goal.buildMuscle')}
            selected={selectedGoal === 'build-muscle'}
            onPress={() => setSelectedGoal('build-muscle')}
            icon={<Ionicons name="fitness-outline" size={24} color={getIconColor(selectedGoal === 'build-muscle')} />}
          />
          <OptionCard
            title={t('onboarding.goal.stayFit')}
            selected={selectedGoal === 'stay-fit'}
            onPress={() => setSelectedGoal('stay-fit')}
            icon={<Ionicons name="walk-outline" size={24} color={getIconColor(selectedGoal === 'stay-fit')} />}
          />
        </View>
      </View>

      <View style={SharedStyles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedGoal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
