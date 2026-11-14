import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { LanguageSelector } from '../../components';
import { useTheme } from '../../context/ThemeContext';
import { setLanguage } from '../../i18n/config';
import { LanguageCode, ThemePreference } from '../../services/preferences';
import { ListItem, PressableScale, Screen, Text } from '../../src/ui';

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Español', fr: 'Français' };

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'profile.themeSystem' },
  { value: 'light', labelKey: 'profile.themeLight' },
  { value: 'dark', labelKey: 'profile.themeDark' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { preference, setTheme, tokens } = useTheme();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const currentLanguage = i18n.language || 'en';

  const handleLanguageSelect = (language: { code: LanguageCode; name: string; flag: string }) => {
    // Saved on this phone and, because the user chose it, sent to the account.
    void setLanguage(language.code);
  };

  const c = tokens.color;

  return (
    <Screen scroll noTopInset contentStyle={styles.content}>
      <ListItem
        icon="language-outline"
        title={t('profile.language')}
        onPress={() => setShowLanguageSelector(true)}
        trailing={<Text tone="muted">{LANGUAGE_NAMES[currentLanguage] ?? currentLanguage}</Text>}
      />

      <Text variant="heading" accessibilityRole="header" style={styles.heading}>
        {t('profile.theme')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('profile.theme')}
        style={[styles.segments, { backgroundColor: c.surfaceMuted }]}
      >
        {THEME_OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <PressableScale
              key={option.value}
              onPress={() => setTheme(option.value)}
              feedback
              accessibilityRole="radio"
              accessibilityLabel={t(option.labelKey)}
              accessibilityState={{ selected, checked: selected }}
              style={[styles.segment, selected && { backgroundColor: c.action }]}
            >
              <Text variant="label" style={{ color: selected ? c.onAction : c.text }}>
                {t(option.labelKey)}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onSelect={handleLanguageSelect}
        selectedLanguage={currentLanguage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, gap: 8 },
  heading: { marginTop: 24, marginBottom: 8 },
  segments: { flexDirection: 'row', borderRadius: 999, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
