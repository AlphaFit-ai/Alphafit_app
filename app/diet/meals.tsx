import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';

const mealOptions = [2, 3, '4 +'];

export default function MealsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const [selectedMeals, setSelectedMeals] = useState<number | null>(null);

  const handleContinue = () => {
    if (selectedMeals) {
      updateDietData({ mealsPerDay: selectedMeals });
      setCurrentStep(3);
      router.push('/diet/supplements');
    }
  };

  const handleSelect = (option: number | string) => {
    const value = option === '4 +' ? 4 : (option as number);
    setSelectedMeals(value);
  };

  return (
    <View style={SharedStyles.container}>
      <TouchableOpacity 
        style={SharedStyles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.black} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={SharedStyles.title}>{t('diet.meals.title')}</Text>

        <Image 
          source={require('../../assets/images/diet/meals.png')} 
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.optionsContainer}>
          {mealOptions.map((option) => {
            const value = option === '4 +' ? 4 : (option as number);
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  selectedMeals === value && styles.optionButtonActive,
                ]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionButtonText,
                  selectedMeals === value && styles.optionButtonTextActive,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={SharedStyles.footerFloating}>
        <Button 
          title={t('onboarding.continue')} 
          onPress={handleContinue} 
          disabled={!selectedMeals}
          floating
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 60,
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 280,
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  optionButtonText: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
    color: Colors.black,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
});
