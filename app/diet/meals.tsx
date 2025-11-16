import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';

const proteinOptions = [
  { label: '50-100g', value: 75 },
  { label: '100-150g', value: 125 },
  { label: '150-200g', value: 175 },
  { label: '200g+', value: 200 },
];

export default function MealsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
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
    <SafeAreaView style={SharedStyles.container}>
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
          {proteinOptions.map((option) => {
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedProtein === option.value && styles.optionButtonActive,
                ]}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionButtonText,
                  selectedProtein === option.value && styles.optionButtonTextActive,
                ]}>
                  {option.label}
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
          disabled={!selectedProtein}
          floating
        />
      </View>
    </SafeAreaView>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionButton: {
    width: '47%',
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
