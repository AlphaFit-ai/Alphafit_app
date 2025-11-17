import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

export default function IntroScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [currentPhysique] = useState(6.2);
  const [projectedPhysique] = useState(8.4);

  const handleGetStarted = () => {
    router.replace('/onboarding/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.intro.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('onboarding.intro.subtitle')}</Text>

        <View style={[styles.projectionContainer, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }]}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('onboarding.intro.current')}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentPhysique / 10) * 100}%` }]} />
            </View>
            <Text style={[styles.score, { color: colors.text }]}>{currentPhysique}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('onboarding.intro.projected')}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(projectedPhysique / 10) * 100}%` }]} />
            </View>
            <Text style={[styles.score, { color: colors.text }]}>{projectedPhysique}</Text>
          </View>
        </View>

        <View style={styles.illustration}>
          <Image 
            source={require('../../assets/images/projection.png')}
            style={[styles.illustrationImage, { tintColor: colors.text }]}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.intro.getStarted')} onPress={handleGetStarted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    marginBottom: 40,
    fontFamily: Fonts.regular,
  },
  projectionContainer: {
    borderRadius: Spacing.radius.lg,
    padding: Spacing.lg,
    marginBottom: 32,
  },
  scoreContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 8,
    fontFamily: Fonts.regular,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    tintColor: Colors.white,
  },
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 40,
  },
});
