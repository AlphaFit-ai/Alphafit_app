import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';

const stressOptions = [
  { id: 'low', translationKey: 'onboarding.activity.low', icon: 'trending-down' as const },
  { id: 'moderate', translationKey: 'onboarding.activity.medium', icon: 'thumbs-up' as const },
  { id: 'high', translationKey: 'onboarding.activity.high', icon: 'trending-up' as const },
];

export default function StressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { projectionData, updateProjectionData, setCurrentStep } = useProjection();
  const [selected, setSelected] = useState<string | undefined>(projectionData.stressLevel);
  const isInitialMount = useRef(true);

  const handleSelect = (value: string) => {
    setSelected(value);
    updateProjectionData({ stressLevel: value });
    setTimeout(() => {
      setCurrentStep(0);
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
          {t('projection.stress.title')}
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/projection/stress.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.optionsContainer}>
          {stressOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: selected === option.id ? colors.text : colors.backgroundSecondary,
                  borderColor: selected === option.id ? colors.text : colors.border,
                },
              ]}
              onPress={() => handleSelect(option.id)}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: selected === option.id ? colors.background : (isDarkMode ? Colors.gray[700] : Colors.gray[200]),
                  },
                ]}
              >
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={selected === option.id ? colors.text : colors.text} 
                />
              </View>
              <Text style={[styles.optionLabel, { color: selected === option.id ? colors.background : colors.text }]}>
                {t(option.translationKey)}
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
    alignItems: 'center',
    marginBottom: 60,
  },
  image: {
    width: 200,
    height: 200,
  },
  optionsContainer: {
    gap: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  optionCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,},
  optionLabel: {
    textAlign: 'center',
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
  },
});
