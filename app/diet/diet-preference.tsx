import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors } = useTheme();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  const [selected, setSelected] = useState<DietType | null>(null);
  const dietOptions = getDietOptions(t);

  const handleSelect = async (type: DietType) => {
    setSelected(type);
    await updateDietData({ dietPreference: type });
    setTimeout(() => {
      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        setCurrentStep(1);
      }
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
          <Text style={[SharedStyles.title, { color: colors.text }]}>{t('diet.preference.title')}</Text>

          <View style={styles.optionsGrid}>
          {dietOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                { borderColor: selected === option.type ? Colors.primary : colors.border },
              ]}
              onPress={() => handleSelect(option.type)}
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
