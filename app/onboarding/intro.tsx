import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FEATURES } from '../../constants';
import { AppImage, BrandLogo, Button, Screen, Text } from '../../src/ui';

// The two scores are a fixed illustration of what the app promises, not the user's data.
const CURRENT = 6.2;
const PROJECTED = 8.4;

export default function IntroScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tokens } = useTheme();
  const c = tokens.color;

  const bar = (label: string, score: number) => (
    <View style={styles.score}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View
          style={[styles.fill, { width: `${(score / 10) * 100}%`, backgroundColor: c.accent }]}
        />
      </View>
      <Text variant="heading">{score}</Text>
    </View>
  );

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={
        <Button
          title={t('onboarding.intro.getStarted')}
          onPress={() => router.replace('/onboarding/login')}
        />
      }
    >
      <BrandLogo height={36} style={styles.logo} />
      <Text variant="title" accessibilityRole="header">
        {t(FEATURES.projections ? 'onboarding.intro.title' : 'onboarding.intro.titleScan')}
      </Text>
      <Text tone="muted">
        {t(FEATURES.projections ? 'onboarding.intro.subtitle' : 'onboarding.intro.subtitleScan')}
      </Text>

      {FEATURES.projections ? (
        <View
          style={[styles.card, { backgroundColor: c.bgSubtle, borderColor: c.border }]}
          accessible
          accessibilityLabel={`${t('onboarding.intro.current')} ${CURRENT}, ${t('onboarding.intro.projected')} ${PROJECTED}`}
        >
          {bar(t('onboarding.intro.current'), CURRENT)}
          {bar(t('onboarding.intro.projected'), PROJECTED)}
        </View>
      ) : null}

      <AppImage
        source={require('../../assets/images/projection.png')}
        contentFit="contain"
        noPlaceholder
        accessible={false}
        tintColor={c.text}
        style={[styles.image, { backgroundColor: 'transparent' }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24, gap: 12 },
  logo: { alignSelf: 'flex-start', marginBottom: 8 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 20, marginTop: 16 },
  score: { gap: 6 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  // The picture takes the free space and centres in it, so the page does not end in a big gap.
  image: { width: '100%', flex: 1, minHeight: 220, marginTop: 8 },
});
