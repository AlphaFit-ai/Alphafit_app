import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProPlanModal } from '../../components/ProPlanModal';
import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services';

const features = [
  { icon: 'sparkles', text: 'AI-powered muscle analysis' },
  { icon: 'speedometer', text: 'Instant physique rating (0-100)' },
  { icon: 'arrow-forward', text: 'Personalized improvement plan' },
];

export default function ScanBodyScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { setCurrentStep } = useProjection();
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // Refresh subscription status every time screen is focused
  useFocusEffect(
    useCallback(() => {
      checkSubscriptionStatus();
    }, [])
  );

  const checkSubscriptionStatus = async () => {
    try {
      const profile = await userService.getUserProfile();
      setIsPremium(profile.subscriptionPlan === 'PREMIUM');
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPremium(false);
    }
  };

  const handleStartScan = () => {
    if (!isPremium) {
      setShowProModal(true);
      return;
    }
    setCurrentStep(5);
  };

  return (
    <>
      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={handleStartScan}
          activeOpacity={0.7}
        >
          <View style={[styles.imageCircle, { borderColor: colors.text }]}>
            <Image
              source={require('../../assets/images/projection/uploadPhotos.png')}
              style={[styles.image, { tintColor: colors.text }]}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                  },
                ]}
              >
                <Ionicons name={feature.icon as any} size={20} color={colors.text} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {t(`bodyScan.${feature.icon}`)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      </View>
    </>
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
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  imageCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuresContainer: {
    gap: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
});
