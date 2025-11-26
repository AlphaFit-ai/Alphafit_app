import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';

const stressOptions = [
  { id: 'low', translationKey: 'onboarding.activity.low', icon: 'trending-down' as const },
  { id: 'moderate', translationKey: 'onboarding.activity.medium', icon: 'thumbs-up' as const },
  { id: 'high', translationKey: 'onboarding.activity.high', icon: 'trending-up' as const },
];

export default function StressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { projectionData, updateProjectionData, setCurrentStep, loadProjectionData } = useProjection();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(isUpdatingFromProfile);
  const isInitialMount = useRef(true);

  // Load saved data from backend when updating from profile
  useEffect(() => {
    const loadSavedData = async () => {
      if (isUpdatingFromProfile) {
        try {
          const savedData = await onboardingService.getProjectionOnboardingData();
          if (savedData) {
            loadProjectionData(savedData);
            setSelected(savedData.stressLevel);
          }
        } catch (error) {
          console.error('Failed to load projection data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadSavedData();
  }, [isUpdatingFromProfile]);

  const handleSelect = (value: string) => {
    setSelected(value);
    updateProjectionData({ stressLevel: value });
    setTimeout(() => {
      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        setCurrentStep(4);
      }
    }, 300);
  };

  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
