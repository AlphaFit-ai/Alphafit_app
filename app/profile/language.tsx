import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { setLanguage } from '../../i18n/config';
import { LanguageCode } from '../../services/preferences';
import { PageHeader, PressableScale, Screen, Text } from '../../src/ui';

interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

/** How long the chosen language stays on this screen, marked, before it goes back. */
const LANGUAGE_BACK_MS = 250;

/**
 * Profile > Language. A tap marks the language and switches the app to it at once (one render, no
 * animation), then goes back to the profile. Saving it and telling the account happen in the background (`setLanguage`): the screen
 * never waits for the server.
 */
export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { tokens } = useTheme();
  const [picked, setPicked] = useState<LanguageCode | null>(null);
  const selected = picked ?? i18n.language;
  const c = tokens.color;

  useEffect(() => {
    if (!picked) return;
    const back = setTimeout(() => {
      if (router.canGoBack()) router.back();
    }, LANGUAGE_BACK_MS);
    return () => clearTimeout(back);
  }, [picked]);

  const choose = (code: LanguageCode) => {
    if (picked) return; // already on its way back
    setPicked(code);
    void setLanguage(code);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <PageHeader title={t('profile.language')} />
      <View accessibilityRole="radiogroup" style={styles.list}>
        {languages.map((language) => {
          const active = selected.startsWith(language.code);
          return (
            <PressableScale
              key={language.code}
              onPress={() => choose(language.code)}
              feedback
              accessibilityRole="radio"
              accessibilityLabel={language.nativeName}
              accessibilityState={{ selected: active, checked: active }}
              style={[
                styles.item,
                {
                  backgroundColor: active ? c.accentSoft : c.surfaceMuted,
                  borderColor: active ? c.accent : 'transparent',
                },
              ]}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <View style={styles.names}>
                <Text variant="bodyStrong">{language.nativeName}</Text>
                <Text variant="caption" tone="muted">
                  {language.name}
                </Text>
              </View>
              {active ? <Ionicons name="checkmark-circle" size={24} color={c.accentText} /> : null}
            </PressableScale>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  list: { gap: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  flag: { fontSize: 28 },
  names: { flex: 1, gap: 2 },
});
