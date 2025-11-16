import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';

type DietType = 'vegetarian' | 'vegan' | 'non-veg' | 'flexible';

interface DietOption {
  type: DietType;
  title: string;
  image: any;
}

const getDietOptions = (t: any): DietOption[] => [
  {
    type: 'vegetarian',
    title: t('diet.preference.highProtein'),
    image: require('../../assets/images/diet/High-Protein.png'),
  },
  {
    type: 'vegan',
    title: t('diet.preference.plantBased'),
    image: require('../../assets/images/diet/Plant-Based.png'),
  },
  {
    type: 'non-veg',
    title: t('diet.preference.lowCarb'),
    image: require('../../assets/images/diet/Low-Carb.png'),
  },
  {
    type: 'flexible',
    title: t('diet.preference.balanced'),
    image: require('../../assets/images/diet/Balanced.png'),
  },
];

export default function DietPreferenceScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const [selected, setSelected] = useState<DietType | null>(null);
  const dietOptions = getDietOptions(t);

  const handleContinue = () => {
    if (selected) {
      updateDietData({ dietPreference: selected });
      setCurrentStep(1);
      router.push('/diet/allergies');
    }
  };

  return (
    <SafeAreaView style={SharedStyles.container}>
      <TouchableOpacity 
        style={SharedStyles.backButton}
        onPress={() => router.push('/(tabs)/home')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.black} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={SharedStyles.title}>{t('diet.preference.title')}</Text>

        <View style={styles.optionsGrid}>
          {dietOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                selected === option.type && styles.optionCardSelected,
              ]}
              onPress={() => setSelected(option.type)}
              activeOpacity={0.7}
            >
              <Image source={option.image} style={styles.optionImage} resizeMode="cover" />
              <View style={styles.optionOverlay}>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={SharedStyles.footer}>
        <Button 
          title={t('onboarding.continue')} 
          onPress={handleContinue} 
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    justifyContent: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '48%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.gray[100],
  },
  optionCardSelected: {
    borderColor: Colors.black,
  },
  optionImage: {
    width: '100%',
    height: '100%',
  },
  optionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  optionTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});
