import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';

const stepsOptions = [
  { id: '<3k', label: '<3k' },
  { id: '3-6k', label: '3-6k' },
  { id: '7-10k', label: '7-10k' },
  { id: '10k+', label: '10k +' },
];

export default function StepsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { projectionData, updateProjectionData, setCurrentStep } = useProjection();
  const [selected, setSelected] = useState<string | undefined>(projectionData.dailySteps);
  const isInitialMount = useRef(true);

  const handleSelect = (value: string) => {
    setSelected(value);
    updateProjectionData({ dailySteps: value });
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('projection.steps.title')}
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/projection/walking.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.optionsContainer}>
          {stepsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: selected === option.id ? colors.text : colors.card,
                  borderColor: selected === option.id ? colors.text : colors.border,
                },
              ]}
              onPress={() => handleSelect(option.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: selected === option.id ? colors.background : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
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
    paddingTop: 20,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 24,
  },
  title: {
    fontSize: Fonts.sizes['3xl'],
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  image: {
    width: '100%',
    height: '100%',
    maxHeight: 400,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    width: '48%',
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
  },
});
