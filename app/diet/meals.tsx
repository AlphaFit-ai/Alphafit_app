import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

const mealOptions = [
  { label: '2 meals', value: 2 },
  { label: '3 meals', value: 3 },
  { label: '4 meals', value: 4 },
  { label: '5+ meals', value: 5 },
];

export default function MealsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors, isDarkMode } = useTheme();
  const [selectedMeals, setSelectedMeals] = useState<number | null>(null);

  const handleSelect = async (value: number) => {
    setSelectedMeals(value);
    await updateDietData({ mealsPerDay: value });
    setTimeout(() => {
      setCurrentStep(3);
    }, 300);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[SharedStyles.title, { color: colors.text }]}>{t('diet.meals.title')}</Text>

          <Image 
            source={require('../../assets/images/diet/meals.png')} 
            style={styles.image}
            resizeMode="contain"
          />

          <View style={styles.optionsContainer}>
            {mealOptions.map((option) => {
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: selectedMeals === option.value ? Colors.black : colors.card,
                      borderColor: selectedMeals === option.value ? Colors.black : colors.border
                    },
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: selectedMeals === option.value ? Colors.white : colors.text },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  image: {
    width: '100%',
    height: 180,
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
