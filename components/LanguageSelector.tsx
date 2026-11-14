import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LanguageCode } from '../services/preferences';
import { PressableScale, Sheet, Text } from '../src/ui';

interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (language: LanguageOption) => void;
  selectedLanguage: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

/** Language picker as a bottom sheet. */
export const LanguageSelector = ({
  visible,
  onClose,
  onSelect,
  selectedLanguage,
}: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const { tokens } = useTheme();

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('profile.selectLanguage')}
      closeLabel={t('common.close')}
    >
      <View accessibilityRole="radiogroup" style={styles.list}>
        {languages.map((language) => {
          const active = selectedLanguage.startsWith(language.code);
          return (
            <PressableScale
              key={language.code}
              onPress={() => {
                onSelect(language);
                onClose();
              }}
              feedback
              accessibilityRole="radio"
              accessibilityLabel={language.name}
              accessibilityState={{ selected: active, checked: active }}
              style={[
                styles.item,
                {
                  backgroundColor: active ? tokens.color.accentSoft : tokens.color.surfaceMuted,
                  borderColor: active ? tokens.color.accent : 'transparent',
                },
              ]}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <Text variant="bodyStrong" style={styles.name}>
                {language.name}
              </Text>
              {active ? (
                <Ionicons name="checkmark-circle" size={24} color={tokens.color.accentText} />
              ) : null}
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  list: { gap: 8, paddingBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  flag: { fontSize: 24 },
  name: { flex: 1 },
});
