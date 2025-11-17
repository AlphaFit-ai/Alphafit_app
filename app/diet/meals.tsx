import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

const proteinOptions = [
  { label: '50-100g', value: 75 },
  { label: '100-150g', value: 125 },
  { label: '150-200g', value: 175 },
  { label: '200g+', value: 200 },
];

export default function MealsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors, isDarkMode } = useTheme();
  const [selectedProtein, setSelectedProtein] = useState<number | null>(null);

  const handleContinue = () => {
    if (selectedProtein) {
      updateDietData({ mealsPerDay: selectedProtein });
      setCurrentStep(3);
      router.push('/diet/supplements');
    }
  };

  const handleSelect = (value: number) => {
    setSelectedProtein(value);
  };

  return (
    <SafeAreaView style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={SharedStyles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={colors.icon} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.innerContent}>
          <Text style={[SharedStyles.title, { color: colors.text }]}>{t('diet.meals.title')}</Text>

          <Image 
            source={require('../../assets/images/diet/meals.png')} 
            style={styles.image}
            resizeMode="contain"
          />

          <View style={styles.optionsContainer}>
            {proteinOptions.map((option) => {
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: selectedProtein === option.value ? Colors.black : colors.card,
                      borderColor: selectedProtein === option.value ? Colors.black : colors.border
                    },
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: selectedProtein === option.value ? Colors.white : colors.text },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={SharedStyles.footer}>
        <Button 
          title={t('onboarding.continue')} 
          onPress={handleContinue} 
          disabled={!selectedProtein}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContent: {
    width: '100%',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  image: {
    width: '100%',
    height: 150,
    marginBottom: Spacing.lg,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionButton: {
    width: '47%',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
  },
});
