import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, OptionCard, ProgressBar } from '../../components';
import { Colors, SharedStyles } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

export default function SourceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors, isDarkMode } = useTheme();
  const [selectedSource, setSelectedSource] = useState<'instagram' | 'facebook' | 'tiktok' | 'threads' | 'x' | 'youtube' | 'google' | 'others' | null>(null);

  const handleContinue = () => {
    if (selectedSource) {
      updateOnboardingData({ source: selectedSource });
      setCurrentStep(1);
      router.push('/onboarding/age');
    }
  };

  const getIconColor = (isSelected: boolean) => {
    if (isSelected) return Colors.white;
    return isDarkMode ? Colors.white : Colors.black;
  };

  return (
    <View style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={SharedStyles.header}>
        <ProgressBar currentStep={1} totalSteps={10} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[SharedStyles.title, { color: colors.text }]}>{t('onboarding.source.title')}</Text>

        <View style={SharedStyles.optionsContainer}>
          <OptionCard
            title="Instagram"
            selected={selectedSource === 'instagram'}
            onPress={() => setSelectedSource('instagram')}
            icon={<Image source={require('../../assets/images/logo/instagram.png')} style={styles.logoImage} />}
          />
          <OptionCard
            title="Facebook"
            selected={selectedSource === 'facebook'}
            onPress={() => setSelectedSource('facebook')}
            icon={<Ionicons name="logo-facebook" size={24} color="#1877F2" />}
          />
          <OptionCard
            title="TikTok"
            selected={selectedSource === 'tiktok'}
            onPress={() => setSelectedSource('tiktok')}
            icon={<Ionicons name="logo-tiktok" size={24} color={getIconColor(selectedSource === 'tiktok')} />}
          />
          <OptionCard
            title="Threads"
            selected={selectedSource === 'threads'}
            onPress={() => setSelectedSource('threads')}
            icon={<Ionicons name="logo-threads" size={24} color={getIconColor(selectedSource === 'threads')} />}
          />
          <OptionCard
            title="X"
            selected={selectedSource === 'x'}
            onPress={() => setSelectedSource('x')}
            icon={<Ionicons name="logo-x" size={24} color={getIconColor(selectedSource === 'x')} />}
          />
          <OptionCard
            title="YouTube"
            selected={selectedSource === 'youtube'}
            onPress={() => setSelectedSource('youtube')}
            icon={<Ionicons name="logo-youtube" size={24} color="#FF0000" />}
          />
          <OptionCard
            title="Google"
            selected={selectedSource === 'google'}
            onPress={() => setSelectedSource('google')}
            icon={<Image source={require('../../assets/images/logo/google.png')} style={styles.logoImage} />}
          />
          <OptionCard
            title={t('onboarding.source.others')}
            selected={selectedSource === 'others'}
            onPress={() => setSelectedSource('others')}
            icon={<Ionicons name="people" size={24} color={getIconColor(selectedSource === 'others')} />}
          />
        </View>
      </ScrollView>

      <View style={SharedStyles.footerFloating}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} disabled={!selectedSource} floating />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  logoImage: {
    width: 24,
    height: 24,
  },
});
