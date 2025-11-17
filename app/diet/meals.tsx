import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleSelect = (value: number) => {
    setSelectedProtein(value);
    updateDietData({ mealsPerDay: value });
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
